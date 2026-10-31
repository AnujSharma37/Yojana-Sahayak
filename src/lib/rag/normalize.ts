// Query normalisation: keeps the original text for the LLM, and produces
// search tokens (with Hindi/Hinglish synonyms mapped to English keywords)
// for Postgres full-text + trigram search.

const SYNONYMS: Record<string, string[]> = {
  // Hinglish (Roman script)
  kisan: ["farmer"], kheti: ["farmer", "crop"], fasal: ["crop"], chhatravritti: ["scholarship"],
  chatravriti: ["scholarship"], vazifa: ["scholarship"], padhai: ["education", "student"],
  mahila: ["women"], aurat: ["women"], ladki: ["girl"], beti: ["girl"], budhapa: ["pension", "senior"],
  buzurg: ["senior"], bujurg: ["senior"], vridha: ["senior", "pension"], ilaj: ["health", "hospital"],
  swasthya: ["health"], naukri: ["job", "employment"], rozgar: ["employment"], karza: ["loan"],
  karz: ["loan"], vyapar: ["business"], dhandha: ["business"], divyang: ["disability"], viklang: ["disability"],
  garib: ["poor", "bpl"], gas: ["lpg"],
  // Devanagari
  "किसान": ["farmer"], "खेती": ["farmer", "crop"], "फसल": ["crop"], "छात्रवृत्ति": ["scholarship"],
  "स्कॉलरशिप": ["scholarship"], "पढ़ाई": ["education", "student"], "छात्र": ["student"], "छात्रा": ["student", "girl"],
  "महिला": ["women"], "महिलाओं": ["women"], "बेटी": ["girl"], "लड़की": ["girl"], "पेंशन": ["pension"],
  "बुजुर्ग": ["senior"], "वृद्ध": ["senior"], "इलाज": ["health", "hospital"], "स्वास्थ्य": ["health"],
  "नौकरी": ["job", "employment"], "रोजगार": ["employment"], "ऋण": ["loan"], "लोन": ["loan"],
  "व्यापार": ["business"], "दिव्यांग": ["disability"], "गरीब": ["poor", "bpl"], "गैस": ["lpg"],
  "उत्तराखंड": ["uttarakhand"], "किसानों": ["farmer"], "योजनाएं": ["scheme"], "योजना": ["scheme"],
};

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "am", "i", "me", "my", "for", "of", "to", "in", "on", "and", "or",
  "what", "which", "how", "can", "do", "does", "any", "there", "about", "tell", "please", "with",
  "hai", "hain", "hu", "hoon", "mujhe", "mera", "meri", "mere", "kya", "kaise", "kaun", "konsi",
  "kaunsi", "chahiye", "ke", "liye", "ki", "ka", "se", "aur", "bhi", "batao", "scheme", "schemes",
  "yojana", "yojna", "government", "sarkari", "के", "लिए", "कौन", "सी", "है", "हैं", "क्या", "मुझे", "में", "की", "का",
]);

/** Lowercase, split into word tokens (Latin + Devanagari), drop stopwords, add synonyms. */
export function searchTokens(query: string): string[] {
  const raw = query.toLowerCase().normalize("NFC").match(/[a-z0-9]+|[\u0900-\u097F]+/g) ?? [];
  const out = new Set<string>();
  for (const t of raw) {
    if (t.length < 2 || STOPWORDS.has(t)) continue;
    out.add(t);
    for (const s of SYNONYMS[t] ?? []) out.add(s);
  }
  return [...out].slice(0, 12);
}

/** Builds an OR prefix tsquery string from already-sanitised tokens. */
export function toTsQuery(tokens: string[]): string {
  return tokens
    .map((t) => t.replace(/[^a-z0-9\u0900-\u097F]/g, ""))
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" | ");
}
