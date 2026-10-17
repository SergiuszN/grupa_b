"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const LANG_KEY = "filharmonia:lang";
const LANGS = [
  { code: "PL", name: "polski" },
  { code: "EN", name: "angielski" },
  { code: "DE", name: "niemiecki" },
] as const;

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
  const [lang, setLang] = useState(0);

  useEffect(() => {
    const saved = LANGS.findIndex(
      (item) => item.code === localStorage.getItem(LANG_KEY),
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the saved language
    if (saved >= 0) setLang(saved);
  }, []);

  function cycleLanguage() {
    const next = (lang + 1) % LANGS.length;
    setLang(next);
    localStorage.setItem(LANG_KEY, LANGS[next].code);
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
          aria-label={`Język: ${LANGS[lang].name}. Zmień`}
          className="focus-visible:outline-gold size-11 shrink-0 overflow-hidden rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={cycleLanguage}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`fi fi-${LANGS[lang].code.toLowerCase()} fis block leading-none`}
            style={{ fontSize: "44px" }}
          />
        </button>

        <button
          aria-label="Repertuar"
          className={`${circleBase} ${circle[tone]}`}
          type="button"
        >
          <CalendarDays aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>

        <button
          aria-label="Menu"
          className={`${circleBase} ${circle[tone]}`}
          type="button"
        >
          <Menu aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
