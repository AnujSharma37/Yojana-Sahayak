import { PrismaClient, Prisma } from "@prisma/client";
import { loadSeed } from "./seedData";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  const schemes = loadSeed();
  for (const s of schemes) {
    const searchText = [s.name_en, s.name_hi, s.department, s.categories.join(" ").replace(/_/g, " "),
      s.target_beneficiaries, s.description_en, s.description_hi, s.benefits, s.eligibility_text, s.state]
      .filter(Boolean).join(" ").toLowerCase();
    const data = {
      nameEn: s.name_en, nameHi: s.name_hi, level: s.level, state: s.state, department: s.department,
      categories: s.categories, targetBeneficiaries: s.target_beneficiaries,
      descriptionEn: s.description_en, descriptionHi: s.description_hi, benefits: s.benefits,
      eligibilityText: s.eligibility_text,
      eligibilityRules: s.eligibility_rules === null ? Prisma.DbNull : (s.eligibility_rules as Prisma.InputJsonValue),
      documentsRequired: s.documents_required, applicationSteps: s.application_steps,
      officialApplyUrl: s.official_apply_url, sourceUrl: s.source_url, sourceType: s.source_type,
      dataOrigin: s.data_origin, lastCheckedAt: s.last_checked_at ? new Date(s.last_checked_at) : null,
      verificationStatus: s.verification_status, hiReviewed: s.hi_reviewed,
      curationNotes: s.curation_notes ?? null, searchText,
    };
    await prisma.scheme.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
  }
  await prisma.$executeRaw`UPDATE "Scheme" SET "searchVector" = to_tsvector('simple', "searchText")`;
  const verified = schemes.filter((s) => s.verification_status === "verified").length;
  console.log(`Seeded ${schemes.length} schemes (${verified} verified, ${schemes.length - verified} awaiting verification).`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
}
