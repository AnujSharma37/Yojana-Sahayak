import { INDIAN_STATES, type Profile } from "@/lib/eligibility/fields";

// Light profile extraction from the conversation. Held in the request only; never stored.
// Everything here is a heuristic: it must prefer "unknown" over a wrong guess, because a
// wrong state or age silently filters out the right schemes.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Hit = { index: number; groups: RegExpMatchArray };

/** Every match of every pattern, so callers can take the one mentioned last (the user's latest answer). */
function allMatches(patterns: RegExp[], text: string): Hit[] {
  const hits: Hit[] = [];
  for (const re of patterns) for (const m of text.matchAll(re)) hits.push({ index: m.index ?? 0, groups: m });
  return hits;
}
const lastHit = (hits: Hit[]) => hits.reduce<Hit | undefined>((a, h) => (!a || h.index >= a.index ? h : a), undefined);

// ---------- State ----------

// Whole-word matches only: "goa" must not match "goal", "assam" must not match "assamese".
const STATE_NAME_PATTERNS: { state: string; re: RegExp }[] = INDIAN_STATES.map((name) => ({
  state: name,
  re: new RegExp(`(?<![a-z])${escapeRe(name.toLowerCase()).replace(/ /g, "\\s+")}(?![a-z])`, "g"),
}));

const LATIN_ALIASES: { state: string; re: RegExp }[] = [
  { state: "Uttarakhand", re: /(?<![a-z])(?:uttrakhand|uttaranchal|uttrakhnd|uttarkhand)(?![a-z])/g },
  { state: "Himachal Pradesh", re: /(?<![a-z])himachal(?![a-z])/g },
  { state: "West Bengal", re: /(?<![a-z])bengal(?![a-z])/g },
  { state: "Odisha", re: /(?<![a-z])orissa(?![a-z])/g },
  { state: "Tamil Nadu", re: /(?<![a-z])tamilnadu(?![a-z])/g },
  { state: "Jammu and Kashmir", re: /(?<![a-z])(?:jammu|kashmir)(?![a-z])/g },
];

// "up" and "mp" are ordinary words/abbreviations ("what's up", "sign up", "MP"), so they only
// count with a location cue: "from UP", "in MP", "UP se", "state UP".
const SHORT_ALIASES: { state: string; res: RegExp[] }[] = [
  { state: "Uttar Pradesh", res: [/\b(?:from|in|of|state)\s+up(?![a-z])(?!\s+to\b)/g, /(?<![a-z])up\s+(?:se|me|mein|ka|ki|ke|wala|wali|state)(?![a-z])/g] },
  { state: "Madhya Pradesh", res: [/\b(?:from|in|of|state)\s+mp(?![a-z])/g, /(?<![a-z])mp\s+(?:se|me|mein|ka|ki|ke|wala|wali|state)(?![a-z])/g] },
];

// \b does not work with Devanagari, so these are plain substring checks.
const DEVANAGARI_STATES: [string, string][] = [
  ["उत्तराखंड", "Uttarakhand"], ["उत्तराखण्ड", "Uttarakhand"], ["उत्तर प्रदेश", "Uttar Pradesh"],
  ["मध्य प्रदेश", "Madhya Pradesh"], ["बिहार", "Bihar"], ["दिल्ली", "Delhi"], ["राजस्थान", "Rajasthan"],
  ["हिमाचल", "Himachal Pradesh"], ["हरियाणा", "Haryana"], ["पंजाब", "Punjab"], ["गुजरात", "Gujarat"],
  ["महाराष्ट्र", "Maharashtra"], ["झारखंड", "Jharkhand"], ["छत्तीसगढ़", "Chhattisgarh"], ["ओडिशा", "Odisha"],
  ["उड़ीसा", "Odisha"], ["केरल", "Kerala"], ["कर्नाटक", "Karnataka"], ["तेलंगाना", "Telangana"], ["असम", "Assam"],
  ["पश्चिम बंगाल", "West Bengal"],
];

function extractState(t: string): string | undefined {
  const found: { state: string; index: number }[] = [];
  for (const { state, re } of [...STATE_NAME_PATTERNS, ...LATIN_ALIASES]) {
    for (const m of t.matchAll(re)) found.push({ state, index: m.index ?? 0 });
  }
  for (const { state, res } of SHORT_ALIASES) {
    for (const re of res) for (const m of t.matchAll(re)) found.push({ state, index: m.index ?? 0 });
  }
  for (const [needle, state] of DEVANAGARI_STATES) {
    const i = t.lastIndexOf(needle);
    if (i >= 0) found.push({ state, index: i });
  }
  // If several states are named, the one mentioned last is the user's latest answer.
  return found.sort((a, b) => b.index - a.index)[0]?.state;
}

// ---------- Age ----------

const NOT_ORDINAL = "(?!\\d)(?!(?:st|nd|rd|th)(?![a-z]))"; // "2nd year" is not age 2
const AGE_PATTERNS: RegExp[] = [
  new RegExp(`(?<![a-z])(?:age|aged|umar|umr)(?![a-z])\\D{0,8}(\\d{1,3})${NOT_ORDINAL}`, "g"),
  new RegExp(`उम्र\\D{0,8}(\\d{1,3})${NOT_ORDINAL}`, "g"),
  /(\d{1,3})\s*-?\s*(?:years?|yrs?|yr)[\s-]*old/g,
  /(\d{1,3})\s*(?:saal|sal|varsh|वर्ष|साल)\s*(?:ka|ki|ke|ho|hu|hoon|hun|की|का|के|हो|हूँ|हूं|है)(?![a-z])/g,
  new RegExp(`(?<![a-z])(?:i\\s*am|i'm|im|main|mai|मैं)\\s+(\\d{1,3})${NOT_ORDINAL}(?!\\s*(?:lakh|lac|lacs|rs|km|%|kg|acre|bigha|लाख))`, "g"),
];

function extractAge(t: string): number | undefined {
  const hit = lastHit(allMatches(AGE_PATTERNS, t).filter((h) => { const n = Number(h.groups[1]); return n > 0 && n < 120; }));
  return hit ? Number(hit.groups[1]) : undefined;
}

// ---------- Income ----------

const INCOME_CUE = /(?:income|aay|aamdani|amdani|kamai|salary|earn|earning|earns|pagar|वेतन|आय|कमाई|आमदनी|तनख्वाह)/;
const LOAN_CUE = /(?:loan|karz|karza|लोन|ऋण|कर्ज)/;
const MONTHLY = /^\s*(?:per|a|every|\/)?\s*(?:month|mahina|mahine|monthly|महीना|महीने|माह)/;
const LAKH = /(\d+(?:\.\d+)?)\s*(?:lakh|lacs?|लाख)/g;
const INCOME_NUMBER = /(?:income|aay|aamdani|amdani|kamai|salary|earn|earning|earns|pagar|वेतन|आय|कमाई|आमदनी|तनख्वाह)\D{0,20}?(\d{1,3}(?:,\d{2,3})+|\d{4,9})(?!\d)(?!\s*(?:lakh|lac|लाख))/g;

function extractIncome(t: string): number | undefined {
  let best: { index: number; value: number } | undefined;
  const consider = (index: number, len: number, rupees: number) => {
    const after = t.slice(index + len, index + len + 20);
    const value = Math.round(rupees * (MONTHLY.test(after) ? 12 : 1)); // "20000 per month" is annual 240000
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return;
    if (!best || index >= best.index) best = { index, value };
  };
  for (const m of t.matchAll(LAKH)) {
    const i = m.index ?? 0;
    const around = t.slice(Math.max(0, i - 40), i + m[0].length + 40);
    const justBefore = t.slice(Math.max(0, i - 15), i);
    // Only an amount next to an income word counts; "loan of 5 lakh" is not income.
    if (INCOME_CUE.test(around) && !LOAN_CUE.test(justBefore)) consider(i, m[0].length, Number(m[1]) * 100000);
  }
  for (const m of t.matchAll(INCOME_NUMBER)) {
    const i = m.index ?? 0;
    consider(i, m[0].length, Number(m[1].replace(/,/g, "")));
  }
  return best?.value;
}

// ---------- Main ----------

export function extractProfile(text: string): Profile {
  const t = text.toLowerCase();
  const p: Profile = {};

  const state = extractState(t);
  if (state) p.state = state;

  const age = extractAge(t);
  if (age !== undefined) p.age = age;

  if (/\b(student|studying|college|padh|padhai|b\.?tech|btech|diploma|graduation)\b|छात्र|पढ़/.test(t)) p.occupation = "student";
  if (/\b(farmer|kisan|kheti|farming)\b|किसान|खेती/.test(t)) { p.occupation = "farmer"; p.is_farmer = true; }

  if (/\b(girl|woman|female|ladki|beti|mahila|daughter)\b|लड़की|महिला|बेटी|छात्रा/.test(t)) p.gender = "female";
  else if (/\b(boy|man|male|ladka)\b|लड़का|पुरुष/.test(t)) p.gender = "male";

  // Highest level first: a BTech student who mentions "12th pass" is an undergraduate.
  if (/\b(m\.?tech|mtech|m\.a|m\.?sc|mba|post ?graduation|postgraduate|pg)\b/.test(t)) p.education_level = "postgraduate";
  else if (/\b(b\.?tech|btech|b\.a|b\.?sc|b\.?com|bca|bba|bachelor|graduation|undergraduate|ug)\b/.test(t)) p.education_level = "undergraduate";
  else if (/\b(diploma|polytechnic)\b/.test(t)) p.education_level = "diploma";
  else if (/\b(?:class|kaksha|std)\s*(?:11|12)\b|कक्षा\s*(?:11|12)|\b(?:11|12)th\b/.test(t)) p.education_level = "class_11_12";
  else if (/\b(?:class|kaksha|std)\s*(?:9|10)\b|कक्षा\s*(?:9|10)|\b(?:9|10)th\b/.test(t)) p.education_level = "class_9_10";

  const income = extractIncome(t);
  if (income !== undefined) p.family_income_annual = income;

  const disabled = /(?<![a-z])(?:disabled|disability|divyang|viklang)(?![a-z])|दिव्यांग/.test(t);
  const negated = /(?<![a-z])(?:no|not|non|without|nahi|nahin)\s+(?:a\s+)?(?:disabled|disability|divyang|viklang)(?![a-z])|दिव्यांग\s*(?:नहीं|नही)/.test(t);
  if (disabled && !negated) p.has_disability = true;
  if (/\bbpl\b|गरीबी रेखा/.test(t)) p.is_bpl = true;
  return p;
}

/** Profile facts the assistant may want before recommending schemes. */
export function missingKeyFacts(p: Profile): string[] {
  const missing: string[] = [];
  if (!p.state) missing.push("state");
  if (p.age === undefined) missing.push("age");
  if (p.occupation === "student" && !p.education_level) missing.push("course or class");
  if (p.occupation === "student" && p.family_income_annual === undefined) missing.push("family income");
  return missing;
}
