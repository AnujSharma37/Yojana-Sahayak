import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ruleNodeSchema } from "../src/lib/eligibility/rulesSchema";
import { CATEGORY_KEYS } from "../src/lib/validation/schemas";

export const seedScheme = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name_en: z.string().min(3),
  name_hi: z.string().nullable(),
  level: z.enum(["central", "state"]),
  state: z.string().nullable(),
  department: z.string(),
  categories: z.array(z.enum(CATEGORY_KEYS)).min(1),
  target_beneficiaries: z.string(),
  description_en: z.string(),
  description_hi: z.string().nullable(),
  benefits: z.string(),
  eligibility_text: z.string(),
  eligibility_rules: ruleNodeSchema.nullable(),
  documents_required: z.array(z.string()),
  application_steps: z.array(z.string()),
  official_apply_url: z.string().url().startsWith("https://"),
  source_url: z.string().url().startsWith("https://"),
  source_type: z.string(),
  data_origin: z.enum(["curated_from_public_page", "live_api"]),
  last_checked_at: z.string().date().nullable(),
  verification_status: z.enum(["verified", "needs_verification", "outdated"]),
  hi_reviewed: z.boolean(),
  curation_notes: z.string().optional(),
}).refine((s) => s.verification_status !== "verified" || s.last_checked_at !== null, {
  message: "A verified scheme must have last_checked_at",
});

export function loadSeed() {
  const file = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "schemes.seed.json"), "utf8"));
  return z.object({ schemes: z.array(seedScheme) }).parse(file).schemes;
}

