"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LOCALE_LABELS, routing, type Locale, usePathname, useRouter } from "@/i18n/routing";

const FLAG: Record<Locale, string> = { pl: "pl", en: "gb", de: "de" };

const trigger = {
  dark: "border-paper/60 bg-paper/10 backdrop-blur-md hover:bg-paper/20",
  light: "border-ink/35 bg-paper/60 backdrop-blur-md hover:bg-surface",
} as const;

function Flag({ locale }: { locale: Locale }) {
  return (
    <span aria-hidden="true" className="block size-full overflow-hidden rounded-full">
      <span
        className={`fi fi-${FLAG[locale]} fis`}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </span>
  );
}

/**
 * LanguageSwitcher — flag pill that opens a menu of locales (WAI-ARIA menu button).
 * Arrow keys / Home / End move between options, Escape closes and returns focus.
 */
export function LanguageSwitcher({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusOnOpen = useRef(0);

  function openMenu(index: number) {
    focusOnOpen.current = index;
    setOpen(true);
  }

  function closeMenu(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function selectLocale(next: Locale) {
    closeMenu();
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  useEffect(() => {
    if (!open) return;
    itemRefs.current[focusOnOpen.current]?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const currentIndex = routing.locales.indexOf(locale);
  const last = routing.locales.length - 1;

  function onButtonKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(last);
    }
  }

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const index = itemRefs.current.findIndex((item) => item === document.activeElement);
    const focus = (i: number) => itemRefs.current[i]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focus(index >= last ? 0 : index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focus(index <= 0 ? last : index - 1);
        break;
      case "Home":
        event.preventDefault();
        focus(0);
        break;
      case "End":
        event.preventDefault();
        focus(last);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("language", { name: LOCALE_LABELS[locale].name })}
        className={`focus-visible:outline-gold relative flex size-[44px] shrink-0 items-center justify-center rounded-full border-[1.5px] p-[2px] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60 ${trigger[tone]}`}
        disabled={pending}
        onClick={() => (open ? closeMenu() : openMenu(currentIndex))}
        onKeyDown={onButtonKeyDown}
        ref={buttonRef}
        type="button"
      >
        <Flag locale={locale} />
        <span
          aria-hidden="true"
          className="bg-ink text-paper absolute -right-1 -bottom-1 flex size-[16px] items-center justify-center rounded-full"
        >
          <ChevronDown
            className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            size={11}
            strokeWidth={2.4}
          />
        </span>
      </button>

      {open ? (
        <div
          aria-label={t("languageMenu")}
          className="border-ink/15 bg-paper text-ink absolute top-full right-0 z-50 mt-2 min-w-44 rounded-2xl border p-1.5 shadow-lg"
          id={menuId}
          onKeyDown={onMenuKeyDown}
          role="menu"
        >
          {routing.locales.map((code, i) => {
            const selected = code === locale;
            return (
              <button
                aria-checked={selected}
                className={`focus-visible:outline-ink flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.9375rem] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${
                  selected ? "bg-ink/5" : "hover:bg-ink/5"
                }`}
                key={code}
                lang={code}
                onClick={() => selectLocale(code)}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitemradio"
                tabIndex={-1}
                type="button"
              >
                <span className="border-ink/20 size-6 shrink-0 rounded-full border">
                  <Flag locale={code} />
                </span>
                <span className="flex-1">{LOCALE_LABELS[code].name}</span>
                {selected ? <Check aria-hidden="true" size={16} strokeWidth={2.2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
