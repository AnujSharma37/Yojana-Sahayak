import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { displayDescription, displayName, firstSentence, formatDate } from "@/lib/schemes/present";
import type { SchemeView } from "@/lib/schemes/types";
import OriginBadge from "./OriginBadge";
import SaveButton from "./SaveButton";

export default function SchemeCard({ scheme }: { scheme: SchemeView }) {
  const t = useTranslations("scheme");
  const locale = useLocale();
  const name = displayName(scheme, locale);
  const date = formatDate(scheme.lastCheckedAt);
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-surface px-2 py-0.5 font-semibold text-ink-muted">
          {scheme.level === "central" ? t("central") : `${t("state")}: ${scheme.state}`}
        </span>
        <OriginBadge scheme={scheme} />
      </div>
      <h3 className="text-lg font-bold">
        <Link href={`/schemes/${scheme.slug}`} className="text-navy-dark hover:underline">{name}</Link>
      </h3>
      <p className="mt-1 text-ink-muted">{displayDescription(scheme, locale)}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div><dt className="font-semibold">{t("beneficiaries")}</dt><dd>{scheme.targetBeneficiaries}</dd></div>
        <div><dt className="font-semibold">{t("keyBenefit")}</dt><dd>{firstSentence(scheme.benefits)}</dd></div>
        <div><dt className="font-semibold">{t("eligibility")}</dt><dd className="line-clamp-2">{scheme.eligibilityText}</dd></div>
        <div><dt className="font-semibold">{t("department")}</dt><dd>{scheme.department}</dd></div>
      </dl>
      <p className="mt-3 border-t border-dashed border-surface-line pt-3 text-xs text-ink-muted">
        <a href={scheme.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold">{t("source")}</a>
        <br />
        {date ? t("lastChecked", { date }) : t("notChecked")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 pt-1 sm:mt-auto">
        <Link href={`/schemes/${scheme.slug}`} className="btn-primary flex-1">{t("viewDetails")}</Link>
        <SaveButton slug={scheme.slug} name={name} />
      </div>
    </article>
  );
}
