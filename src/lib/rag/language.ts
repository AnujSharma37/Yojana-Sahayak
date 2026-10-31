export type ChatLanguage = "en" | "hi" | "hinglish";

const DEVANAGARI = /[\u0900-\u097F]/;
// Romanised Hindi grammar words (not scheme names like "kisan", which English users type too).
const HINGLISH_WORDS = new Set([
  "hai", "hain", "hu", "hoon", "mujhe", "mujhko", "mera", "meri", "mere", "kya", "kaise", "kaun",
  "kaunsi", "konsi", "chahiye", "ke", "liye", "ki", "ka", "se", "nahi", "nahin", "batao", "bataiye",
  "milega", "milegi", "sakta", "sakti", "kahan", "kab", "aur", "bhi", "hamara", "humara", "karna",
  "karein", "karu", "saal", "mai", "kitna", "kitni", "wala", "wali", "paisa",
]);

export function detectLanguage(text: string): ChatLanguage {
  if (DEVANAGARI.test(text)) return "hi";
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const hits = words.filter((w) => HINGLISH_WORDS.has(w)).length;
  if (hits >= 2 || (hits === 1 && words.length <= 4)) return "hinglish";
  return "en";
}

// Short replies such as "Uttarakhand" or "19, girl" carry no language signal of their own,
// so they inherit the language of the user's recent turns instead of flipping to English.
const ENGLISH_FUNCTION_WORDS = new Set([
  "what", "how", "is", "are", "the", "for", "can", "do", "does", "i", "my", "me", "to", "of", "and", "which", "where", "when", "why", "who", "thanks", "thank", "please", "yes", "no",
]);

export function detectConversationLanguage(userMessages: string[]): ChatLanguage {
  const last = userMessages[userMessages.length - 1] ?? "";
  const lang = detectLanguage(last);
  if (lang !== "en") return lang;
  const words = last.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length > 3 || words.some((w) => ENGLISH_FUNCTION_WORDS.has(w))) return "en";
  for (let i = userMessages.length - 2; i >= 0 && i >= userMessages.length - 4; i--) {
    const earlier = detectLanguage(userMessages[i]);
    if (earlier !== "en") return earlier;
  }
  return "en";
}
