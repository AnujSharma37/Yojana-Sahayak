import { NextResponse } from "next/server";
import { eligibilityRequestSchema } from "@/lib/validation/schemas";
import { listVerifiedForChecker } from "@/lib/schemes/repository";
import { evaluate } from "@/lib/eligibility/engine";
import { parseRules } from "@/lib/eligibility/rulesSchema";
import { toCitation } from "@/lib/schemes/present";
import { apiError, logError, readJsonLimited } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`elig:${clientKey(req)}`, 30, 60_000).ok) return apiError("rate_limited", "Too many requests. Try again in a minute.");
  const body = await readJsonLimited(req, 4_000);
  if (body === "too_large") return apiError("too_large", "Request is too large.");
  const parsed = eligibilityRequestSchema.safeParse(body === "invalid" ? null : body);
  if (!parsed.success) return apiError("bad_request", "Please check your answers and try again.");

  try {
    let schemes = await listVerifiedForChecker();
    if (parsed.data.schemeSlug) schemes = schemes.filter((s) => s.slug === parsed.data.schemeSlug);
    const results = schemes.map((s) => ({
      scheme: { ...toCitation(s), officialApplyUrl: s.officialApplyUrl, level: s.level, state: s.state },
      ...evaluate(parseRules(s.eligibilityRules), parsed.data.profile),
    }));
    // Nothing is stored: the profile lives only in this request.
    return NextResponse.json({ results });
  } catch (e) {
    logError("api/eligibility", e);
    return apiError("unavailable", "The checker is temporarily unavailable. Please retry.");
  }
}
