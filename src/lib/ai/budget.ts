// Daily LLM call caps. In-memory: they reset on restart and are per server instance
// (on serverless, per warm instance). Move to Postgres/Redis for a shared limit.
function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 && process.env[name] !== undefined && process.env[name] !== "" ? Math.floor(n) : fallback;
}

let day = "";
let count = 0;

export function takeLlmBudget(limit = envInt("DAILY_LLM_REQUEST_LIMIT", 500), now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  if (today !== day) { day = today; count = 0; }
  if (count >= limit) return false;
  count += 1;
  return true;
}

// Per-client daily cap, so a few abusive clients cannot use up the shared daily budget for everyone.
const MAX_CLIENTS = 20_000;
let clientDay = "";
const perClient = new Map<string, number>();

export function takeClientBudget(key: string, limit = envInt("DAILY_LLM_PER_CLIENT_LIMIT", 40), now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  if (today !== clientDay) { clientDay = today; perClient.clear(); }
  const used = perClient.get(key) ?? 0;
  if (used >= limit) return false;
  perClient.delete(key);
  perClient.set(key, used + 1);
  if (perClient.size > MAX_CLIENTS) {
    for (const k of perClient.keys()) { perClient.delete(k); if (perClient.size <= MAX_CLIENTS * 0.9) break; }
  }
  return true;
}

export function resetBudgetForTests() { day = ""; count = 0; clientDay = ""; perClient.clear(); }
