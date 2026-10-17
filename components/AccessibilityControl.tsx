"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link, routing, usePathname, useRouter } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";

const OPEN_EVENT = "a11y:open";

export function openAccessibilityPanel() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type TextSize = "normal" | "large" | "xlarge";
type Contrast = "normal" | "high" | "yellow-black";

interface A11yState {
  textSize: TextSize;
  contrast: Contrast;
  highlightLinks: boolean;
  bigCursor: boolean;
  textSpacing: boolean;
  reduceMotion: boolean;
  readingGuide: boolean;
  grayscale: boolean;
  readableFont: boolean;
}

const DEFAULT_STATE: A11yState = {
  textSize: "normal",
  contrast: "normal",
  highlightLinks: false,
  bigCursor: false,
  textSpacing: false,
  reduceMotion: false,
  readingGuide: false,
  grayscale: false,
  readableFont: false,
};

const TOGGLES = [
  { key: "readingGuide", hint: "Pasek skupienia wzroku za kursorem" },
  { key: "grayscale", hint: "Dla osób z daltonizmem" },
  { key: "readableFont", hint: "Wyraźne podstawy liter" },
  { key: "highlightLinks", hint: "Wyraźne obramowanie odnośników" },
  { key: "bigCursor", hint: "Wysokokontrastowy kursor" },
  { key: "textSpacing", hint: "Zgodne z WCAG 1.4.12" },
  { key: "reduceMotion", hint: "Bezpieczne dla osób z epilepsją" },
] as const;

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/25 py-4">
      <div>
        <div className="text-[17px] leading-6 font-medium">{label}</div>
        <div className="mt-0.5 text-[12px] leading-4 opacity-60">{hint}</div>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative h-7 w-12 shrink-0 rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          checked ? "border-ink bg-ink" : "border-ink/40"
        }`}
        onClick={onChange}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all ${
            checked ? "left-6 bg-gold" : "left-1 bg-ink"
          }`}
        />
      </button>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex w-fit gap-1 rounded-full border-[1.5px] border-ink/30 p-1">
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            value === option.value ? "bg-ink text-gold" : "hover:bg-ink/5"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AccessibilityControl() {
  const t = useTranslations("A11y");
  const tn = useTranslations("Nav");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11yState>(DEFAULT_STATE);
  const [mouseY, setMouseY] = useState<number>(100);

  const closeRef = useRef<HTMLButtonElement>(null);

  function closePanel() {
    setIsOpen(false);
    document.querySelector<HTMLButtonElement>("[data-a11y-trigger]")?.focus();
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("a11y-preferences");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<A11yState>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of saved preferences
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Track mouse position for the Reading Guide / Ruler
  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.readingGuide]);

  // Header trigger + global shortcuts (Alt + A: toggle panel, Alt + L: cycle language)
  useEffect(() => {
    const open = () => setIsOpen(true);

    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.altKey && (e.key === "l" || e.key === "L" || e.code === "KeyL")) {
        e.preventDefault();
        const fromUrl = window.location.pathname.split("/")[1];
        const current = routing.locales.includes(fromUrl as any) ? fromUrl : currentLocale;
        const currentIndex = routing.locales.indexOf(current as any);
        const nextLocale = routing.locales[(currentIndex + 1) % routing.locales.length];
        router.replace(pathname, { locale: nextLocale });
      }
    };

    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [currentLocale, pathname, router]);

  // Sync state to DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;

    if (settings.textSize === "normal") {
      root.removeAttribute("data-a11y-text");
    } else {
      root.setAttribute("data-a11y-text", settings.textSize);
    }

    if (settings.contrast === "normal") {
      root.removeAttribute("data-a11y-contrast");
    } else {
      root.setAttribute("data-a11y-contrast", settings.contrast);
    }

    if (settings.highlightLinks) {
      root.setAttribute("data-a11y-links", "true");
    } else {
      root.removeAttribute("data-a11y-links");
    }

    if (settings.bigCursor) {
      root.setAttribute("data-a11y-cursor", "big");
    } else {
      root.removeAttribute("data-a11y-cursor");
    }

    if (settings.textSpacing) {
      root.setAttribute("data-a11y-spacing", "true");
    } else {
      root.removeAttribute("data-a11y-spacing");
    }

    if (settings.reduceMotion) {
      root.setAttribute("data-a11y-motion", "true");
    } else {
      root.removeAttribute("data-a11y-motion");
    }

    if (settings.grayscale) {
      root.setAttribute("data-a11y-grayscale", "true");
    } else {
      root.removeAttribute("data-a11y-grayscale");
    }

    if (settings.readableFont) {
      root.setAttribute("data-a11y-readable-font", "true");
    } else {
      root.removeAttribute("data-a11y-readable-font");
    }

    try {
      localStorage.setItem("a11y-preferences", JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Focus close button, lock scroll, close on Escape
  useEffect(() => {
    if (!isOpen) return;

    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const handleReset = () => {
    setSettings(DEFAULT_STATE);
  };

  const activeCount = Object.entries(settings).filter(([key, val]) => {
    if (key === "textSize") return val !== "normal";
    if (key === "contrast") return val !== "normal";
    return val === true;
  }).length;

  return (
    <>
      {/* Reading Guide / Ruler Overlay */}
      {settings.readingGuide && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 w-full h-14 bg-[#B48520]/20 border-y-2 border-[#B48520] z-[60] transition-transform duration-75 shadow-[0_0_15px_rgba(180,133,32,0.25)]"
          style={{ top: `${mouseY - 28}px` }}
        />
      )}

      {isOpen ? (
        <div
          aria-labelledby="a11y-panel-heading"
          aria-modal="true"
          className="bg-gold text-ink fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
        >
          <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-6 pt-[calc(env(safe-area-inset-top)+21px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
            <div className="flex items-center justify-between">
              <Link
                className="focus-visible:outline-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/"
                onClick={() => setIsOpen(false)}
              >
                <Logo />
                <span className="sr-only">{tn("home")}</span>
              </Link>

              <button
                aria-label={t("closePanel")}
                className="focus-visible:outline-ink flex size-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-4"
                onClick={closePanel}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="rise mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] leading-[14px] font-medium tracking-[0.14em] opacity-70">
                  Filharmonia Szczecin • WCAG
                </p>
                <h2
                  className="mt-1 text-[28px] leading-8 font-bold tracking-[-0.02em] md:text-[34px]"
                  id="a11y-panel-heading"
                >
                  {t("panelTitle")}
                </h2>
              </div>
              {activeCount > 0 && (
                <button
                  className="shrink-0 rounded-full border-[1.5px] border-current px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  onClick={handleReset}
                  type="button"
                >
                  {t("resetAll")} ({activeCount})
                </button>
              )}
            </div>

            <div className="rise mt-8 space-y-6">
              <div className="space-y-2.5">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-70">
                  {t("textSize")}
                </span>
                <Segmented
                  onChange={(textSize) => setSettings((s) => ({ ...s, textSize }))}
                  options={[
                    { value: "normal", label: t("textNormal") },
                    { value: "large", label: t("textLarge") },
                    { value: "xlarge", label: t("textXLarge") },
                  ]}
                  value={settings.textSize}
                />
              </div>

              <div className="space-y-2.5">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-70">
                  {t("contrast")}
                </span>
                <Segmented
                  onChange={(contrast) => setSettings((s) => ({ ...s, contrast }))}
                  options={[
                    { value: "normal", label: t("contrastNormal") },
                    { value: "high", label: t("contrastHigh") },
                    { value: "yellow-black", label: t("contrastYellowBlack") },
                  ]}
                  value={settings.contrast}
                />
              </div>

              <div>
                {TOGGLES.map(({ key, hint }) => (
                  <ToggleRow
                    checked={settings[key]}
                    hint={hint}
                    key={key}
                    label={t(key)}
                    onChange={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-1.5 pt-10 text-[12px] leading-5">
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-70">
                {t("shortcutsTitle")}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{t("shortcutA11y")}</span>
                <kbd className="rounded-md border border-ink/30 px-2 py-0.5 font-mono text-[10px]">Alt + A</kbd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{t("shortcutLang")}</span>
                <kbd className="rounded-md border border-ink/30 px-2 py-0.5 font-mono text-[10px]">Alt + L</kbd>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
