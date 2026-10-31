import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSchemeBySlug } from "@/lib/schemes/repository";
import { displayDescription, displayName, formatDate } from "@/lib/schemes/present";
import { logError } from "@/lib/errors";
import OriginBadge from "@/components/schemes/OriginBadge";
import SaveButton from "@/components/schemes/SaveButton";
import LoadError from "@/components/layout/LoadError";
import type { SchemeView } from "@/lib/schemes/types";

export const dynamic = "force-dynamic";

export default async function SchemeDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("scheme");
  const te = await getTranslations("explore");
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();

  let s: SchemeView | null = null;
  try { s = await getSchemeBySlug(slug); } catch (e) {
    logError("scheme detail", e);
    return <div className="wrap py-8"><LoadError message={te("error")} retryHref={`/${locale}/schemes/${slug}`} /></div>;
  }
  if (!s) notFound();

  const name = displayName(s, locale);
  const date = formatDate(s.lastCheckedAt);
  const showHiNote = locale === "hi" && !s.hiReviewed && (s.nameHi || s.descriptionHi);

  return (
    <article className="wrap max-w-4xl py-8">
      <Link href="/schemes" className="font-semibold">{t("backToExplore")}</Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-surface px-2 py-0.5 font-semibold">{s.level === "central" ? t("central") : `${t("state")}: ${s.state}`}</span>
        <OriginBadge scheme={s} />
      </div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{name}</h1>
      {locale === "hi" && s.nameHi && <p className="mt-1 text-ink-muted" lang="en">{s.nameEn}</p>}

      {s.verificationStatus !== "verified" && (
        <p role="note" className="mt-4 rounded-lg border-2 border-danger bg-danger-soft p-3 font-semibold text-danger">{t("unverifiedNotice")}</p>
      )}
      {showHiNote && <p className="mt-3 text-sm text-ink-muted">{t("hiNotReviewed")}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <a href={s.officialApplyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
          {t("officialApply")} <span className="sr-only">{t("opensNewTab")}</span><span aria-hidden="true">↗</span>
        </a>
        <Link href={{ pathname: "/eligibility", query: { scheme: s.slug } }} className="btn-teal">{t("checkEligibility")}</Link>
        <Link href={{ pathname: "/assistant", query: { q: `${t("askAi")}: ${s.nameEn}` } }} className="btn-secondary">{t("askAi")}</Link>
        <SaveButton slug={s.slug} name={name} />
      </div>

      <Section title={t("description")}><p>{displayDescription(s, locale)}</p></Section>
      <Section title={t("beneficiaries")}><p>{s.targetBeneficiaries}</p></Section>
      <Section title={t("benefits")}><p>{s.benefits}</p></Section>
      <Section title={t("eligibility")}><p>{s.eligibilityText}</p></Section>
      <Section title={t("documents")}>
        <ul className="list-disc space-y-1 pl-6">{s.documentsRequired.map((d) => <li key={d}>{d}</li>)}</ul>
      </Section>
      <Section title={t("steps")}>
        <ol className="list-decimal space-y-1 pl-6">{s.applicationSteps.map((d) => <li key={d}>{d}</li>)}</ol>
      </Section>
      <Section title={t("department")}><p>{s.department}</p></Section>

      <footer className="mt-8 rounded-lg border border-surface-line bg-surface p-4 text-sm">
        <p><span className="font-semibold">{t("source")}: </span>
          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all">{s.sourceUrl}</a></p>
        <p className="mt-1">{date ? t("lastChecked", { date }) : t("notChecked")}</p>
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="border-b-2 border-surface-line pb-1 text-xl font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
