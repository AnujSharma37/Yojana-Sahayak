"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Citation } from "@/lib/schemes/types";
import SaveButton from "@/components/schemes/SaveButton";

export default function SourceChips({ citations }: { citations: Citation[] }) {
  const t = useTranslations("chat");
  const ts = useTranslations("scheme");
  const locale = useLocale();
  if (!citations.length) return null;
  return (
    <div className="mt-3 border-t border-surface-line pt-3">
      <p className="text-sm font-semibold">{t("sources")}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {citations.map((c) => {
          const name = locale === "hi" && c.nameHi ? c.nameHi : c.name;
          return (
            <li key={c.slug} className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-line bg-white p-2 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/schemes/${c.slug}`} className="font-semibold">{name}</Link>
                <p className="text-xs text-ink-muted">
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">{ts("source")}</a>
                  {", "}
                  {c.lastChecked ? ts("lastChecked", { date: c.lastChecked }) : ts("notChecked")}
                </p>
              </div>
              <SaveButton slug={c.slug} name={name} compact />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
