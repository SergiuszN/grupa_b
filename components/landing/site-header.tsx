"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Accessibility, CalendarDays, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GoldenBaton } from "@/components/flow/golden-baton";
import { MenuSheet } from "@/components/landing/menu-sheet";
import { openAccessibilityPanel } from "@/components/AccessibilityControl";
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
  dark: "border-paper/40 bg-paper/10 backdrop-blur-md hover:bg-paper/20",
  light: "border-ink/20 bg-paper/60 backdrop-blur-md hover:bg-surface",
} as const;

const flagCircle = {
  dark: "border-paper/60 bg-paper/10 backdrop-blur-md hover:bg-paper/20",
  light: "border-ink/35 bg-paper/60 backdrop-blur-md hover:bg-surface",
} as const;

const circleBase =
  "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = toneClass[tone];
  const t = useTranslations("Nav");
  const ta = useTranslations("A11y");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const nextLocaleRef = useRef<Locale | null>(null);

  useEffect(() => {
    nextLocaleRef.current = null;
  }, [locale]);

  function cycleLanguage() {
    const current = nextLocaleRef.current ?? locale;
    const index = routing.locales.indexOf(current);
    const next = routing.locales[(index + 1) % routing.locales.length];
    nextLocaleRef.current = next;

    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <header
      className={`mx-auto flex w-full items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+21px)] ${color}`}
    >
      <div className="flex items-center gap-2.5">
        <Link
          className="focus-visible:outline-gold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/"
        >
          <Logo />
          <span className="sr-only">{t("home")}</span>
        </Link>

        <GoldenBaton tone={tone} />
      </div>

      <div className={`flex items-center gap-2 ${color}`}>
        <button
          aria-haspopup="dialog"
          aria-label={ta("openPanel")}
          className={`${circleBase} ${circle[tone]}`}
          data-a11y-trigger=""
          onClick={openAccessibilityPanel}
          type="button"
        >
          <Accessibility aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>

        <button
          aria-label={t("language", { name: LOCALE_LABELS[locale].name })}
          className={`${circleBase} ${flagCircle[tone]} overflow-hidden p-[2px] transition-transform hover:scale-105 disabled:opacity-60`}
          disabled={pending}
          onClick={cycleLanguage}
          type="button"
        >
          <span aria-hidden="true" className="block size-full overflow-hidden rounded-full">
            <span
              className={`fi fi-${FLAG[locale]} fis`}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </span>
        </button>

        <Link
          aria-label={t("programme")}
          className={`${circleBase} ${circle[tone]}`}
          href="/calendar"
        >
          <CalendarDays aria-hidden="true" size={18} strokeWidth={1.6} />
        </Link>

        <button
          aria-expanded={menuOpen}
          aria-label={t("menu")}
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
