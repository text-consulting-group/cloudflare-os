import { describe, expect, it } from "vitest";
import { mergeEnabledCollections } from "../src/collection-kv.js";

const owned = [{
  id: "mine",
  title: "Mine",
  description: "private",
  source: "private" as const,
  lastUpdated: new Date("2026-01-02"),
}];

const publicCollections = [
  { id: "pub-0", title: "Public 0", description: "shared", visibility: "public" as const, documentCount: 1, lastUpdated: new Date("2026-01-01") },
  { id: "pub-1", title: "Public 1", description: "shared", visibility: "public" as const, documentCount: 1, lastUpdated: new Date("2026-01-01") },
];

describe("mergeEnabledCollections admin filter", () => {
  it("includes public collections for admins", () => {
    const result = mergeEnabledCollections([], publicCollections, true);
    expect(result.filter(r => r.source === "public")).toHaveLength(2);
  });

  it("excludes public collections for non-admins", () => {
    const result = mergeEnabledCollections([], publicCollections, false);
    expect(result.filter(r => r.source === "public")).toHaveLength(0);
    expect(result).toHaveLength(0);
  });

  it("keeps owned private collections for non-admins", () => {
    const result = mergeEnabledCollections(owned, publicCollections, false);
    expect(result.map(r => r.id)).toEqual(["mine"]);
    expect(result[0].source).toBe("private");
  });
});
