import { NextResponse } from "next/server";
import { listVerifiedForChecker } from "@/lib/schemes/repository";
import { parseRules } from "@/lib/eligibility/rulesSchema";
import { usedFields } from "@/lib/eligibility/engine";
import { PROFILE_FIELDS } from "@/lib/eligibility/fields";
import { apiError, logError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** Only the fields that verified schemes' rules actually use, so the checker asks nothing extra. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("scheme");
  try {
    let schemes = await listVerifiedForChecker();
    if (slug && /^[a-z0-9-]{1,80}$/.test(slug)) schemes = schemes.filter((s) => s.slug === slug);
    const used = new Set(schemes.flatMap((s) => usedFields(parseRules(s.eligibilityRules))));
    return NextResponse.json({ fields: PROFILE_FIELDS.filter((f) => used.has(f)), schemeCount: schemes.length });
  } catch (e) {
    logError("api/eligibility/fields", e);
    return apiError("unavailable", "The checker is temporarily unavailable. Please retry.");
  }
}
