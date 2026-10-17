"use client";

import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { CalendarDays, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MenuSheet } from "@/components/landing/menu-sheet";
import {
  LOCALE_LABELS,
  routing,
  type Locale,
  usePathname,
  useRouter,
} from "@/i18n/routing";

const FLAG: Record<Locale, string> = { pl: "pl", en: "gb", de: "de" };

const toneClass = {
  dark: "text-paper",
  light: "text-ink",
} as const;

const circle = {
  dark: "border-paper/40 hover:bg-paper/10",
  light: "border-ink/20 hover:bg-surface",
} as const;

const circleBase =
  "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = toneClass[tone];
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  function cycleLanguage() {
    const index = routing.locales.indexOf(locale);
    const next = routing.locales[(index + 1) % routing.locales.length];

    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <header
      className={`mx-auto flex w-full items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+21px)] ${color}`}
    >
      <Link
        className="focus-visible:outline-gold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        href="/"
      >
        <Logo />
        <span className="sr-only">Filharmonia Szczecin — strona główna</span>
      </Link>

      <div className={`flex items-center gap-2 ${color}`}>
        <button
          aria-label={`Język: ${LOCALE_LABELS[locale].name}. Zmień`}
          className="focus-visible:outline-gold size-11 shrink-0 overflow-hidden rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
          disabled={pending}
          onClick={cycleLanguage}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`fi fi-${FLAG[locale]} fis block leading-none`}
            style={{ fontSize: "44px" }}
          />
        </button>

        <Link
          aria-label="Repertuar"
          className={`${circleBase} ${circle[tone]}`}
          href="/calendar"
        >
          <CalendarDays aria-hidden="true" size={18} strokeWidth={1.6} />
        </Link>

        <button
          aria-expanded={menuOpen}
          aria-label="Menu"
          className={`${circleBase} ${circle[tone]}`}
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>
      </div>

      {menuOpen ? <MenuSheet onClose={() => setMenuOpen(false)} /> : null}
    </header>
  );
}
