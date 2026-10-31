"use client";
import { useTranslations } from "next-intl";
import {
  EDUCATION_LEVELS, GENDERS, INDIAN_STATES, OCCUPATIONS, SENSITIVE_FIELDS, SOCIAL_CATEGORIES,
  type Profile, type ProfileField,
} from "@/lib/eligibility/fields";

const BOOL_FIELDS: ProfileField[] = ["is_farmer", "has_disability", "is_bpl", "minority_community"];
const NUM_FIELDS: ProfileField[] = ["age", "family_income_annual"];
const OPTIONS: Partial<Record<ProfileField, readonly string[]>> = {
  state: INDIAN_STATES, education_level: EDUCATION_LEVELS, occupation: OCCUPATIONS,
  gender: GENDERS, social_category: SOCIAL_CATEGORIES,
};

export default function ProfileForm({ fields, value, onChange, onSubmit, busy }: {
  fields: ProfileField[]; value: Profile; onChange: (p: Profile) => void; onSubmit: () => void; busy: boolean;
}) {
  const t = useTranslations("elig");
  const tf = useTranslations("fields");
  const tv = useTranslations("values");
  const set = (f: ProfileField, v: unknown) => {
    const next = { ...value } as Record<string, unknown>;
    if (v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v))) delete next[f]; else next[f] = v;
    onChange(next as Profile);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="card space-y-5 p-5">
      <p className="text-sm text-ink-muted">{t("optional")} {t("privacy")}</p>
      {fields.map((f) => {
        const id = `pf-${f}`;
        const current = (value as Record<string, unknown>)[f];
        return (
          <div key={f}>
            {BOOL_FIELDS.includes(f) ? (
              <fieldset>
                <legend className="label">{tf(f)}</legend>
                <div className="flex flex-wrap gap-2">
                  {([["yes", true], ["no", false], ["skip", undefined]] as const).map(([k, v]) => {
                    const checked = current === v;
                    return (
                      <label key={k} className={`btn cursor-pointer border-2 ${checked ? "border-navy bg-navy-soft text-navy-dark" : "border-surface-line hover:border-ink-muted"}`}>
                        <input type="radio" name={f} className="h-5 w-5 accent-[#13295B]" checked={checked} onChange={() => set(f, v)} />
                        {t(k)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : NUM_FIELDS.includes(f) ? (
              <>
                <label htmlFor={id} className="label">{tf(f)}</label>
                <input id={id} type="number" inputMode="numeric" min={0} max={f === "age" ? 120 : 1_000_000_000} step={1}
                  className="field max-w-xs" value={current === undefined ? "" : String(current)}
                  onChange={(e) => set(f, e.target.value === "" ? "" : Math.trunc(Number(e.target.value)))} />
              </>
            ) : (
              <>
                <label htmlFor={id} className="label">{tf(f)}</label>
                <select id={id} className="field max-w-md" value={current === undefined ? "" : String(current)} onChange={(e) => set(f, e.target.value)}>
                  <option value="">{t("select")}</option>
                  {OPTIONS[f]?.map((o) => <option key={o} value={o}>{f === "state" ? o : tv(o)}</option>)}
                </select>
              </>
            )}
            {SENSITIVE_FIELDS.includes(f) && <p className="mt-1 text-sm text-ink-muted">{t(`why_${f}` as "why_social_category")}</p>}
          </div>
        );
      })}
      <button type="submit" className="btn-primary" disabled={busy}>{t("check")}</button>
    </form>
  );
}
