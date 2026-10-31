import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({ locales: ["en", "hi"], defaultLocale: "en" });
export type AppLocale = (typeof routing.locales)[number];
