import { chatRequestSchema } from "@/lib/validation/schemas";
import { detectConversationLanguage, type ChatLanguage } from "@/lib/rag/language";
import { extractProfile, missingKeyFacts } from "@/lib/rag/profile";
import { retrieveForChat } from "@/lib/schemes/repository";
import { toCitation, toContext } from "@/lib/schemes/present";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { llmConfigured, streamAnswer } from "@/lib/ai/client";
import { normalizeMessages } from "@/lib/ai/messages";
import { takeClientBudget, takeLlmBudget } from "@/lib/ai/budget";
import { apiError, logError, readJsonLimited } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/security/rateLimit";
import type { SchemeView } from "@/lib/schemes/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 30 messages x 2000 characters is up to ~180 KB of Devanagari (3 bytes per character).
const MAX_BODY_BYTES = 200_000;

const CUT_SHORT: Record<ChatLanguage, string> = {
  en: "\n\n(The answer was cut short. Ask me to continue.)",
  hi: "\n\n(उत्तर अधूरा रह गया। \"आगे बताइए\" लिखें।)",
  hinglish: "\n\n(Jawab adhura reh gaya. \"aage batao\" likhein.)",
};

// Response is NDJSON: one JSON event per line.
// {type:"meta"} -> {type:"text"}* -> {type:"done"}   or   {type:"fallback"} when AI is unavailable.
export async function POST(req: Request) {
  const key = clientKey(req);
  const rl = rateLimit(`chat:${key}`, 15, 60_000);
  if (!rl.ok) return apiError("rate_limited", "Too many messages. Please wait a moment.", { "Retry-After": String(rl.retryAfterSec) });

  const body = await readJsonLimited(req, MAX_BODY_BYTES);
  if (body === "too_large") return apiError("too_large", "Conversation is too long. Start a new chat.");
  const parsed = chatRequestSchema.safeParse(body === "invalid" ? null : body);
  if (!parsed.success) return apiError("bad_request", "Message could not be read. Please try again.");

  const { locale } = parsed.data;
  // History comes from the browser: keep it well-formed (starts with a user turn, roles merged, capped).
  const messages = normalizeMessages(parsed.data.messages);
  if (!messages.length) return apiError("bad_request", "Message could not be read. Please try again.");

  const last = messages[messages.length - 1].content;
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  const userText = userMessages.join("\n");
  const language = detectConversationLanguage(userMessages);
  const profile = extractProfile(userText);
  const missing = missingKeyFacts(profile);

  let schemes: SchemeView[] = [];
  let searchFailed = false;
  try {
    // Search with the latest message plus earlier user turns, so follow-up answers keep context.
    schemes = await retrieveForChat(`${last} ${userText}`.slice(0, 1000), profile, 6);
  } catch (e) {
    logError("api/chat retrieve", e);
    searchFailed = true;
  }

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort(), { once: true });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (obj: unknown) => {
        if (!open) return;
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch { open = false; }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try { controller.close(); } catch { /* already closed */ }
      };
      const fallback = (reason: string) => send({ type: "fallback", reason, schemes: schemes.map(toCitation) });

      send({ type: "meta", language, citations: schemes.map(toCitation) });
      if (searchFailed) { fallback("search_unavailable"); close(); return; }
      if (!llmConfigured()) { fallback("ai_not_configured"); close(); return; }
      // Per-client cap first, so one abusive client cannot drain the shared daily budget.
      if (!takeClientBudget(key) || !takeLlmBudget()) { fallback("ai_daily_limit"); close(); return; }

      try {
        const system = buildSystemPrompt({ language, profile, missing, schemes: schemes.map((s) => toContext(s, locale)) });
        let truncated = false;
        for await (const part of streamAnswer(system, messages, abort.signal)) {
          if ("delta" in part) send({ type: "text", delta: part.delta });
          else if (part.stop === "max_tokens") truncated = true;
        }
        if (abort.signal.aborted) return;
        if (truncated) send({ type: "text", delta: CUT_SHORT[language] });
        send({ type: "done" });
      } catch (e) {
        if (!abort.signal.aborted) {
          logError("api/chat llm", e);
          fallback("ai_unavailable");
        }
      } finally {
        close();
      }
    },
    cancel() { abort.abort(); },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
