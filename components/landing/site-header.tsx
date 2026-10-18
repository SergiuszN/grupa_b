"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Accessibility, CalendarDays, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MenuSheet } from "@/components/landing/menu-sheet";
import { openAccessibilityPanel } from "@/components/AccessibilityControl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const toneClass = {
  dark: "text-paper",
  light: "text-ink",
} as const;

const circle = {
  dark: "border-paper/40 bg-paper/10 backdrop-blur-md hover:bg-paper/20",
  light: "border-ink/20 bg-paper/60 backdrop-blur-md hover:bg-surface",
} as const;

const circleBase =
  "flex size-[44px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = toneClass[tone];
  const t = useTranslations("Nav");
  const ta = useTranslations("A11y");
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

      <div className={`flex items-center gap-[8px] ${color}`}>
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

        <LanguageSwitcher tone={tone} />

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

      {/* Portal keeps the fixed sheet out of the header's entrance transform. */}
      {menuOpen
        ? createPortal(<MenuSheet onClose={() => setMenuOpen(false)} />, document.body)
        : null}
    </header>
  );
}
