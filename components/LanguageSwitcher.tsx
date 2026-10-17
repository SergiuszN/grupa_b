"use client";

import { useLocale } from "next-intl";
import { routing, type Locale, usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-700 p-1 bg-white/70 dark:bg-black/60 backdrop-blur-md shadow-sm">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleSelect(loc)}
          disabled={isPending}
          className={`px-3 py-1 text-xs font-semibold uppercase rounded-full transition-all cursor-pointer ${
            currentLocale === loc
              ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
