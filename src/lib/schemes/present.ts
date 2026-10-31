import type { Citation, ContextScheme, SchemeView } from "./types";

/** DD-MM-YYYY, as the brief requires. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const p = (n: number) => String(n).padStart(2, "0");

  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

export type BadgeKind = "live" | "retrieved" | "cached" | "unverified";

export function originBadge(
  s: Pick<SchemeView, "dataOrigin" | "verificationStatus" | "lastCheckedAt">
): BadgeKind {
  if (s.verificationStatus !== "verified") return "unverified";
  if (s.dataOrigin === "live_api") return "live";
  return s.lastCheckedAt ? "cached" : "retrieved";
}

/**
 * Allows unverified schemes to appear in the public catalogue
 * only when SHOW_UNVERIFIED=true.
 *
 * The chatbot must continue retrieving verified schemes only.
 */
export function showUnverified(): boolean {
  return process.env.SHOW_UNVERIFIED === "true";
}

export function displayName(s: Pick<SchemeView, "nameEn" | "nameHi">, locale: string) {
  return locale === "hi" && s.nameHi ? s.nameHi : s.nameEn;
}

export function displayDescription(
  s: Pick<SchemeView, "descriptionEn" | "descriptionHi">,
  locale: string
) {
  return locale === "hi" && s.descriptionHi ? s.descriptionHi : s.descriptionEn;
}

export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.।](?:\s|$)/);
  return (m ? m[0] : text).trim();
}

export function toContext(s: SchemeView, locale: string): ContextScheme {
  return {
    id: s.slug,
    name: locale === "hi" && s.nameHi ? `${s.nameHi} (${s.nameEn})` : s.nameEn,
    level: s.level,
    state: s.state,
    department: s.department,
    beneficiaries: s.targetBeneficiaries,
    description: s.descriptionEn,
    benefits: s.benefits,
    eligibility: s.eligibilityText,
    documents: s.documentsRequired,
    steps: s.applicationSteps,
    official_link: s.officialApplyUrl,
    source_url: s.sourceUrl,
    last_checked: formatDate(s.lastCheckedAt) ?? "not recorded",
  };
}

export function toCitation(s: SchemeView): Citation {
  return {
    slug: s.slug,
    name: s.nameEn,
    nameHi: s.nameHi,
    sourceUrl: s.sourceUrl,
    lastChecked: formatDate(s.lastCheckedAt),
  };
}