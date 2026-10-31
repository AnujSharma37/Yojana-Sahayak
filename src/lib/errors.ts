import { NextResponse } from "next/server";

// Safe error responses: no stack traces, no internal details, no personal data.
export type ErrorCode = "bad_request" | "too_large" | "rate_limited" | "not_found" | "unavailable" | "internal";

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400, too_large: 413, rate_limited: 429, not_found: 404, unavailable: 503, internal: 500,
};

export function apiError(code: ErrorCode, message: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS[code], headers: extraHeaders });
}

/** Logs without request bodies or user text. */
export function logError(where: string, err: unknown) {
  const name = err instanceof Error ? err.name : "UnknownError";
  console.error(`[${where}] ${name}`);
}

/** Reads a JSON body, enforcing the limit in bytes while streaming (not after buffering it all). */
export async function readJsonLimited(req: Request, maxBytes: number): Promise<unknown | "too_large" | "invalid"> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return "too_large";
  if (!req.body) return "invalid";
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel().catch(() => undefined); return "too_large"; }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try { return JSON.parse(text); } catch { return "invalid"; }
}
