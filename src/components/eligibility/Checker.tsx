"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Profile, ProfileField } from "@/lib/eligibility/fields";
import ProfileForm from "./ProfileForm";
import Results, { type ResultRow } from "./Results";

export default function Checker() {
  const t = useTranslations("elig");
  const locale = useLocale();
  const scheme = useSearchParams().get("scheme") ?? undefined;
  const [fields, setFields] = useState<ProfileField[] | null>(null);
  const [schemeCount, setSchemeCount] = useState(0);
  const [profile, setProfile] = useState<Profile>({});
  const [rows, setRows] = useState<ResultRow[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "busy" | "error">("loading");

  const loadFields = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/eligibility/fields${scheme ? `?scheme=${encodeURIComponent(scheme)}` : ""}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFields(data.fields); setSchemeCount(data.schemeCount); setState("ready");
    } catch { setState("error"); }
  }, [scheme]);
  useEffect(() => { void loadFields(); }, [loadFields]);

  const check = async () => {
    setState("busy");
    try {
      const res = await fetch("/api/eligibility", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, locale, ...(scheme && { schemeSlug: scheme }) }),
      });
      if (!res.ok) throw new Error();
      setRows((await res.json()).results); setState("ready");
      window.scrollTo({ top: 0 });
    } catch { setState("error"); }
  };

  if (state === "error") {
    return (
      <div role="alert" className="rounded-lg border-2 border-danger bg-danger-soft p-4 text-danger">
        <p className="font-semibold">{t("error")}</p>
        <button type="button" className="btn-secondary mt-3" onClick={() => (fields ? setState("ready") : void loadFields())}>{t("edit")}</button>
      </div>
    );
  }
  if (state === "loading" || !fields) return <p aria-busy="true">…</p>;
  if (schemeCount === 0) return <p className="rounded-lg bg-surface p-4">{t("noSchemes")}</p>;

  return (
    <div className="space-y-6">
      {scheme && <p className="text-sm">{t("scheme")}<Link href="/eligibility">{t("allSchemes")}</Link></p>}
      {rows ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => setRows(null)}>{t("edit")}</button>
            <button type="button" className="btn-quiet underline" onClick={() => { setProfile({}); setRows(null); }}>{t("startOver")}</button>
          </div>
          <Results rows={rows} />
        </>
      ) : (
        <ProfileForm fields={fields} value={profile} onChange={setProfile} onSubmit={check} busy={state === "busy"} />
      )}
    </div>
  );
}
