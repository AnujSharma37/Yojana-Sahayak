import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// Server-side only. API keys are never sent to the browser.

export type LlmProvider = "gemini" | "anthropic";

const clean = (value: string | undefined) => value?.trim() ?? "";

/**
 * Which AI provider to use.
 *  - LLM_PROVIDER="gemini" | "anthropic" picks one explicitly.
 *  - If LLM_PROVIDER is not set, whichever key is present is used (Gemini first).
 *  - An unknown LLM_PROVIDER value means "not configured" (the site falls back to keyword search).
 */
export function llmProvider(): LlmProvider | null {
  const explicit = clean(process.env.LLM_PROVIDER).toLowerCase();
  if (explicit) return explicit === "gemini" || explicit === "anthropic" ? explicit : null;
  if (clean(process.env.GEMINI_API_KEY)) return "gemini";
  if (clean(process.env.ANTHROPIC_API_KEY)) return "anthropic";
  return null;
}

function apiKeyFor(provider: LlmProvider): string {
  return clean(provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY);
}

export function llmConfigured(): boolean {
  const provider = llmProvider();
  return Boolean(provider && apiKeyFor(provider) && clean(process.env.LLM_MODEL));
}

// Hindi (Devanagari) needs many more tokens than English, and the answer format ends with the
// official link and last-checked date, so a low limit would cut off exactly the parts that matter.
export const MAX_OUTPUT_TOKENS = 2048;

export type StreamPart = { delta: string } | { stop: string | null };
type ChatMessage = { role: "user" | "assistant"; content: string };

export async function* streamAnswer(
  system: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<StreamPart> {
  if (signal?.aborted) return;

  const provider = llmProvider();
  if (!provider || !llmConfigured()) {
    throw new Error(
      "AI is not configured: set LLM_MODEL and either GEMINI_API_KEY or ANTHROPIC_API_KEY (optionally LLM_PROVIDER).",
    );
  }

  try {
    const apiKey = apiKeyFor(provider);
    const model = clean(process.env.LLM_MODEL);
    yield* provider === "gemini"
      ? streamGemini(apiKey, model, system, messages, signal)
      : streamAnthropic(apiKey, model, system, messages, signal);
  } catch (error) {
    console.error(
      `[${provider}] Generation failed:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

async function* streamGemini(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<StreamPart> {
  const ai = new GoogleGenAI({ apiKey });

  const stream = await ai.models.generateContentStream({
    model,
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: system,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  let stop: string | null = null;

  for await (const chunk of stream) {
    if (signal?.aborted) return;

    const text = chunk.text;
    if (text) yield { delta: text };

    if (chunk.candidates?.some((candidate) => candidate.finishReason === "MAX_TOKENS")) {
      stop = "max_tokens";
    }
  }

  if (!signal?.aborted) yield { stop };
}

async function* streamAnthropic(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<StreamPart> {
  const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });

  const stream = await client.messages.create(
    { model, max_tokens: MAX_OUTPUT_TOKENS, system, messages, stream: true },
    { signal },
  );

  let stop: string | null = null;

  for await (const event of stream) {
    if (signal?.aborted) return;

    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield { delta: event.delta.text };
    } else if (event.type === "message_delta" && event.delta.stop_reason) {
      stop = event.delta.stop_reason;
    }
  }

  if (!signal?.aborted) yield { stop };
}
