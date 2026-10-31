import { useTranslations } from "next-intl";

/** Shown when the database cannot be reached. Retry is a plain link, so it works without JavaScript. */
export default function LoadError({ message, retryHref }: { message: string; retryHref: string }) {
  const t = useTranslations("common");
  return (
    <div role="alert" className="rounded-lg border-2 border-danger bg-danger-soft p-4 text-danger">
      <p className="font-semibold">{message}</p>
      <a href={retryHref} className="btn-secondary mt-3">{t("retry")}</a>
    </div>
  );
}
