import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { matchesAlert, selectDailyDeal } from "../_shared/alert-matching.ts";
import { nextNotificationRetry } from "../_shared/retry-policy.ts";
import { approvedBookingHosts, isActiveLiveDeal } from "../_shared/live-deal.ts";
import { safeOperationalErrorCode } from "../_shared/observability.ts";
import { evaluateWatchCondition, WatchConditionEpisode } from "../_shared/watch-condition.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ]!,
  );
}

async function signAlertId(alertId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(alertId));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendEmail(alert: any, deal: any, eventType = "ENTERED"): Promise<string> {
  const key = Deno.env.get("RESEND_API_KEY");
  const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
  const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") ?? "";
  if (!key || !alert.email || !publicSiteUrl || !unsubscribeSecret) {
    throw new Error("Email provider is not configured.");
  }
  const signature = await signAlertId(alert.id, unsubscribeSecret);
  const unsubscribeUrl = `${publicSiteUrl}/alerts/unsubscribe?id=${encodeURIComponent(alert.id)}&signature=${signature}`;

  // Copy truth according to trigger reason (REQ-NOTIF-006, Section 54)
  let headline = "Giá Farely vừa quan sát đã chạm mức bạn đặt";
  if (eventType === "MATERIAL_IMPROVEMENT") {
    headline = "Giá vé vừa giảm sâu thêm so với lần quan sát trước";
  } else if (eventType === "REENTERED") {
    headline = "Giá vé vừa quay trở lại mức bạn mong muốn";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: Deno.env.get("ALERT_FROM_EMAIL") ?? "Farely Alerts <alerts@resend.dev>",
      to: [alert.email],
      subject: `[Farely] ${deal.from_code} → ${deal.to_code}: ${Number(deal.price).toLocaleString("vi-VN")} VND`,
      html: `<h2>${headline}</h2>
        <p>${escapeHtml(deal.from)} → ${escapeHtml(deal.to)}</p>
        <p><strong>${Number(deal.price).toLocaleString("vi-VN")} VND</strong></p>
        <p>Ghi nhận lúc ${escapeHtml(deal.observed_at ?? new Date().toISOString())}.</p>
        <p><a href="${publicSiteUrl}/deals">Kiểm tra giá hiện tại trên Farely</a></p>
        <hr/>
        <p><small><a href="${unsubscribeUrl}">Hủy theo dõi chặng bay này</a></small></p>`,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? "Resend rejected the message.");
  return payload.id;
}

async function sendTelegram(alert: any, deal: any): Promise<string> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token || !alert.telegram_id) throw new Error("Telegram provider is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: alert.telegram_id,
      text: `🔥 [Farely] ${deal.from_code} → ${deal.to_code}\n${Number(deal.price).toLocaleString("vi-VN")} VND\nKiểm tra giá hiện tại tại farely.manhtx.com`,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.description ?? "Telegram rejected the message.");
  return String(payload.result.message_id);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);

  try {
    const { data: activeGen } = await supabase
      .from("active_observed_generation")
      .select("active_generation_id")
      .eq("id", 1)
      .maybeSingle();

    const [
      { data: alerts, error: alertError },
      { data: deals, error: dealError },
      { data: existingEpisodes },
    ] = await Promise.all([
      supabase.from("user_alerts").select("*").in("status", ["ACTIVE", "active"]),
      supabase
        .from("deals")
        .select("*")
        .gte("depart_date", todayDate)
        .gt("valid_until", nowIso)
        .gte("observed_at", new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()),
      supabase.from("watch_condition_episodes").select("*").is("closed_at", null),
    ]);
    if (alertError) throw alertError;
    if (dealError) throw dealError;

    const episodesByWatch = new Map<string, WatchConditionEpisode>();
    for (const ep of (existingEpisodes ?? []) as WatchConditionEpisode[]) {
      episodesByWatch.set(ep.watch_id, ep);
    }

    const observedSnapshots: Array<Record<string, unknown>> = [];
    if (activeGen?.active_generation_id) {
      let pageOffset = 0;
      const pageSize = 1000;
      while (true) {
        const { data: pageData, error: observedError } = await supabase
          .from("observed_fare_snapshots")
          .select("*")
          .eq("generation_id", activeGen.active_generation_id)
          .gte("depart_date", todayDate)
          .range(pageOffset, pageOffset + pageSize - 1);
        if (observedError) {
          console.warn("Notice: observed_fare_snapshots query returned:", observedError.message);
          break;
        }
        if (!pageData || pageData.length === 0) break;
        observedSnapshots.push(...(pageData as Array<Record<string, unknown>>));
        if (pageData.length < pageSize) break;
        pageOffset += pageSize;
      }
    } else {
      console.warn("Notice: No active generation pointer, failing closed for observed snapshots in alert evaluation");
    }

    const bookingHosts = approvedBookingHosts(Deno.env.get("APPROVED_BOOKING_HOSTS"));
    const activeDeals = (deals ?? []).filter((deal) => isActiveLiveDeal(deal, bookingHosts)).map((deal) => ({
      ...deal,
      is_observed: false,
      opportunity_id: deal.id,
    }));

    const activeObserved = (observedSnapshots ?? []).map((row) => {
      const stableOppId = [
        row.origin_code,
        row.destination_code,
        row.depart_date,
        row.return_date ?? "",
        row.airline_code,
        row.flight_number ?? "",
        row.stops ?? 0,
      ].join(":");
      return {
        id: row.observation_id,
        opportunity_id: stableOppId,
        is_observed: true,
        from: row.origin,
        from_code: row.origin_code,
        to: row.destination,
        to_code: row.destination_code,
        price: Number(row.price),
        discount: Number(row.discount_percent ?? 0),
        trip_type: row.region === "domestic" ? "domestic" : "international",
        deal_score: Number(row.deal_score ?? 0),
        depart_date: row.depart_date,
        return_date: row.return_date,
        booking_url: row.booking_url,
        observed_at: row.observed_at,
        airline: row.airline,
        airline_code: row.airline_code,
        flight_number: row.flight_number,
        stops: row.stops,
      };
    });

    const allCandidates = [...activeDeals, ...activeObserved];
    let evaluationsCount = 0;
    let outboxCreated = 0;

    // STEP 1: Watch Evaluation & Transactional Condition Updates (REQ-WATCH-013..018, REQ-NOTIF-001)
    for (const alert of alerts ?? []) {
      // Check date expiration (REQ-WATCH-012, Section 50)
      if (alert.depart_date_to && alert.depart_date_to < todayDate) {
        await supabase.from("user_alerts").update({ status: "EXPIRED" }).eq("id", alert.id);
        continue;
      }

      // 1. Find all candidates on this route matching base route/intent criteria (without target_price filter!)
      const routeCandidates = allCandidates.filter((deal) => matchesAlert(alert, deal));

      let conditionInput: "MATCH" | "CONFIRMED_NON_MATCH" | "INSUFFICIENT_EVIDENCE";
      let bestCandidate: any = null;
      let observedBestPrice: number | null = null;
      let eligibleCandidates: any[] = [];

      if (routeCandidates.length === 0) {
        // F18: No candidates observed on this route in the active generation -> INSUFFICIENT_EVIDENCE
        // Preserves active episode state; never false EXITED.
        conditionInput = "INSUFFICIENT_EVIDENCE";
      } else {
        // Filter by max_stops if specified
        let stopFiltered = routeCandidates;
        if (alert.max_stops != null && alert.max_stops >= 0) {
          stopFiltered = routeCandidates.filter((deal) => deal.stops == null || Number(deal.stops) <= Number(alert.max_stops));
        }

        const targetBudget = Number(alert.target_price ?? alert.budget ?? 0);
        if (stopFiltered.length === 0) {
          // Route exists, but all flights violate stop constraint -> CONFIRMED_NON_MATCH
          conditionInput = "CONFIRMED_NON_MATCH";
          const sorted = [...routeCandidates].sort((a, b) => Number(a.price) - Number(b.price));
          observedBestPrice = Number(sorted[0].price);
        } else {
          const sorted = [...stopFiltered].sort((a, b) => Number(a.price) - Number(b.price));
          observedBestPrice = Number(sorted[0].price);
          if (targetBudget > 0 && observedBestPrice <= targetBudget) {
            conditionInput = "MATCH";
            eligibleCandidates = sorted.filter((d) => Number(d.price) <= targetBudget);
            bestCandidate = eligibleCandidates[0];
          } else {
            conditionInput = "CONFIRMED_NON_MATCH";
          }
        }
      }

      // Evaluate Condition Episode State Transition (REQ-DATA-004, F18)
      const targetBudget = Number(alert.target_price ?? alert.budget ?? 0);
      const currentEpisode = episodesByWatch.get(alert.id) || null;

      const evalResult = evaluateWatchCondition({
        watchId: alert.id,
        targetPrice: targetBudget > 0 ? targetBudget : Number.POSITIVE_INFINITY,
        observedPrice: observedBestPrice,
        conditionInput,
        activeEpisode: currentEpisode,
        generationId: activeGen?.active_generation_id ?? null,
        now: nowIso,
      });

      // Determine episode transition action for atomic RPC
      let episodeAction = "NO_CHANGE";
      if (evalResult.stateChanged && evalResult.nextEpisode) {
        if (evalResult.nextEpisode.state === "EXITED") {
          episodeAction = "CLOSE";
        } else if (evalResult.nextEpisode.state === "ENTERED" || evalResult.nextEpisode.state === "REENTERED") {
          episodeAction = "CREATE";
        } else {
          episodeAction = "UPDATE";
        }
      }

      // Prepare outbox payloads if condition triggers notification
      const outboxItems: Array<Record<string, unknown>> = [];
      if (evalResult.shouldAlert && bestCandidate && evalResult.nextEpisode) {
        const channels = [
          alert.notify_email && "EMAIL",
          alert.notify_telegram && "TELEGRAM",
        ].filter(Boolean) as string[];

        for (const channelName of channels) {
          outboxItems.push({
            event_type: evalResult.nextEpisode.state,
            channel: channelName,
            dedupe_key: `${alert.id}:${evalResult.nextEpisode.id}:${evalResult.nextEpisode.state}:${channelName}:${Math.round(bestCandidate.price)}`,
            payload: {
              alert,
              deal: bestCandidate,
              event_type: evalResult.nextEpisode.state,
            },
          });
        }
      }

      // STEP 1: Atomic Watch Evaluation & Condition Update (REQ-WATCH-013..018, REQ-NOTIF-001, NODE OUTBOX-01)
      const { data: evalResultRpc, error: evalRpcError } = await supabase.rpc("apply_watch_evaluation", {
        p_watch_id: alert.id,
        p_now: nowIso,
        p_generation_id: activeGen?.active_generation_id ?? null,
        p_eligible_count: eligibleCandidates.length,
        p_best_price: bestCandidate ? Number(bestCandidate.price) : null,
        p_episode_action: episodeAction,
        p_episode_id: evalResult.nextEpisode?.id ?? null,
        p_condition_fingerprint: evalResult.nextEpisode?.condition_fingerprint ?? null,
        p_episode_state: evalResult.nextEpisode?.state ?? null,
        p_entry_price: evalResult.nextEpisode?.entry_price ?? null,
        p_best_episode_price: evalResult.nextEpisode?.best_price ?? null,
        p_outbox_items: outboxItems,
        p_release_sha: Deno.env.get("DEPLOYED_COMMIT") ?? null,
      });

      if (evalRpcError) {
        // Fail closed (S02 / A07): Never fall back to weaker sequential writes.
        // On RPC failure, no partial condition transition or outbox row is created;
        // previous canonical episode state is preserved intact.
        console.warn("Notice: apply_watch_evaluation RPC failed, preserving canonical episode state:", evalRpcError.message);
        continue;
      }

      evaluationsCount++;
      outboxCreated += Number(evalResultRpc?.outbox_count ?? 0);
    }

    // STEP 2: The Notification Dispatcher (Executes Strictly Post-Evaluation Transaction) (S03, S04, S05, A09, A10)
    let pendingOutbox: Array<Record<string, any>> = [];
    const workerId = `worker_${crypto.randomUUID()}`;
    const { data: claimedOutbox, error: claimError } = await supabase.rpc("claim_notification_outbox", {
      p_batch_size: 50,
      p_worker_id: workerId,
      p_lease_seconds: 300,
    });

    if (claimError || !claimedOutbox) {
      // Fail closed (S03 / A09): Never fall back to non-atomic SELECT.
      console.warn("Notice: claim_notification_outbox RPC unavailable, skipping dispatch cycle:", claimError?.message);
      pendingOutbox = [];
    } else {
      pendingOutbox = claimedOutbox as Array<Record<string, any>>;
    }

    let sent = 0;
    let failed = 0;

    for (const item of pendingOutbox) {
      const attemptNo = Number(item.attempt_count ?? 1);
      const { alert, deal, event_type } = item.payload;

      try {
        let providerId = "";
        if (item.channel === "EMAIL") {
          providerId = await sendEmail(alert, deal, event_type);
        } else if (item.channel === "TELEGRAM") {
          providerId = await sendTelegram(alert, deal);
        }

        // S04 & S05: Atomic resolution RPC verifying lease claim_token and recording delivery attempt
        const { error: resolveErr } = await supabase.rpc("resolve_notification_outbox", {
          p_id: item.id,
          p_claim_token: item.claim_token,
          p_status: "SENT",
          p_provider: item.channel === "EMAIL" ? "resend" : "telegram",
          p_provider_message_id: providerId,
          p_error_code: null,
          p_next_attempt_at: null,
        });

        if (resolveErr) {
          console.warn("resolve_notification_outbox warning:", resolveErr.message);
          failed++;
        } else {
          sent++;
        }
      } catch (sendErr) {
        const errCode = safeOperationalErrorCode(sendErr, "delivery_failed");
        const isPermanent = attemptNo >= 3;
        const nextRetry = isPermanent ? null : (nextNotificationRetry(attemptNo - 1).nextRetryAt ?? nowIso);
        const resolved = isPermanent
          ? { status: "PERMANENT_FAILED" as const }
          : { status: "RETRYABLE_FAILED" as const };

        await supabase.rpc("resolve_notification_outbox", {
          p_id: item.id,
          p_claim_token: item.claim_token,
          p_status: resolved.status,
          p_provider: item.channel === "EMAIL" ? "resend" : "telegram",
          p_provider_message_id: null,
          p_error_code: errCode,
          p_next_attempt_at: nextRetry,
        });

        failed++;
      }
    }

    return json({
      success: true,
      evaluations_count: evaluationsCount,
      outbox_created: outboxCreated,
      dispatched_sent: sent,
      dispatched_failed: failed,
    });
  } catch (error) {
    return json({ error: "Alert processing failed", error_code: safeOperationalErrorCode(error) }, 500);
  }
});
