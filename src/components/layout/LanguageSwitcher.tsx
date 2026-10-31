"use client";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const t = useTranslations("nav");
  const href = search ? `${pathname}?${search}` : pathname;
  return (
    <nav aria-label={t("language")} className="flex gap-1">
      {LANGS.map((l) => {
        const active = l.code === locale;
        return (
          <Link
            key={l.code}
            href={href}
            locale={l.code}
            lang={l.code}
            aria-current={active ? "true" : undefined}
            className={`btn px-3 text-sm ${active ? "border-2 border-white bg-white text-navy" : "border-2 border-white/40 text-white hover:bg-white/10 active:bg-white/20"}`}
          >
            {active && <span aria-hidden="true">✓</span>}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
