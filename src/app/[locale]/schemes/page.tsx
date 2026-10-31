import { getTranslations, setRequestLocale } from "next-intl/server";
import { schemeQuerySchema } from "@/lib/validation/schemas";
import { listDepartments, searchSchemes } from "@/lib/schemes/repository";
import { logError } from "@/lib/errors";
import FilterBar from "@/components/schemes/FilterBar";
import SchemeCard from "@/components/schemes/SchemeCard";
import LoadError from "@/components/layout/LoadError";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t("title") };
}

export default async function Explore({ params, searchParams: searchParamsPromise }: {
  params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const searchParams = await searchParamsPromise;
  setRequestLocale(locale);
  const t = await getTranslations("explore");
  const flat = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v));
  const parsed = schemeQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : schemeQuerySchema.parse({});

  let result: Awaited<ReturnType<typeof searchSchemes>> | null = null;
  let departments: string[] = [];
  try {
    [result, departments] = await Promise.all([searchSchemes(query), listDepartments()]);
  } catch (e) {
    logError("explore", e);
  }

  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const pageHref = (p: number) => {
    const sp = new URLSearchParams(flat as Record<string, string>);
    sp.set("page", String(p));
    return `/${locale}/schemes?${sp}`;
  };

  return (
    <div className="wrap py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <div className="mt-5"><FilterBar locale={locale} query={query} departments={departments} /></div>

      {!result ? (
        <div className="mt-6"><LoadError message={t("error")} retryHref={pageHref(query.page)} /></div>
      ) : (
        <>
          <p className="mt-6 font-semibold" aria-live="polite">{t("results", { count: result.total })}</p>
          {result.items.length === 0 ? (
            <p className="mt-3 rounded-lg bg-surface p-4">{t("noResults")}</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((s) => <li key={s.slug}><SchemeCard scheme={s} /></li>)}
            </ul>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-2">
              {query.page > 1 ? <a className="btn-secondary" href={pageHref(query.page - 1)}>{t("prev")}</a> : <span />}
              <span>{t("pageOf", { page: query.page, pages })}</span>
              {query.page < pages ? <a className="btn-secondary" href={pageHref(query.page + 1)}>{t("next")}</a> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
