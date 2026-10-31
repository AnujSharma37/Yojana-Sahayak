import { z } from "zod";
import { PROFILE_FIELDS } from "./fields";
import type { RuleNode } from "./engine";

const condition = z.object({
  field: z.enum(PROFILE_FIELDS),
  op: z.enum(["eq", "ne", "in", "not_in", "lt", "lte", "gt", "gte"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
});

export const ruleNodeSchema: z.ZodType<RuleNode> = z.lazy(() =>
  z.union([condition, z.object({ all: z.array(ruleNodeSchema).min(1) }), z.object({ any: z.array(ruleNodeSchema).min(1) })]),
) as z.ZodType<RuleNode>;

/** Parses stored JSON rules; returns null when absent or malformed (never throws). */
export function parseRules(raw: unknown): RuleNode | null {
  if (raw === null || raw === undefined) return null;
  const r = ruleNodeSchema.safeParse(raw);
  return r.success ? r.data : null;
}
