"use client";

import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("A11y");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black focus:font-semibold focus:text-sm focus:rounded-lg focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-transform"
    >
      {t("skipToContent")}
    </a>
  );
}
