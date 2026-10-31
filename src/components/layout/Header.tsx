"use client";
import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/", key: "home" },
  { href: "/schemes", key: "explore" },
  { href: "/assistant", key: "assistant" },
  { href: "/eligibility", key: "eligibility" },
  { href: "/saved", key: "saved" },
  { href: "/about", key: "about" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tm = useTranslations("meta");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="bg-navy text-white">
      {/* Saffron rule: the one deliberate accent, echoing official letterheads */}
      <div className="h-1 bg-saffron" aria-hidden="true" />
      <div className="wrap flex min-h-[64px] items-center justify-between gap-3 py-2">
        <Link href="/" className="flex flex-col text-white no-underline">
          <span className="text-xl font-bold leading-tight">{tm("title")}</span>
          <span className="hidden text-xs text-white/80 sm:block">{tm("tagline")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}><LanguageSwitcher /></Suspense>
          <button
            type="button"
            className="btn border-2 border-white/40 text-white hover:bg-white/10 active:bg-white/20 lg:hidden"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
            <span className="sr-only sm:not-sr-only">{t("menu")}</span>
          </button>
        </div>
      </div>
      <nav id="main-nav" aria-label={t("menu")} className={`${open ? "block" : "hidden"} border-t border-white/15 lg:block`}>
        <ul className="wrap flex flex-col py-2 lg:flex-row lg:gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-touch items-center border-l-4 px-3 font-semibold text-white no-underline hover:bg-white/10 active:bg-white/20 lg:border-l-0 lg:border-b-4 ${
                    active ? "border-saffron bg-white/10" : "border-transparent"
                  }`}
                >
                  {t(n.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
