import type { Profile, ProfileField } from "./fields";

// Deterministic rules engine. The LLM never decides eligibility.
// Three-valued logic: met, not_met, unknown (missing information).

export type Op = "eq" | "ne" | "in" | "not_in" | "lt" | "lte" | "gt" | "gte";
export type Condition = { field: ProfileField; op: Op; value: unknown };
export type RuleNode = Condition | { all: RuleNode[] } | { any: RuleNode[] };

export type Tri = "met" | "not_met" | "unknown";
export type ConditionResult = { condition: Condition; status: Tri };
export type Category = "potentially_eligible" | "more_info_required" | "appears_ineligible";

export type EvaluationResult = {
  category: Category;
  conditions: ConditionResult[];
  missingFields: ProfileField[];
  failedConditions: Condition[];
  /** True when the scheme has no structured rules yet. */
  noStructuredRules: boolean;
};

const isCondition = (n: RuleNode): n is Condition => "field" in n && "op" in n;

export function evalCondition(c: Condition, profile: Profile): Tri {
  const actual = profile[c.field];
  if (actual === undefined || actual === null || actual === "") return "unknown";
  const v = c.value;
  const num = typeof actual === "number" && typeof v === "number";
  switch (c.op) {
    case "eq": return actual === v ? "met" : "not_met";
    case "ne": return actual !== v ? "met" : "not_met";
    case "in": return Array.isArray(v) && v.includes(actual) ? "met" : "not_met";
    case "not_in": return Array.isArray(v) && !v.includes(actual) ? "met" : "not_met";
    case "lt": return num && (actual as number) < (v as number) ? "met" : "not_met";
    case "lte": return num && (actual as number) <= (v as number) ? "met" : "not_met";
    case "gt": return num && (actual as number) > (v as number) ? "met" : "not_met";
    case "gte": return num && (actual as number) >= (v as number) ? "met" : "not_met";
    default: return "unknown";
  }
}

function evalNode(node: RuleNode, profile: Profile, out: ConditionResult[]): Tri {
  if (isCondition(node)) {
    const status = evalCondition(node, profile);
    out.push({ condition: node, status });
    return status;
  }
  const isAll = "all" in node;
  const results = (isAll ? node.all : node.any).map((c) => evalNode(c, profile, out));
  if (isAll) {
    if (results.includes("not_met")) return "not_met";
    return results.includes("unknown") ? "unknown" : "met";
  }
  if (results.includes("met")) return "met";
  return results.includes("unknown") ? "unknown" : "not_met";
}

export function evaluate(rules: RuleNode | null | undefined, profile: Profile): EvaluationResult {
  if (!rules) {
    return { category: "more_info_required", conditions: [], missingFields: [], failedConditions: [], noStructuredRules: true };
  }
  const conditions: ConditionResult[] = [];
  const overall = evalNode(rules, profile, conditions);
  const category: Category =
    overall === "met" ? "potentially_eligible" : overall === "not_met" ? "appears_ineligible" : "more_info_required";
  const missingFields = category === "more_info_required"
    ? [...new Set(conditions.filter((c) => c.status === "unknown").map((c) => c.condition.field))]
    : [];
  const failedConditions = conditions.filter((c) => c.status === "not_met").map((c) => c.condition);
  return { category, conditions, missingFields, failedConditions, noStructuredRules: false };
}

/** Every profile field referenced by a rule tree. */
export function usedFields(rules: RuleNode | null | undefined): ProfileField[] {
  if (!rules) return [];
  if (isCondition(rules)) return [rules.field];
  const children = "all" in rules ? rules.all : rules.any;
  return [...new Set(children.flatMap(usedFields))];
}
