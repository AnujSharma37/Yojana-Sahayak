"use client";
import { useTranslations } from "next-intl";
import { savedStore, useSaved } from "@/lib/saved/store";

export default function SaveButton({ slug, name, compact = false }: { slug: string; name: string; compact?: boolean }) {
  const t = useTranslations("scheme");
  const { slugs } = useSaved();
  const saved = slugs.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `${t("unsave")}: ${name}` : `${t("save")}: ${name}`}
      onClick={() => (saved ? savedStore.remove(slug) : savedStore.save(slug))}
      className={saved ? "btn border-2 border-teal bg-teal-soft text-teal hover:bg-[#CDE8E4] active:bg-[#B7DDD8]" : "btn-secondary"}
    >
      <span aria-hidden="true">{saved ? "✓" : "＋"}</span>
      {!compact && (saved ? t("saved") : t("save"))}
    </button>
  );
}
