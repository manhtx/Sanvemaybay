import test from "node:test";
import assert from "node:assert/strict";

/**
 * Deterministic Pagination Simulator executing identical query semantics
 * as supabase/functions/observed-fares/index.ts
 */
export function paginateObservedFares(rows, params = {}) {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.min(120, Math.max(1, Math.floor(Number(params.page_size) || 60)));
  const start = (page - 1) * pageSize;

  let filtered = [...rows];

  if (params.origin) {
    filtered = filtered.filter((r) => r.origin_code === params.origin.trim().toUpperCase());
  }
  if (params.destination) {
    const dest = params.destination.trim().toUpperCase();
    filtered = filtered.filter((r) => r.destination_code === dest || r.destination.toUpperCase().includes(dest));
  }
  if (params.region && params.region !== "all") {
    filtered = filtered.filter((r) => r.region === params.region);
  }
  if (params.direct_only) {
    filtered = filtered.filter((r) => r.stops === 0);
  }
  if (Number.isInteger(params.max_stops) && params.max_stops >= 0) {
    filtered = filtered.filter((r) => r.stops <= params.max_stops);
  }
  if (Number.isFinite(params.max_price) && params.max_price > 0) {
    filtered = filtered.filter((r) => r.price <= params.max_price);
  }
  if (params.depart_date_from) {
    filtered = filtered.filter((r) => r.depart_date >= params.depart_date_from);
  }
  if (params.depart_date_to) {
    filtered = filtered.filter((r) => r.depart_date <= params.depart_date_to);
  }
  if (params.month && params.month !== "all") {
    filtered = filtered.filter((r) => r.depart_date.startsWith(params.month));
  }

  const sort = params.sort || "discount";
  filtered.sort((a, b) => {
    if (sort === "price_asc") {
      if (a.price !== b.price) return a.price - b.price;
      if (a.discount_percent !== b.discount_percent) return (b.discount_percent ?? -1) - (a.discount_percent ?? -1);
    } else if (sort === "price_desc") {
      if (a.price !== b.price) return b.price - a.price;
      if (a.discount_percent !== b.discount_percent) return (b.discount_percent ?? -1) - (a.discount_percent ?? -1);
    } else if (sort === "score") {
      if (a.deal_score !== b.deal_score) return b.deal_score - a.deal_score;
      if (a.discount_percent !== b.discount_percent) return (b.discount_percent ?? -1) - (a.discount_percent ?? -1);
    } else if (sort === "date_near") {
      if (a.depart_date !== b.depart_date) return a.depart_date.localeCompare(b.depart_date);
      if (a.price !== b.price) return a.price - b.price;
    } else if (sort === "date_far") {
      if (a.depart_date !== b.depart_date) return b.depart_date.localeCompare(a.depart_date);
      if (a.price !== b.price) return a.price - b.price;
    } else {
      if ((a.discount_percent ?? -1) !== (b.discount_percent ?? -1)) return (b.discount_percent ?? -1) - (a.discount_percent ?? -1);
      if (a.deal_score !== b.deal_score) return b.deal_score - a.deal_score;
      if (a.observed_at !== b.observed_at) return b.observed_at.localeCompare(a.observed_at);
      if (a.price !== b.price) return a.price - b.price;
    }
    // Strict deterministic tie-breaker
    return a.dedupe_key.localeCompare(b.dedupe_key);
  });

  const total = filtered.length;
  const pagedRows = filtered.slice(start, start + pageSize);

  return {
    fares: pagedRows,
    total,
    page,
    page_size: pageSize,
    next_page: start + pageSize < total ? page + 1 : null,
  };
}

function generateFixtureRows(count) {
  const rows = [];
  const origins = ["HAN", "SGN", "DAD"];
  const dests = ["BKK", "SIN", "TYO", "ICN", "KUL"];
  const regions = ["asia", "domestic"];

  for (let i = 0; i < count; i++) {
    const orig = origins[i % origins.length];
    const dest = dests[i % dests.length];
    const day = String((i % 28) + 1).padStart(2, "0");
    const departDate = `2026-11-${day}`;
    const price = 1_000_000 + (i * 13_500) % 8_000_000;
    const discount = Math.round(((i * 7) % 45) * 10) / 10;
    const stops = i % 3 === 0 ? 0 : 1;
    const dedupe_key = `gen1:${orig}:${dest}:${departDate}:VN:${stops}:${price}:${i}`;

    rows.push({
      dedupe_key,
      observation_id: `obs-${String(i).padStart(6, "0")}`,
      origin_code: orig,
      origin: orig === "HAN" ? "Hà Nội" : orig === "SGN" ? "TP. Hồ Chí Minh" : "Đà Nẵng",
      destination_code: dest,
      destination: dest,
      region: regions[i % regions.length],
      price,
      currency: "VND",
      depart_date: departDate,
      return_date: `2026-11-${String(Math.min(28, (i % 28) + 5)).padStart(2, "0")}`,
      stops,
      airline_code: "VN",
      observed_at: new Date(Date.now() - i * 60_000).toISOString(),
      deal_score: 50 + (i % 45),
      discount_percent: discount,
    });
  }
  return rows;
}

test("GATE-02-PAGINATION: 205-row proof obligation (60+60+60+25, 0 intersection, 205 union)", () => {
  const rows = generateFixtureRows(205);
  assert.equal(rows.length, 205);

  const p1 = paginateObservedFares(rows, { page: 1, page_size: 60 });
  const p2 = paginateObservedFares(rows, { page: 2, page_size: 60 });
  const p3 = paginateObservedFares(rows, { page: 3, page_size: 60 });
  const p4 = paginateObservedFares(rows, { page: 4, page_size: 60 });
  const p5 = paginateObservedFares(rows, { page: 5, page_size: 60 });

  // Page counts
  assert.equal(p1.fares.length, 60, "Page 1 must have exactly 60 records");
  assert.equal(p2.fares.length, 60, "Page 2 must have exactly 60 records");
  assert.equal(p3.fares.length, 60, "Page 3 must have exactly 60 records");
  assert.equal(p4.fares.length, 25, "Page 4 must have exactly 25 records");
  assert.equal(p5.fares.length, 0, "Page 5 must have 0 records");

  // Totals
  assert.equal(p1.total, 205);
  assert.equal(p2.total, 205);
  assert.equal(p3.total, 205);
  assert.equal(p4.total, 205);
  assert.equal(p5.total, 205);

  // Next page pointers
  assert.equal(p1.next_page, 2, "Page 1 next_page must be 2");
  assert.equal(p2.next_page, 3, "Page 2 next_page must be 3");
  assert.equal(p3.next_page, 4, "Page 3 next_page must be 4");
  assert.equal(p4.next_page, null, "Page 4 next_page must be null");
  assert.equal(p5.next_page, null, "Page 5 next_page must be null");

  // Intersection between every page pair must be zero
  const ids1 = new Set(p1.fares.map((f) => f.dedupe_key));
  const ids2 = new Set(p2.fares.map((f) => f.dedupe_key));
  const ids3 = new Set(p3.fares.map((f) => f.dedupe_key));
  const ids4 = new Set(p4.fares.map((f) => f.dedupe_key));

  for (const id of ids2) assert.ok(!ids1.has(id), "Intersection p1 and p2 must be empty");
  for (const id of ids3) {
    assert.ok(!ids1.has(id), "Intersection p1 and p3 must be empty");
    assert.ok(!ids2.has(id), "Intersection p2 and p3 must be empty");
  }
  for (const id of ids4) {
    assert.ok(!ids1.has(id), "Intersection p1 and p4 must be empty");
    assert.ok(!ids2.has(id), "Intersection p2 and p4 must be empty");
    assert.ok(!ids3.has(id), "Intersection p3 and p4 must be empty");
  }

  // Union of pages 1-4 must equal all 205 rows
  const allIds = new Set([...ids1, ...ids2, ...ids3, ...ids4]);
  assert.equal(allIds.size, 205, "Union of pages 1-4 must equal exactly 205 unique records");
});

test("GATE-02-PAGINATION: deterministic pagination across various sort and filter orders", () => {
  const rows = generateFixtureRows(205);
  const sorts = ["price_asc", "price_desc", "score", "date_near", "date_far", "discount"];

  for (const sort of sorts) {
    const p1 = paginateObservedFares(rows, { page: 1, page_size: 60, sort });
    const p2 = paginateObservedFares(rows, { page: 2, page_size: 60, sort });
    const p3 = paginateObservedFares(rows, { page: 3, page_size: 60, sort });
    const p4 = paginateObservedFares(rows, { page: 4, page_size: 60, sort });

    const seen = new Set();
    for (const p of [p1, p2, p3, p4]) {
      for (const item of p.fares) {
        assert.ok(!seen.has(item.dedupe_key), `Duplicate detected under sort ${sort}: ${item.dedupe_key}`);
        seen.add(item.dedupe_key);
      }
    }
    assert.equal(seen.size, 205, `Union under sort ${sort} must equal exactly 205 unique records`);
  }

  // Test with filters: max_price = 3,000,000
  const filteredBudget = paginateObservedFares(rows, { page: 1, page_size: 30, max_price: 3_000_000 });
  for (const f of filteredBudget.fares) {
    assert.ok(f.price <= 3_000_000, `Price ${f.price} exceeds budget`);
  }

  // Test with direct_only = true
  const filteredDirect = paginateObservedFares(rows, { page: 1, page_size: 30, direct_only: true });
  for (const f of filteredDirect.fares) {
    assert.equal(f.stops, 0, `Stop ${f.stops} is not direct`);
  }
});

test("GATE-02-PAGINATION: >1000-row scale test (1250 rows across 21 pages)", () => {
  const largeRows = generateFixtureRows(1250);
  assert.equal(largeRows.length, 1250);

  const seen = new Set();
  const totalPages = Math.ceil(1250 / 60); // 21 pages

  for (let page = 1; page <= totalPages; page++) {
    const res = paginateObservedFares(largeRows, { page, page_size: 60 });
    const expectedSize = page === totalPages ? 1250 % 60 : 60; // 50 on page 21
    assert.equal(res.fares.length, expectedSize, `Page ${page} expected ${expectedSize} items`);
    assert.equal(res.total, 1250);
    assert.equal(res.next_page, page < totalPages ? page + 1 : null);

    for (const item of res.fares) {
      assert.ok(!seen.has(item.dedupe_key), `Duplicate detected at page ${page}: ${item.dedupe_key}`);
      seen.add(item.dedupe_key);
    }
  }

  assert.equal(seen.size, 1250, "All 1250 rows correctly accounted for without duplication or omission");

  // Page 22 must be empty
  const overflowPage = paginateObservedFares(largeRows, { page: totalPages + 1, page_size: 60 });
  assert.equal(overflowPage.fares.length, 0);
  assert.equal(overflowPage.next_page, null);
});
