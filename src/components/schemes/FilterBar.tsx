import { useTranslations } from "next-intl";
import { INDIAN_STATES } from "@/lib/eligibility/fields";
import { CATEGORY_KEYS, type SchemeQuery } from "@/lib/validation/schemas";

// Plain GET form: works without JavaScript, every filter is in the URL (shareable, back-button friendly).
export default function FilterBar({ locale, query, departments }: { locale: string; query: SchemeQuery; departments: string[] }) {
  const t = useTranslations("explore");
  const tc = useTranslations("categories");
  const ts = useTranslations("scheme");

  const base = `/${locale}/schemes`;
  const without = (key: keyof SchemeQuery) => {
    const p = new URLSearchParams();
    for (const k of ["q", "level", "state", "category", "department", "sort"] as const) {
      const v = query[k];
      if (k !== key && v && !(k === "sort" && v === "relevance")) p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const chips: { key: keyof SchemeQuery; label: string }[] = [];
  if (query.q) chips.push({ key: "q", label: `“${query.q}”` });
  if (query.level) chips.push({ key: "level", label: query.level === "central" ? ts("central") : ts("state") });
  if (query.state) chips.push({ key: "state", label: query.state });
  if (query.category) chips.push({ key: "category", label: tc(query.category) });
  if (query.department) chips.push({ key: "department", label: query.department });

  return (
    <div>
      <form action={base} method="get" role="search" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-6">
          <label htmlFor="f-q" className="label">{t("search")}</label>
          <input id="f-q" name="q" type="search" maxLength={200} defaultValue={query.q ?? ""} placeholder={t("searchPlaceholder")} className="field" />
        </div>
        <Select id="f-level" name="level" label={t("level")} value={query.level} any={t("any")}
          options={[["central", ts("central")], ["state", ts("state")]]} />
        <Select id="f-state" name="state" label={t("stateLabel")} value={query.state} any={t("any")}
          options={INDIAN_STATES.map((s) => [s, s])} />
        <Select id="f-cat" name="category" label={t("category")} value={query.category} any={t("any")}
          options={CATEGORY_KEYS.map((c) => [c, tc(c)])} />
        <Select id="f-dept" name="department" label={t("departmentLabel")} value={query.department} any={t("any")}
          options={departments.map((d) => [d, d])} />
        <Select id="f-sort" name="sort" label={t("sort")} value={query.sort} 
          options={[["relevance", t("sortRelevance")], ["name", t("sortName")], ["updated", t("sortUpdated")]]} />
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">{t("apply")}</button>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={t("activeFilters")} role="group">
          <span className="text-sm font-semibold">{t("activeFilters")}:</span>
          {chips.map((c) => (
            <a key={c.key} href={without(c.key)} className="chip no-underline hover:bg-[#D6DFEF]" aria-label={t("remove", { label: c.label })}>
              {c.label} <span aria-hidden="true">✕</span>
            </a>
          ))}
          <a href={base} className="btn-quiet text-sm underline">{t("clearAll")}</a>
        </div>
      )}
    </div>
  );
}

function Select({ id, name, label, value, options, any }: {
  id: string; name: string; label: string; value?: string; options: [string, string][]; any?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="field">
        {any !== undefined && <option value="">{any}</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
