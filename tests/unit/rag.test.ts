import { describe, expect, it } from "vitest";
import { detectConversationLanguage, detectLanguage } from "@/lib/rag/language";
import { searchTokens, toTsQuery } from "@/lib/rag/normalize";
import { extractProfile, missingKeyFacts } from "@/lib/rag/profile";

describe("detectLanguage", () => {
  it.each([
    ["Which scholarships are available for girls?", "en"],
    ["How to apply for PM Kisan", "en"],
    ["किसानों के लिए कौन सी योजनाएं हैं?", "hi"],
    ["mujhe scholership chahiye uttrakhand se hu", "hinglish"],
    ["pension kaise milegi", "hinglish"],
    ["Documents for Ayushman Bharat card", "en"],
  ])("%s -> %s", (text, lang) => expect(detectLanguage(text)).toBe(lang));
});

describe("searchTokens", () => {
  it("keeps typo tokens for trigram matching and drops Hinglish stopwords", () => {
    const t = searchTokens("mujhe scholership chahiye uttrakhand se hu");
    expect(t).toContain("scholership");
    expect(t).toContain("uttrakhand");
    expect(t).not.toContain("mujhe");
  });
  it("maps Hindi words to English keywords", () => {
    expect(searchTokens("किसानों के लिए कौन सी योजनाएं हैं?")).toContain("farmer");
    expect(searchTokens("mahila ke liye loan")).toEqual(expect.arrayContaining(["women", "loan"]));
  });
  it("neutralises SQL and tsquery syntax", () => {
    const t = searchTokens("'; DROP TABLE \"Scheme\"; -- & | ! :*");
    expect(t.join(" ")).not.toMatch(/['";&|!:*-]/);
    expect(toTsQuery(t)).toMatch(/^([a-z0-9\u0900-\u097F]+:\*)( \| [a-z0-9\u0900-\u097F]+:\*)*$/);
  });
  it("returns nothing for empty or symbol-only input", () => {
    expect(searchTokens("   ")).toEqual([]);
    expect(toTsQuery(searchTokens("<<>>"))).toBe("");
  });
});

describe("extractProfile", () => {
  it("reads state alias, student, gender, age and income", () => {
    const p = extractProfile("main 19 saal ki ladki hu, uttrakhand se, btech kar rahi, family income 2 lakh");
    expect(p).toMatchObject({ state: "Uttarakhand", age: 19, gender: "female", occupation: "student", education_level: "undergraduate", family_income_annual: 200000 });
  });
  it("reads a Hindi farmer message", () => {
    expect(extractProfile("मैं उत्तराखंड का किसान हूँ")).toMatchObject({ state: "Uttarakhand", is_farmer: true, occupation: "farmer" });
  });
  it("lists missing key facts for a vague question", () => {
    expect(missingKeyFacts(extractProfile("Am I eligible for any scheme?"))).toEqual(["state", "age"]);
  });
});

describe("extractProfile: regressions", () => {
  it.each([
    ["what is up with the scheme? how do I sign up", undefined],
    ["my goal is a scholarship", undefined],
    ["I am from UP", "Uttar Pradesh"],
    ["up se hu, kisan hu", "Uttar Pradesh"],
    ["I live in MP", "Madhya Pradesh"],
    ["मैं मध्य प्रदेश से हूँ", "Madhya Pradesh"],
    ["I live in Goa", "Goa"],
    ["I was in Bihar but now live in Delhi", "Delhi"],
    ["scholarships in up to 5 lakh", undefined],
    ["assamese language class", undefined],
  ])("state in %j -> %s", (text, state) => expect(extractProfile(text).state).toBe(state));

  it.each([
    ["I have 5 years of farming experience", undefined],
    ["I am 2nd year student", undefined],
    ["I am 19, girl, Uttarakhand, BTech", 19],
    ["I'm a 65 year old BPL farmer in Bihar", 65],
    ["main 19 saal ki ladki hu", 19],
    ["meri umar 45 hai", 45],
    ["age 12th class", undefined],
    ["I have 5 acre land", undefined],
    ["I am 30. Actually I am 31 years old", 31],
  ])("age in %j -> %s", (text, age) => expect(extractProfile(text).age).toBe(age));

  it.each([
    ["family income 2 lakh", 200000],
    ["family income is 2.5 lakh per year", 250000],
    ["I need a loan of 5 lakh", undefined],
    ["income 2,50,000", 250000],
    ["my income is 20000 per month", 240000],
    ["income 1 lakh. Actually income 3 lakh", 300000],
  ])("income in %j -> %s", (text, income) => expect(extractProfile(text).family_income_annual).toBe(income));

  it("picks the highest education level mentioned", () => {
    expect(extractProfile("I passed 12th and now do BTech").education_level).toBe("undergraduate");
    expect(extractProfile("I am in class 10").education_level).toBe("class_9_10");
    expect(extractProfile("10th pass student").education_level).toBe("class_9_10");
    expect(extractProfile("I am in class 12").education_level).toBe("class_11_12");
  });

  it("does not treat school-going kids as a student, or a negation as a disability", () => {
    expect(extractProfile("my kids go to school").occupation).toBeUndefined();
    expect(extractProfile("I have no disability").has_disability).toBeUndefined();
    expect(extractProfile("I am divyang").has_disability).toBe(true);
  });
});

describe("detectConversationLanguage", () => {
  it("keeps Hinglish for short follow-up answers", () => {
    expect(detectConversationLanguage(["mujhe scholership chahiye", "Uttarakhand"])).toBe("hinglish");
    expect(detectConversationLanguage(["mujhe scholership chahiye", "19, girl, btech"])).toBe("hinglish");
  });
  it("switches to English when the user clearly writes English", () => {
    expect(detectConversationLanguage(["mujhe scholership chahiye", "What is PM Kisan?"])).toBe("en");
    expect(detectConversationLanguage(["mujhe scholership chahiye", "Please explain the documents needed"])).toBe("en");
  });
  it("does not treat the English word 'main' as Hinglish", () => {
    expect(detectLanguage("main scheme details")).toBe("en");
  });
});
