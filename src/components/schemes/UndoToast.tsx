"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { savedStore, useSaved } from "@/lib/saved/store";

export default function UndoToast() {
  const t = useTranslations("scheme");
  const { lastRemoved } = useSaved();
  useEffect(() => {
    if (!lastRemoved) return;
    const id = setTimeout(() => savedStore.dismiss(), 8000);
    return () => clearTimeout(id);
  }, [lastRemoved]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      {lastRemoved && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-ink px-4 py-2 text-white shadow-lg">
          <span>{t("removed")}</span>
          <button type="button" className="btn bg-white text-navy hover:bg-navy-soft" onClick={() => savedStore.undo()}>
            {t("undo")}
          </button>
          <button type="button" aria-label="Dismiss" className="btn text-white hover:bg-white/10" onClick={() => savedStore.dismiss()}>✕</button>
        </div>
      )}
    </div>
  );
}
