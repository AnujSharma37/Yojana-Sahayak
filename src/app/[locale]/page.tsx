import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { homeSections } from "@/lib/schemes/repository";
import { logError } from "@/lib/errors";
import { CATEGORY_KEYS } from "@/lib/validation/schemas";
import SchemeCard from "@/components/schemes/SchemeCard";
import LoadError from "@/components/layout/LoadError";
import type { SchemeView } from "@/lib/schemes/types";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = {
  students: "🎓", women: "👩", farmers: "🌾", senior_citizens: "🧓", entrepreneurs: "🏪",
  job_seekers: "💼", persons_with_disabilities: "♿", low_income_families: "🏠",
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("categories");
  const te = await getTranslations("explore");

  let data: { popular: SchemeView[]; recent: SchemeView[] } | null = null;
  try { data = await homeSections(); } catch (e) { logError("home", e); }

  return (
    <>
      <section className="border-b border-surface-line bg-surface">
        <div className="wrap py-10 sm:py-14">
          <h1 className="max-w-3xl text-3xl font-bold sm:text-5xl">{t("heading")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t("subtext")}</p>
          <form action={`/${locale}/assistant`} method="get" role="search" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label htmlFor="home-q" className="sr-only">{t("searchLabel")}</label>
            <input id="home-q" name="q" type="search" maxLength={500} required placeholder={t("searchPlaceholder")} className="field flex-1 text-lg" />
            <button type="submit" className="btn-primary px-6">{t("ask")}</button>
          </form>
          <Link href="/schemes" className="mt-3 inline-block font-semibold">{t("browse")}</Link>
        </div>
      </section>

      <section className="wrap py-10" aria-labelledby="cat-title">
        <h2 id="cat-title" className="section-title">{t("categoriesTitle")}</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORY_KEYS.map((c) => (
            <li key={c}>
              <Link
                href={{ pathname: "/schemes", query: { category: c } }}
                className="card flex min-h-[88px] flex-col items-start justify-center gap-1 p-4 font-semibold text-navy-dark no-underline hover:border-navy hover:bg-navy-soft active:bg-[#D6DFEF]"
              >
                <span aria-hidden="true" className="text-2xl">{ICONS[c]}</span>
                {tc(c)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {data === null ? (
        <div className="wrap"><LoadError message={te("error")} retryHref={`/${locale}`} /></div>
      ) : (
        <>
          <SchemeSection id="popular" title={t("popularTitle")} schemes={data.popular} empty={t("emptyVerified")} />
          <SchemeSection id="recent" title={t("recentTitle")} schemes={data.recent} empty={t("emptyVerified")} />
        </>
      )}

      <section className="wrap py-10" aria-labelledby="how-title">
        <h2 id="how-title" className="section-title">{t("howTitle")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-lg font-bold text-white" aria-hidden="true">{n}</span>
              <h3 className="mt-3 text-lg font-bold">{t(`how${n}t` as "how1t")}</h3>
              <p className="mt-1 text-ink-muted">{t(`how${n}d` as "how1d")}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap grid gap-4 py-6 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-bold">{t("exploreTitle")}</h2>
          <p className="mt-1 text-ink-muted">{t("exploreText")}</p>
          <Link href="/schemes" className="btn-primary mt-4">{t("exploreCta")}</Link>
        </div>
        <div className="card border-teal p-6">
          <h2 className="text-xl font-bold">{t("tryAiTitle")}</h2>
          <p className="mt-1 text-ink-muted">{t("tryAiText")}</p>
          <Link href="/assistant" className="btn-teal mt-4">{t("tryAiCta")}</Link>
        </div>
      </section>
    </>
  );
}

function SchemeSection({ id, title, schemes, empty }: { id: string; title: string; schemes: SchemeView[]; empty: string }) {
  return (
    <section className="wrap py-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">{title}</h2>
      {schemes.length === 0 ? (
        <p className="mt-4 rounded-lg bg-surface p-4 text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {schemes.map((s) => <li key={s.slug}><SchemeCard scheme={s} /></li>)}
        </ul>
      )}
    </section>
  );
}
