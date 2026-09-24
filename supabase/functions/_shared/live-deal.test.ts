import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { approvedBookingHosts, isActiveLiveDeal, isApprovedHttpsUrl } from "./live-deal.ts";

const hosts = approvedBookingHosts("provider.example, aviasales.com");
const base = {
  link_kind: "live_source",
  depart_date: "2026-09-01",
  valid_until: "2026-08-12T00:00:00Z",
  price: 2_000_000,
  duration: "2h",
  booking_url: "https://offers.provider.example/1",
};

Deno.test("validates approved HTTPS booking hosts including subdomains", () => {
  assertEquals(isApprovedHttpsUrl("https://offers.provider.example/1", hosts), true);
  assertEquals(isApprovedHttpsUrl("http://provider.example/1", hosts), false);
  assertEquals(isApprovedHttpsUrl("https://provider.example.evil.test/1", hosts), false);
});

Deno.test("active live deals fail closed for legacy, stale and unapproved rows", () => {
  const now = new Date("2026-08-11T00:00:00Z");
  assertEquals(isActiveLiveDeal(base, hosts, now), true);
  assertEquals(isActiveLiveDeal({ ...base, link_kind: undefined }, hosts, now), false);
  assertEquals(isActiveLiveDeal({ ...base, valid_until: "2026-08-10T00:00:00Z" }, hosts, now), false);
  assertEquals(isActiveLiveDeal({ ...base, booking_url: "https://evil.test/1" }, hosts, now), false);
});

Deno.test("affiliate deals require network and approved affiliate URL", () => {
  const now = new Date("2026-08-11T00:00:00Z");
  assertEquals(isActiveLiveDeal({ ...base, link_kind: "live_affiliate", affiliate_network: "network", affiliate_url: "https://aviasales.com/offer" }, hosts, now), true);
  assertEquals(isActiveLiveDeal({ ...base, link_kind: "live_affiliate" }, hosts, now), false);
});
