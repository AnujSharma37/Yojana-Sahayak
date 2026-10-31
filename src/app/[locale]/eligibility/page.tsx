import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Checker from "@/components/eligibility/Checker";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "elig" });
  return { title: t("title") };
}

export default async function EligibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("elig");
  return (
    <div className="wrap max-w-3xl py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("intro")}</p>
      <div className="mt-6"><Suspense fallback={null}><Checker /></Suspense></div>
    </div>
  );
}
