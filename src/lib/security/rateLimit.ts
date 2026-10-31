// Sliding-window rate limiter (in-memory, per instance). Good enough for an MVP;
// use a shared store (Upstash/Redis/Postgres) for multi-instance production.
const MAX_KEYS = 10_000;
const hits = new Map<string, { times: number[]; windowMs: number }>();

function evict(now: number) {
  // 1) drop keys with no activity inside their own window
  for (const [k, v] of hits) {
    const lastHit = v.times[v.times.length - 1];
    if (lastHit === undefined || now - lastHit >= v.windowMs) hits.delete(k);
  }
  // 2) still too many: drop one-off keys first (typical of spoofed or scanning traffic), oldest first,
  //    so users who are near or over their limit keep being limited.
  const target = MAX_KEYS * 0.9;
  for (const [k, v] of hits) {
    if (hits.size <= target) return;
    if (v.times.length <= 1) hits.delete(k);
  }
  // 3) last resort: drop the least recently used. Never clear everything.
  for (const k of hits.keys()) {
    if (hits.size <= target) return;
    hits.delete(k);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const entry = hits.get(key);
  const recent = (entry?.times ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, { times: recent, windowMs });
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.delete(key); // re-insert so Map order tracks recent use
  hits.set(key, { times: recent, windowMs });
  if (hits.size > MAX_KEYS) evict(now);
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Best available client identifier. Platforms such as Vercel overwrite x-real-ip and
 * x-forwarded-for, so they are trusted here; if you run behind your own proxy, make sure it
 * does the same. With no proxy headers (local dev) clients are split by browser string
 * rather than all sharing one "local" bucket.
 */
export function clientKey(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (first) return first.slice(0, 64);
  return `anon:${(req.headers.get("user-agent") ?? "").slice(0, 80)}`;
}
