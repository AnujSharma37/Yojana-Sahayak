import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tm = useTranslations("meta");
  return (
    <footer className="mt-16 border-t border-surface-line bg-surface">
      <div className="wrap py-8 text-sm text-ink-muted">
        <p className="font-semibold text-ink">{tm("title")}</p>
        <p className="mt-1">{t("disclaimer")}</p>
        <p className="mt-1">{t("rights")}</p>
      </div>
    </footer>
  );
}
