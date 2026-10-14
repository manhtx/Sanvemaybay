/** Applied identically to page, RouteBest and freshness queries; do not reimplement separately. */
export interface ObservedQueryScope {
  eq(column: string, value: unknown): ObservedQueryScope;
  is(column: string, value: unknown): ObservedQueryScope;
  or(filters: string): ObservedQueryScope;
  lte(column: string, value: unknown): ObservedQueryScope;
  gte(column: string, value: unknown): ObservedQueryScope;
  lt(column: string, value: unknown): ObservedQueryScope;
}

export function isSafeObservedTextFilter(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const normalized = value.trim().normalize("NFKC");
  return normalized.length === 0 || (normalized.length <= 80 && /^[\p{L}\p{N}\s-]+$/u.test(normalized));
}

export function applyObservedScope<T extends ObservedQueryScope>(
  initialQuery: T,
  body: Record<string, unknown>,
): T {
  if (!isSafeObservedTextFilter(body.destination) || !isSafeObservedTextFilter(body.search_text)) {
    throw new RangeError("INVALID_SEARCH_FILTER");
  }
  let query: ObservedQueryScope = initialQuery;
    const targetId = typeof body.id === "string" && body.id
      ? body.id
      : typeof body.observation_id === "string"
        ? body.observation_id
        : typeof body.opportunity_id === "string"
          ? body.opportunity_id
          : undefined;
    if (targetId) {
      const raw = targetId.replace(/^observed-/, "").trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
        query = query.eq("observation_id", raw);
      } else if (raw.split(":").length >= 7) {
        query = query.eq("dedupe_key", raw);
      } else if (raw.split(":").length === 6) {
        const [orig, dest, depart, ret, airline, stops] = raw.split(":");
        query = query
          .eq("origin_code", orig.toUpperCase())
          .eq("destination_code", dest.toUpperCase())
          .eq("depart_date", depart);
        if (ret) query = query.eq("return_date", ret);
        if (airline) query = query.eq("airline_code", airline.toUpperCase());
        if (stops === "UNKNOWN") query = query.is("stops", null);
        else if (/^\d+$/.test(stops)) query = query.eq("stops", Number(stops));
        else if (stops !== "") throw new RangeError("INVALID_OPPORTUNITY_ID");
      } else {
        query = query.eq("dedupe_key", raw);
      }
    }
    if (typeof body.origin === "string" && body.origin) query = query.eq("origin_code", body.origin.trim().toUpperCase());
    if (typeof body.destination === "string" && body.destination.trim()) {
      const dest = body.destination.trim();
      if (/^[A-Za-z]{3}$/.test(dest)) {
        query = query.eq("destination_code", dest.toUpperCase());
      } else {
        query = query.or(`destination_code.ilike.%${dest}%,destination.ilike.%${dest}%,country.ilike.%${dest}%`);
      }
    }
    if (typeof body.search_text === "string" && body.search_text.trim()) {
      const term = body.search_text.trim();
      query = query.or(`destination_code.ilike.%${term}%,destination.ilike.%${term}%,country.ilike.%${term}%,origin_code.ilike.%${term}%,origin.ilike.%${term}%`);
    }
    if (typeof body.region === "string" && body.region !== "all") query = query.eq("region", body.region);
    if (body.direct_only === true) query = query.eq("stops", 0);
    const maxStops = body.max_stops == null ? NaN : Number(body.max_stops);
    if (Number.isInteger(maxStops) && maxStops >= 0) query = query.lte("stops", maxStops);
    const maxPrice = Number(body.max_price ?? body.budget);
    if (Number.isFinite(maxPrice) && maxPrice > 0) query = query.lte("price", maxPrice);
    if (typeof body.depart_date_from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.depart_date_from)) {
      query = query.gte("depart_date", body.depart_date_from);
    }
    if (typeof body.depart_date_to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.depart_date_to)) {
      query = query.lte("depart_date", body.depart_date_to);
    }
    if (typeof body.return_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.return_date)) {
      query = query.eq("return_date", body.return_date);
    }
    if (typeof body.return_date_from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.return_date_from)) {
      query = query.gte("return_date", body.return_date_from);
    }
    if (typeof body.return_date_to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.return_date_to)) {
      query = query.lte("return_date", body.return_date_to);
    }
    if (typeof body.month === "string" && body.month !== "all") {
      const slashMatch = body.month.match(/^(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const m = slashMatch[1].padStart(2, "0");
        const y = slashMatch[2];
        const nextM = Number(m) === 12 ? "01" : String(Number(m) + 1).padStart(2, "0");
        const nextY = Number(m) === 12 ? String(Number(y) + 1) : y;
        query = query.gte("depart_date", `${y}-${m}-01`).lt("depart_date", `${nextY}-${nextM}-01`);
      } else if (/^\d{4}-\d{2}$/.test(body.month)) {
        const [y, m] = body.month.split("-");
        const nextM = Number(m) === 12 ? "01" : String(Number(m) + 1).padStart(2, "0");
        const nextY = Number(m) === 12 ? String(Number(y) + 1) : y;
        query = query.gte("depart_date", `${y}-${m}-01`).lt("depart_date", `${nextY}-${nextM}-01`);
      }
    }


    if (typeof body.currency === "string" && /^[A-Za-z]{3}$/.test(body.currency)) {
      query = query.eq("currency", body.currency.toUpperCase());
    }
  return query as T;
}
