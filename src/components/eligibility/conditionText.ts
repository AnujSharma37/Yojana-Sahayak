import type { Condition } from "@/lib/eligibility/engine";

const VALUE_KEYS = new Set([
  "school_upto_8", "class_9_10", "class_11_12", "diploma", "undergraduate", "postgraduate", "phd", "not_studying",
  "student", "farmer", "salaried", "self_employed", "unemployed", "homemaker", "retired", "other",
  "female", "male", "General", "OBC", "SC", "ST", "true", "false",
]);

type T = (key: string, values?: Record<string, string>) => string;

export function valueText(v: unknown, tv: T): string {
  if (Array.isArray(v)) return v.map((x) => valueText(x, tv)).join(", ");
  if (typeof v === "number") return v.toLocaleString("en-IN");
  const key = String(v);
  return VALUE_KEYS.has(key) ? tv(key) : key;
}

/** e.g. "Yearly family income (Rs) at most 2,50,000" */
export function conditionText(c: Condition, tops: T, tfields: T, tv: T): string {
  return tops(c.op, { field: tfields(c.field), value: valueText(c.value, tv) });
}
