import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="wrap py-16">
      <h1 className="text-3xl font-bold">{t("notFound")}</h1>
      <Link href="/" className="btn-primary mt-6">{t("home")}</Link>
    </div>
  );
}
