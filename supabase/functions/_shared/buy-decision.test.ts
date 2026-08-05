import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideBuyRecommendation } from "./buy-decision.ts";

Deno.test("buy decision requires sufficient evidence", () => {
  assertEquals(decideBuyRecommendation({ discount: 35, confidence: 0.8, comparableSamples: 5 }), "buy_now");
  assertEquals(decideBuyRecommendation({ discount: 20, confidence: 0.8, comparableSamples: 5 }), "wait");
  assertEquals(decideBuyRecommendation({ discount: 35, confidence: 0.8, comparableSamples: 2 }), "wait");
});
