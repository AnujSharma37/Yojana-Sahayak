"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category, EvaluationResult } from "@/lib/eligibility/engine";
import type { Citation } from "@/lib/schemes/types";
import { conditionText } from "./conditionText";

export type ResultRow = EvaluationResult & { scheme: Citation & { officialApplyUrl: string } };

const ORDER: Category[] = ["potentially_eligible", "more_info_required", "appears_ineligible"];
const STYLE: Record<Category, { border: string; mark: string }> = {
  potentially_eligible: { border: "border-teal", mark: "✓" },
  more_info_required: { border: "border-saffron", mark: "?" },
  appears_ineligible: { border: "border-surface-line", mark: "✕" },
};

export default function Results({ rows }: { rows: ResultRow[] }) {
  const t = useTranslations("elig");
  const ts = useTranslations("scheme");
  const tops = useTranslations("ops");
  const tf = useTranslations("fields");
  const tv = useTranslations("values");
  const locale = useLocale();

  return (
    <div className="space-y-8">
      <p role="note" className="rounded-lg border-2 border-navy bg-navy-soft p-3 font-semibold">{t("notice")}</p>
      {ORDER.map((cat) => {
        const group = rows.filter((r) => r.category === cat);
        return (
          <section key={cat} aria-labelledby={`h-${cat}`}>
            <h2 id={`h-${cat}`} className="flex items-center gap-2 text-xl font-bold">
              <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${STYLE[cat].border}`}>{STYLE[cat].mark}</span>
              {t(cat)} ({group.length})
            </h2>
            {group.length === 0 ? <p className="mt-2 text-ink-muted">{t("none")}</p> : (
              <ul className="mt-3 space-y-3">
                {group.map((r) => (
                  <li key={r.scheme.slug} className={`card border-l-4 p-4 ${STYLE[cat].border}`}>
                    <Link href={`/schemes/${r.scheme.slug}`} className="text-lg font-bold">
                      {locale === "hi" && r.scheme.nameHi ? r.scheme.nameHi : r.scheme.name}
                    </Link>
                    {r.noStructuredRules ? <p className="mt-1">{t("noRules")}</p> : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {r.conditions.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="w-20 shrink-0 font-semibold">
                              {c.status === "met" ? "✓" : c.status === "not_met" ? "✕" : "?"} {t(c.status)}
                            </span>
                            <span>{conditionText(c.condition, tops, tf, tv)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {r.missingFields.length > 0 && (
                      <p className="mt-2 text-sm font-semibold">{t("missing", { fields: r.missingFields.map((f) => tf(f)).join(", ") })}</p>
                    )}
                    <p className="mt-2 text-xs text-ink-muted">
                      <a href={r.scheme.sourceUrl} target="_blank" rel="noopener noreferrer">{ts("source")}</a>
                      {", "}{r.scheme.lastChecked ? ts("lastChecked", { date: r.scheme.lastChecked }) : ts("notChecked")}
                    </p>
                    <a href={r.scheme.officialApplyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3">
                      {ts("officialApply")} <span className="sr-only">{ts("opensNewTab")}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
