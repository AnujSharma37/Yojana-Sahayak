import { describe, expect, it } from "vitest";
import { evaluate, usedFields, type RuleNode } from "@/lib/eligibility/engine";
import { parseRules } from "@/lib/eligibility/rulesSchema";
import type { Profile } from "@/lib/eligibility/fields";

// Fixture rules test the ENGINE's logic. They are not claims about real schemes.
const R = {
  farmer: { all: [{ field: "is_farmer", op: "eq", value: true }] },
  ukGirlIncome: { all: [
    { field: "state", op: "in", value: ["Uttarakhand"] },
    { field: "gender", op: "eq", value: "female" },
    { field: "family_income_annual", op: "lte", value: 250000 },
  ] },
  age18to40: { all: [{ field: "age", op: "gte", value: 18 }, { field: "age", op: "lte", value: 40 }] },
  seniorOrBpl: { any: [{ field: "age", op: "gte", value: 70 }, { field: "is_bpl", op: "eq", value: true }] },
  womanOrScSt: { all: [
    { field: "age", op: "gte", value: 18 },
    { any: [{ field: "gender", op: "eq", value: "female" }, { field: "social_category", op: "in", value: ["SC", "ST"] }] },
  ] },
  ugScholarship: { all: [
    { field: "education_level", op: "in", value: ["undergraduate", "postgraduate"] },
    { field: "family_income_annual", op: "lte", value: 450000 },
  ] },
  notRetired: { all: [{ field: "occupation", op: "ne", value: "retired" }] },
  notInDelhi: { all: [{ field: "state", op: "not_in", value: ["Delhi"] }] },
  under10: { all: [{ field: "age", op: "lt", value: 10 }] },
  over60: { all: [{ field: "age", op: "gt", value: 60 }] },
} satisfies Record<string, RuleNode>;

type Case = [string, RuleNode | null, Profile, "potentially_eligible" | "more_info_required" | "appears_ineligible", string[]?];

const cases: Case[] = [
  ["1 farmer meets farmer rule", R.farmer, { is_farmer: true }, "potentially_eligible"],
  ["2 non-farmer fails farmer rule", R.farmer, { is_farmer: false }, "appears_ineligible"],
  ["3 farmer status unknown", R.farmer, { age: 30 }, "more_info_required", ["is_farmer"]],
  ["4 Demo Student, Uttarakhand girl, low income", R.ukGirlIncome, { state: "Uttarakhand", gender: "female", family_income_annual: 180000 }, "potentially_eligible"],
  ["5 income exactly at limit passes (lte)", R.ukGirlIncome, { state: "Uttarakhand", gender: "female", family_income_annual: 250000 }, "potentially_eligible"],
  ["6 income above limit fails", R.ukGirlIncome, { state: "Uttarakhand", gender: "female", family_income_annual: 250001 }, "appears_ineligible"],
  ["7 wrong state fails even with unknown income", R.ukGirlIncome, { state: "Bihar", gender: "female" }, "appears_ineligible"],
  ["8 income missing -> more info", R.ukGirlIncome, { state: "Uttarakhand", gender: "female" }, "more_info_required", ["family_income_annual"]],
  ["9 age 18 boundary passes", R.age18to40, { age: 18 }, "potentially_eligible"],
  ["10 age 41 fails", R.age18to40, { age: 41 }, "appears_ineligible"],
  ["11 any: senior 72 without BPL info passes", R.seniorOrBpl, { age: 72 }, "potentially_eligible"],
  ["12 any: age 30, BPL unknown -> more info", R.seniorOrBpl, { age: 30 }, "more_info_required", ["is_bpl"]],
  ["13 any: age 30 and not BPL fails", R.seniorOrBpl, { age: 30, is_bpl: false }, "appears_ineligible"],
  ["14 nested: woman entrepreneur 25 passes", R.womanOrScSt, { age: 25, gender: "female" }, "potentially_eligible"],
  ["15 nested: man 25, category unknown -> more info", R.womanOrScSt, { age: 25, gender: "male" }, "more_info_required", ["social_category"]],
  ["16 nested: SC man 25 passes", R.womanOrScSt, { age: 25, gender: "male", social_category: "SC" }, "potentially_eligible"],
  ["17 nested: minor fails regardless", R.womanOrScSt, { age: 16, gender: "female" }, "appears_ineligible"],
  ["18 class 12 student fails UG-only rule", R.ugScholarship, { education_level: "class_11_12", family_income_annual: 100000 }, "appears_ineligible"],
  ["19 ne operator", R.notRetired, { occupation: "retired" }, "appears_ineligible"],
  ["20 not_in operator", R.notInDelhi, { state: "Uttarakhand" }, "potentially_eligible"],
  ["21 lt operator boundary", R.under10, { age: 10 }, "appears_ineligible"],
  ["22 gt operator", R.over60, { age: 61 }, "potentially_eligible"],
  ["23 no structured rules -> more info, flagged", null, { age: 30 }, "more_info_required"],
  ["24 empty profile -> lists every missing field", R.ukGirlIncome, {}, "more_info_required", ["state", "gender", "family_income_annual"]],
];

describe("eligibility engine: sample profiles", () => {
  it.each(cases)("%s", (_name, rules, profile, expected, missing) => {
    const r = evaluate(rules, profile);
    expect(r.category).toBe(expected);
    if (missing) expect(r.missingFields.sort()).toEqual([...missing].sort());
    if (expected === "appears_ineligible") expect(r.failedConditions.length).toBeGreaterThan(0);
    if (expected === "potentially_eligible") expect(r.missingFields).toEqual([]);
  });

  it("marks schemes without rules as noStructuredRules", () => {
    expect(evaluate(null, {}).noStructuredRules).toBe(true);
  });

  it("reports each condition as met / not_met / unknown", () => {
    const r = evaluate(R.ukGirlIncome, { state: "Uttarakhand", gender: "male" });
    expect(r.conditions.map((c) => c.status)).toEqual(["met", "not_met", "unknown"]);
  });

  it("does not treat a string number as a number", () => {
    const r = evaluate(R.age18to40, { age: "25" as unknown as number });
    expect(r.category).toBe("appears_ineligible");
  });
});

describe("usedFields", () => {
  it("collects fields from nested rules without duplicates", () => {
    expect(usedFields(R.womanOrScSt).sort()).toEqual(["age", "gender", "social_category"]);
    expect(usedFields(null)).toEqual([]);
  });
});

describe("parseRules", () => {
  it("accepts valid rules and rejects unknown fields or ops", () => {
    expect(parseRules(R.ukGirlIncome)).not.toBeNull();
    expect(parseRules({ all: [{ field: "aadhaar", op: "eq", value: "x" }] })).toBeNull();
    expect(parseRules({ all: [{ field: "age", op: "regex", value: ".*" }] })).toBeNull();
    expect(parseRules(null)).toBeNull();
  });
});
