"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSaved } from "@/lib/saved/store";
import type { SchemeView } from "@/lib/schemes/types";
import SchemeCard from "./SchemeCard";

export default function SavedList() {
  const t = useTranslations("saved");
  const { slugs } = useSaved();
  const [cache, setCache] = useState<Record<string, SchemeView>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const missing = slugs.filter((s) => !cache[s]);
  const load = useCallback(async () => {
    if (!missing.length) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/schemes?ids=${encodeURIComponent(missing.join(","))}`);
      if (!res.ok) throw new Error("load");
      const data: { items: SchemeView[] } = await res.json();
      setCache((c) => ({ ...c, ...Object.fromEntries(data.items.map((s) => [s.slug, s])) }));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing.join(",")]);

  useEffect(() => { void load(); }, [load]);

  if (slugs.length === 0) {
    return (
      <div className="mt-6 rounded-lg bg-surface p-6">
        <p>{t("empty")}</p>
        <Link href="/schemes" className="btn-primary mt-4">{t("emptyCta")}</Link>
      </div>
    );
  }
  return (
    <>
      {status === "error" && (
        <div role="alert" className="mt-6 rounded-lg border-2 border-danger bg-danger-soft p-4 text-danger">
          <p className="font-semibold">{t("loadError")}</p>
          <button type="button" className="btn-secondary mt-3" onClick={() => void load()}>{t("retry")}</button>
        </div>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={status === "loading"}>
        {slugs.map((s) => cache[s] && <li key={s}><SchemeCard scheme={cache[s]} /></li>)}
      </ul>
    </>
  );
}
