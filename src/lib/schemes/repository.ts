import { Prisma, type Scheme } from "@prisma/client";
import { prisma } from "@/lib/db";
import { searchTokens, toTsQuery } from "@/lib/rag/normalize";
import type { Profile } from "@/lib/eligibility/fields";
import type { SchemeQuery } from "@/lib/validation/schemas";
import type { SchemeView } from "./types";
import { showUnverified } from "./present";

export const PAGE_SIZE = 12;

export function toView(s: Scheme): SchemeView {
  return {
    slug: s.slug, nameEn: s.nameEn, nameHi: s.nameHi, level: s.level, state: s.state,
    department: s.department, categories: s.categories, targetBeneficiaries: s.targetBeneficiaries,
    descriptionEn: s.descriptionEn, descriptionHi: s.descriptionHi, benefits: s.benefits,
    eligibilityText: s.eligibilityText, eligibilityRules: s.eligibilityRules,
    documentsRequired: s.documentsRequired, applicationSteps: s.applicationSteps,
    officialApplyUrl: s.officialApplyUrl, sourceUrl: s.sourceUrl, dataOrigin: s.dataOrigin,
    lastCheckedAt: s.lastCheckedAt ? s.lastCheckedAt.toISOString() : null,
    verificationStatus: s.verificationStatus, hiReviewed: s.hiReviewed,
  };
}

/** Statuses a citizen-facing listing may include. */
function listableStatuses(): ("verified" | "needs_verification")[] {
  return showUnverified() ? ["verified", "needs_verification"] : ["verified"];
}

/**
 * Relevance scores from Postgres: full-text rank (simple config, works for Hindi
 * tokens too) + pg_trgm word similarity per token for typo tolerance.
 * All values are bound parameters; no string concatenation of user input.
 */
async function scoreIds(query: string, statuses: string[]): Promise<Map<string, number>> {
  const tokens = searchTokens(query);
  if (!tokens.length) return new Map();
  const tsq = toTsQuery(tokens);
  const rows = await prisma.$queryRaw<{ id: string; score: number }[]>`
    WITH q AS (SELECT unnest(${tokens}::text[]) AS t)
    SELECT s.id,
      (COALESCE(ts_rank(s."searchVector", to_tsquery('simple', ${tsq})), 0) * 2
       + COALESCE((SELECT SUM(word_similarity(q.t, s."searchText")) FROM q WHERE q.t <% s."searchText"), 0))::float AS score
    FROM "Scheme" s
    WHERE s."verificationStatus"::text IN (${Prisma.join(statuses)})
      AND (s."searchVector" @@ to_tsquery('simple', ${tsq})
           OR EXISTS (SELECT 1 FROM q WHERE q.t <% s."searchText"))
    ORDER BY score DESC
    LIMIT 100`;
  return new Map(rows.map((r) => [r.id, Number(r.score)]));
}

export async function searchSchemes(params: SchemeQuery) {
  const statuses = listableStatuses();
  const where: Prisma.SchemeWhereInput = {
    verificationStatus: { in: statuses },
    ...(params.level && { level: params.level }),
    ...(params.state && { OR: [{ level: "central" }, { state: params.state }] }),
    ...(params.category && { categories: { has: params.category } }),
    ...(params.department && { department: params.department }),
    ...(params.ids && { slug: { in: params.ids } }),
  };

  let scores: Map<string, number> | null = null;
  if (params.q) {
    scores = await scoreIds(params.q, statuses);
    where.id = { in: [...scores.keys()] };
  }

  const orderBy: Prisma.SchemeOrderByWithRelationInput =
    params.sort === "updated" ? { lastCheckedAt: { sort: "desc", nulls: "last" } } : { nameEn: "asc" };
  const all = await prisma.scheme.findMany({ where, orderBy });
  if (scores && params.sort === "relevance") all.sort((a, b) => (scores!.get(b.id) ?? 0) - (scores!.get(a.id) ?? 0));

  const start = (params.page - 1) * PAGE_SIZE;
  return { total: all.length, page: params.page, pageSize: PAGE_SIZE, items: all.slice(start, start + PAGE_SIZE).map(toView) };
}

/** Chatbot retrieval: verified only, filtered by the conversation profile's state. */
export async function retrieveForChat(query: string, profile: Profile, limit = 6): Promise<SchemeView[]> {
  const scores = await scoreIds(query, ["verified"]);
  const rows = await prisma.scheme.findMany({
    where: {
      verificationStatus: "verified",
      id: { in: [...scores.keys()] },
      ...(profile.state && { OR: [{ level: "central" }, { state: profile.state }] }),
    },
  });
  return rows.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)).slice(0, limit).map(toView);
}

export async function getSchemeBySlug(slug: string): Promise<SchemeView | null> {
  const s = await prisma.scheme.findFirst({ where: { slug, verificationStatus: { in: listableStatuses() } } });
  return s ? toView(s) : null;
}

export async function listVerifiedForChecker(): Promise<SchemeView[]> {
  const rows = await prisma.scheme.findMany({ where: { verificationStatus: "verified" }, orderBy: { nameEn: "asc" } });
  return rows.map(toView);
}

export async function homeSections() {
  const statuses = listableStatuses();
  const [popular, recent, departments] = await Promise.all([
    prisma.scheme.findMany({ where: { verificationStatus: { in: statuses }, slug: { in: POPULAR } } }),
    prisma.scheme.findMany({ where: { verificationStatus: { in: statuses } }, orderBy: { lastCheckedAt: { sort: "desc", nulls: "last" } }, take: 4 }),
    prisma.scheme.findMany({ where: { verificationStatus: { in: statuses } }, distinct: ["department"], select: { department: true } }),
  ]);
  popular.sort((a, b) => POPULAR.indexOf(a.slug) - POPULAR.indexOf(b.slug));
  return { popular: popular.map(toView), recent: recent.map(toView), departmentCount: departments.length };
}

export async function listDepartments(): Promise<string[]> {
  const rows = await prisma.scheme.findMany({
    where: { verificationStatus: { in: listableStatuses() } }, distinct: ["department"], select: { department: true }, orderBy: { department: "asc" },
  });
  return rows.map((r) => r.department);
}

const POPULAR = ["pm-kisan", "ayushman-bharat-pmjay", "central-sector-scholarship", "pm-ujjwala-yojana"];
