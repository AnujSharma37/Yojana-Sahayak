import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return (
    <div className="wrap max-w-3xl py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-4">{t("p1")}</p>
      <p className="mt-3">{t("p2")}</p>
      <p className="mt-3">{t("p3")}</p>
      <h2 className="mt-8 text-xl font-bold">{t("dataTitle")}</h2>
      <p className="mt-2">{t("dataText")}</p>
    </div>
  );
}
