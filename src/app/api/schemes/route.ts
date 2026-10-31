import { NextResponse } from "next/server";
import { schemeQuerySchema } from "@/lib/validation/schemas";
import { searchSchemes } from "@/lib/schemes/repository";
import { apiError, logError } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!rateLimit(`schemes:${clientKey(req)}`, 120, 60_000).ok) return apiError("rate_limited", "Too many requests. Try again in a minute.");
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schemeQuerySchema.safeParse(params);
  if (!parsed.success) return apiError("bad_request", "Invalid search parameters.");
  try {
    return NextResponse.json(await searchSchemes(parsed.data));
  } catch (e) {
    logError("api/schemes", e);
    return apiError("unavailable", "Scheme search is temporarily unavailable. Please retry.");
  }
}
