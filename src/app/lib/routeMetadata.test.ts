import { describe, expect, it } from "vitest";
import { getRouteMetadata } from "./routeMetadata";

describe("getRouteMetadata", () => {
  it("returns indexable metadata for public discovery routes", () => {
    const metadata = getRouteMetadata("/deals");
    expect(metadata.title).toContain("Deal vé máy bay");
    expect(metadata.indexable).toBe(true);
  });

  it("uses generic detail metadata without exposing an untrusted identifier", () => {
    const metadata = getRouteMetadata("/deals/provider-secret-id");
    expect(metadata.title).toBe("Chi tiết deal vé máy bay | FlyCheap AI");
    expect(metadata.title).not.toContain("provider-secret-id");
  });

  it("prevents account, action and unknown routes from being indexed", () => {
    expect(getRouteMetadata("/auth").indexable).toBe(false);
    expect(getRouteMetadata("/alerts/confirm").indexable).toBe(false);
    expect(getRouteMetadata("/missing").indexable).toBe(false);
  });
});
