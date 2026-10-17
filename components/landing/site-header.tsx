"use client";

import { Link } from "@/i18n/routing";
import { useState } from "react";
import { CalendarDays, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { MenuSheet } from "@/components/landing/menu-sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
  const t = useTranslations("Nav");
  const color = toneClass[tone];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`mx-auto flex w-full items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+21px)] ${color}`}
    >
      <Link
        className="focus-visible:outline-gold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        href="/"
      >
        <Logo />
        <span className="sr-only">{t("home")}</span>
      </Link>

      <div className={`flex items-center gap-2 ${color}`}>
        {/* Language switcher — uses next-intl routing */}
        <LanguageSwitcher />

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
