import { useTranslations } from "next-intl";
import { formatDate, originBadge } from "@/lib/schemes/present";
import type { SchemeView } from "@/lib/schemes/types";

export default function OriginBadge({ scheme }: { scheme: Pick<SchemeView, "dataOrigin" | "verificationStatus" | "lastCheckedAt"> }) {
  const t = useTranslations("scheme");
  const kind = originBadge(scheme);
  const date = formatDate(scheme.lastCheckedAt);
  const styles: Record<string, string> = {
    live: "border-teal bg-teal-soft text-teal",
    retrieved: "border-navy bg-navy-soft text-navy",
    cached: "border-navy bg-navy-soft text-navy",
    unverified: "border-danger bg-danger-soft text-danger",
  };
  const text =
    kind === "live" ? t("badgeLive") : kind === "retrieved" ? t("badgeRetrieved") : kind === "cached" ? t("badgeCached", { date: date ?? "" }) : t("badgeUnverified");
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${styles[kind]}`}>
      <span aria-hidden="true">{kind === "unverified" ? "!" : "✓"}</span>
      {text}
    </span>
  );
}
