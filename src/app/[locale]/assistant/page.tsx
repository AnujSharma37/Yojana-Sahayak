import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Chat from "@/components/chat/Chat";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat" });
  return { title: t("title") };
}

export default async function AssistantPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chat");
  return (
    <div className="wrap max-w-3xl py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("intro")}</p>
      <div className="mt-6"><Suspense fallback={null}><Chat locale={locale} /></Suspense></div>
    </div>
  );
}
