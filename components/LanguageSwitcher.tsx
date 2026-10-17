"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, type Locale, usePathname, useRouter, LOCALE_LABELS } from "@/i18n/routing";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("A11y");

  const handleSelect = (nextLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <nav
      aria-label={t("languageSelector")}
      className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-700 p-1 bg-white/70 dark:bg-black/60 backdrop-blur-md shadow-sm"
    >
      {routing.locales.map((loc) => {
        const isCurrent = currentLocale === loc;
        const localeMeta = LOCALE_LABELS[loc];

        return (
          <button
            key={loc}
            type="button"
            onClick={() => handleSelect(loc)}
            disabled={isPending}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`${t("switchTo")} ${localeMeta.name}`}
            className={`px-3 py-1 text-xs font-semibold uppercase rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
              isCurrent
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <span aria-hidden="true">{loc}</span>
            <span className="sr-only">
              {localeMeta.name} {isCurrent ? `(${t("currentLanguage")})` : ""}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
