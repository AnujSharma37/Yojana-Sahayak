// Profile fields the checker may ask about. A field is only asked if a verified
// scheme's rules actually use it (see usedFields in engine.ts).

export const EDUCATION_LEVELS = [
  "school_upto_8", "class_9_10", "class_11_12", "diploma",
  "undergraduate", "postgraduate", "phd", "not_studying",
] as const;

export const OCCUPATIONS = [
  "student", "farmer", "salaried", "self_employed", "unemployed", "homemaker", "retired", "other",
] as const;

export const GENDERS = ["female", "male", "other"] as const;
export const SOCIAL_CATEGORIES = ["General", "OBC", "SC", "ST"] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Fields in the order the checker asks them. */
export const PROFILE_FIELDS = [
  "age", "state", "education_level", "occupation", "family_income_annual", "gender",
  "is_farmer", "has_disability", "is_bpl", "social_category", "minority_community",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

/** Sensitive fields: the UI must explain why they are asked. */
export const SENSITIVE_FIELDS: ProfileField[] = ["social_category", "minority_community"];

export type Profile = Partial<{
  age: number;
  state: string;
  education_level: (typeof EDUCATION_LEVELS)[number];
  occupation: (typeof OCCUPATIONS)[number];
  family_income_annual: number;
  gender: (typeof GENDERS)[number];
  is_farmer: boolean;
  has_disability: boolean;
  is_bpl: boolean;
  social_category: (typeof SOCIAL_CATEGORIES)[number];
  minority_community: boolean;
}>;
