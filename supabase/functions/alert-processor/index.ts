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

      let matchingDeals = allCandidates.filter((deal) => matchesAlert(alert, deal));

      if (alert.target_price != null && Number(alert.target_price) > 0) {
        matchingDeals = matchingDeals.filter((deal) => Number(deal.price) <= Number(alert.target_price));
      }

      if (alert.max_stops != null && alert.max_stops >= 0) {
        matchingDeals = matchingDeals.filter((deal) => deal.stops == null || Number(deal.stops) <= Number(alert.max_stops));
      }

      const sortedByPrice = [...matchingDeals].sort((a, b) => Number(a.price) - Number(b.price));
      const bestCandidate = sortedByPrice.length > 0 ? sortedByPrice[0] : null;

      // Evaluate Condition Episode State Transition (REQ-DATA-004)
      const targetBudget = Number(alert.target_price ?? alert.budget ?? 0);
      const observedBestPrice = bestCandidate ? Number(bestCandidate.price) : Number.POSITIVE_INFINITY;
      const currentEpisode = episodesByWatch.get(alert.id) || null;

      const evalResult = evaluateWatchCondition({
        watchId: alert.id,
        targetPrice: targetBudget > 0 ? targetBudget : Number.POSITIVE_INFINITY,
        observedPrice: observedBestPrice,
        activeEpisode: currentEpisode,
        generationId: activeGen?.active_generation_id ?? null,
        now: nowIso,
      });

      // Update Watch tracking timestamps on user_alerts
      await supabase.from("user_alerts").update({
        last_checked_at: nowIso,
        last_attempt_at: nowIso,
        last_successful_check_at: nowIso,
        last_match_at: bestCandidate ? nowIso : alert.last_match_at,
        latest_eligible_price: bestCandidate ? Number(bestCandidate.price) : null,
        last_matched_price: bestCandidate ? Number(bestCandidate.price) : alert.last_matched_price,
        latest_price: bestCandidate ? Number(bestCandidate.price) : alert.latest_price,
      }).eq("id", alert.id);

      // Persist Condition Episode if changed
      if (evalResult.stateChanged && evalResult.nextEpisode) {
        await supabase.from("watch_condition_episodes").upsert({
          id: evalResult.nextEpisode.id,
          watch_id: alert.id,
          condition_fingerprint: evalResult.nextEpisode.condition_fingerprint,
          opened_at: evalResult.nextEpisode.opened_at,
          closed_at: evalResult.nextEpisode.closed_at,
          state: evalResult.nextEpisode.state,
          entry_price: evalResult.nextEpisode.entry_price,
          best_price: evalResult.nextEpisode.best_price,
          last_event_at: nowIso,
          generation_id: activeGen?.active_generation_id ?? null,
        });
      }

      // Record Watch Evaluation History (REQ-DATA-003)
      await supabase.from("watch_evaluations").insert({
        watch_id: alert.id,
        generation_id: activeGen?.active_generation_id ?? null,
        started_at: nowIso,
        completed_at: nowIso,
        status: activeGen?.active_generation_id ? "SUCCESS" : "DEGRADED",
        eligible_count: matchingDeals.length,
        best_price: bestCandidate ? Number(bestCandidate.price) : null,
        release_sha: Deno.env.get("DEPLOYED_COMMIT") ?? null,
      });
      evaluationsCount++;

      // If condition triggers notification, queue to notification_outbox (REQ-NOTIF-001)
      if (evalResult.shouldAlert && bestCandidate && evalResult.nextEpisode) {
        const channels = [
          alert.notify_email && "EMAIL",
          alert.notify_telegram && "TELEGRAM",
        ].filter(Boolean) as string[];

        for (const channelName of channels) {
          // Event-based deduplication key: prevents duplicate sends for same episode & price (REQ-NOTIF-003)
          const dedupeKey = `${alert.id}:${evalResult.nextEpisode.id}:${evalResult.nextEpisode.state}:${channelName}:${Math.round(bestCandidate.price)}`;

          const { error: outboxError } = await supabase.from("notification_outbox").insert({
            watch_id: alert.id,
            episode_id: evalResult.nextEpisode.id,
            event_type: evalResult.nextEpisode.state,
            channel: channelName,
            dedupe_key: dedupeKey,
            payload: {
              alert,
              deal: bestCandidate,
              event_type: evalResult.nextEpisode.state,
            },
            status: "PENDING",
            next_attempt_at: nowIso,
          });

          if (!outboxError) {
            outboxCreated++;
          }
        }
      }
    }

    // STEP 2: The Notification Dispatcher (Executes Strictly Post-Evaluation Transaction) (REQ-NOTIF-002)
    const { data: pendingOutbox } = await supabase
      .from("notification_outbox")
      .select("*")
      .in("status", ["PENDING", "RETRYABLE_FAILED"])
      .lte("next_attempt_at", nowIso)
      .limit(50);

    let sent = 0;
    let failed = 0;

    for (const item of pendingOutbox ?? []) {
      const attemptNo = Number(item.attempt_count ?? 0) + 1;
      const { alert, deal, event_type } = item.payload;

      try {
        let providerId = "";
        if (item.channel === "EMAIL") {
          providerId = await sendEmail(alert, deal, event_type);
        } else if (item.channel === "TELEGRAM") {
          providerId = await sendTelegram(alert, deal);
        }

        // Record successful attempt in notification_delivery_attempts (REQ-DATA-006)
        await supabase.from("notification_delivery_attempts").insert({
          outbox_id: item.id,
          attempt_no: attemptNo,
          provider: item.channel === "EMAIL" ? "resend" : "telegram",
          provider_message_id: providerId,
          status: "SUCCESS",
          attempted_at: new Date().toISOString(),
        });

        // Mark outbox item SENT
        await supabase.from("notification_outbox").update({
          status: "SENT",
          attempt_count: attemptNo,
          sent_at: new Date().toISOString(),
        }).eq("id", item.id);

        sent++;
      } catch (sendErr) {
        const errCode = safeOperationalErrorCode(sendErr, "delivery_failed");

        // Record failed attempt in notification_delivery_attempts
        await supabase.from("notification_delivery_attempts").insert({
          outbox_id: item.id,
          attempt_no: attemptNo,
          provider: item.channel === "EMAIL" ? "resend" : "telegram",
          status: "FAILED",
          error_code: errCode,
          attempted_at: new Date().toISOString(),
        });

        if (attemptNo >= 3) {
          await supabase.from("notification_outbox").update({
            status: "PERMANENT_FAILED",
            attempt_count: attemptNo,
          }).eq("id", item.id);
        } else {
          const retry = nextNotificationRetry(attemptNo - 1);
          await supabase.from("notification_outbox").update({
            status: "RETRYABLE_FAILED",
            attempt_count: attemptNo,
            next_attempt_at: retry.nextRetryAt ?? new Date().toISOString(),
          }).eq("id", item.id);
        }
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
