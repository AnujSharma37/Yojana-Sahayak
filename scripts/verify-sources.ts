// npm run verify-sources
// Fetches every scheme's source_url and official_apply_url, records HTTP status
// in SourceCheck, and prints a report of broken links. It does NOT change
// verification_status: a reachable page is not proof the facts are correct.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UA = "YojanaSahayak-LinkCheck/0.1 (+public link check; contact: see README)";

async function check(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA } });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA } });
    }
    return { httpStatus: res.status, ok: res.ok, error: null as string | null };
  } catch (e) {
    return { httpStatus: null, ok: false, error: e instanceof Error ? e.name : "error" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const schemes = await prisma.scheme.findMany({ select: { id: true, slug: true, sourceUrl: true, officialApplyUrl: true } });
  const broken: string[] = [];
  for (const s of schemes) {
    for (const url of new Set([s.sourceUrl, s.officialApplyUrl])) {
      const r = await check(url);
      await prisma.sourceCheck.create({ data: { schemeId: s.id, url, ...r } });
      const line = `${r.ok ? "OK  " : "FAIL"} ${String(r.httpStatus ?? "-").padEnd(4)} ${s.slug.padEnd(36)} ${url}${r.error ? ` (${r.error})` : ""}`;
      console.log(line);
      if (!r.ok) broken.push(line);
      await new Promise((res) => setTimeout(res, 500)); // be polite to government servers
    }
  }
  console.log(`\nChecked ${schemes.length} schemes at ${new Date().toISOString()}. Broken/unreachable: ${broken.length}`);
  if (broken.length) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
