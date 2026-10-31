export type SchemeView = {
  slug: string;
  nameEn: string;
  nameHi: string | null;
  level: "central" | "state";
  state: string | null;
  department: string;
  categories: string[];
  targetBeneficiaries: string;
  descriptionEn: string;
  descriptionHi: string | null;
  benefits: string;
  eligibilityText: string;
  eligibilityRules: unknown;
  documentsRequired: string[];
  applicationSteps: string[];
  officialApplyUrl: string;
  sourceUrl: string;
  dataOrigin: "curated_from_public_page" | "live_api";
  lastCheckedAt: string | null; // ISO date
  verificationStatus: "verified" | "needs_verification" | "outdated";
  hiReviewed: boolean;
};

/** What the LLM sees: only retrieved, verified records. */
export type ContextScheme = {
  id: string;
  name: string;
  level: string;
  state: string | null;
  department: string;
  beneficiaries: string;
  description: string;
  benefits: string;
  eligibility: string;
  documents: string[];
  steps: string[];
  official_link: string;
  source_url: string;
  last_checked: string;
};

export type Citation = { slug: string; name: string; nameHi: string | null; sourceUrl: string; lastChecked: string | null };
