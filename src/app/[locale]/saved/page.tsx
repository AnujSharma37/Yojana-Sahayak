import { getTranslations, setRequestLocale } from "next-intl/server";
import SavedList from "@/components/schemes/SavedList";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saved" });
  return { title: t("title") };
}

export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("saved");
  return (
    <div className="wrap py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("localNote")}</p>
      <SavedList />
    </div>
  );
}
