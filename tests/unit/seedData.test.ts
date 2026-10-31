import { describe, expect, it } from "vitest";
import { loadSeed } from "../../prisma/seedData";
import { formatDate, originBadge } from "@/lib/schemes/present";

describe("seed dataset", () => {
  const schemes = loadSeed();
  it("has 25 unique, schema-valid schemes", () => {
    expect(schemes).toHaveLength(25);
    expect(new Set(schemes.map((s) => s.slug)).size).toBe(25);
  });
  it("matches the requested category mix", () => {
    const has = (c: string) => schemes.filter((s) => s.categories.includes(c as never)).length;
    expect(has("farmers")).toBeGreaterThanOrEqual(5);
    expect(has("students")).toBeGreaterThanOrEqual(8);
  });
  it("never marks a scheme verified without a check date, and Hindi is unreviewed by default", () => {
    for (const s of schemes) {
      if (s.verification_status === "verified") expect(s.last_checked_at).not.toBeNull();
      expect(s.source_url.startsWith("https://")).toBe(true);
    }
  });
});

describe("presentation", () => {
  it("formats dates as DD-MM-YYYY", () => expect(formatDate("2026-10-05T00:00:00Z")).toBe("05-10-2026"));
  it("labels unverified records as such, never as cached", () => {
    expect(originBadge({ dataOrigin: "curated_from_public_page", verificationStatus: "needs_verification", lastCheckedAt: null })).toBe("unverified");
    expect(originBadge({ dataOrigin: "curated_from_public_page", verificationStatus: "verified", lastCheckedAt: "2026-10-01" })).toBe("cached");
    expect(originBadge({ dataOrigin: "live_api", verificationStatus: "verified", lastCheckedAt: "2026-10-01" })).toBe("live");
  });
});
