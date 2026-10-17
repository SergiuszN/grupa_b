"use client";

import { useLocale } from "next-intl";
import { routing, type Locale, usePathname, useRouter, LOCALE_LABELS } from "@/i18n/routing";
import { useTransition } from "react";

/**
 * LanguageSwitcher — flag-icon pill, styled to match the SiteHeader.
 * Replaces the manual localStorage-based switcher.
 */
export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentIndex = routing.locales.indexOf(currentLocale);
  const next = routing.locales[(currentIndex + 1) % routing.locales.length];
  const nextMeta = LOCALE_LABELS[next];

  function cycleLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <button
      type="button"
      onClick={cycleLocale}
      disabled={isPending}
      aria-label={`Język: ${LOCALE_LABELS[currentLocale].name}. Zmień na ${nextMeta.name}`}
      className="focus-visible:outline-gold size-11 shrink-0 overflow-hidden rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`fi fi-${currentLocale === "en" ? "gb" : currentLocale} fis block leading-none`}
        style={{ fontSize: "44px" }}
      />
    </button>
  );
}
