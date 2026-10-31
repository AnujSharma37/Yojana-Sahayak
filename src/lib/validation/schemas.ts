import { z } from "zod";
import { EDUCATION_LEVELS, GENDERS, INDIAN_STATES, OCCUPATIONS, SOCIAL_CATEGORIES } from "@/lib/eligibility/fields";

export const CATEGORY_KEYS = [
  "students", "women", "farmers", "senior_citizens", "entrepreneurs",
  "job_seekers", "persons_with_disabilities", "low_income_families",
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const localeSchema = z.enum(["en", "hi"]);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const schemeQuerySchema = z.object({
  q: optionalText(200),
  level: z.enum(["central", "state"]).optional(),
  state: z.enum(INDIAN_STATES).optional(),
  category: z.enum(CATEGORY_KEYS).optional(),
  department: optionalText(200),
  sort: z.enum(["relevance", "name", "updated"]).default("relevance"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  ids: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, 50) : undefined)),
});
export type SchemeQuery = z.infer<typeof schemeQuerySchema>;

export const profileSchema = z
  .object({
    age: z.number().int().min(0).max(120),
    state: z.enum(INDIAN_STATES),
    education_level: z.enum(EDUCATION_LEVELS),
    occupation: z.enum(OCCUPATIONS),
    family_income_annual: z.number().int().min(0).max(1_000_000_000),
    gender: z.enum(GENDERS),
    is_farmer: z.boolean(),
    has_disability: z.boolean(),
    is_bpl: z.boolean(),
    social_category: z.enum(SOCIAL_CATEGORIES),
    minority_community: z.boolean(),
  })
  .partial()
  .strict();

export const eligibilityRequestSchema = z.object({
  profile: profileSchema,
  locale: localeSchema.default("en"),
  schemeSlug: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30)
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "Last message must be from the user"),
  locale: localeSchema.default("en"),
});
