"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";

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

export function AccessibilityControl() {
  const t = useTranslations("A11y");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11yState>(DEFAULT_STATE);
  const [mouseY, setMouseY] = useState<number>(100);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("a11y-preferences");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<A11yState>;
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

  // Global Keyboard Shortcuts (Alt + A: Toggle panel, Alt + L: Cycle language)
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.altKey && (e.key === "l" || e.key === "L" || e.code === "KeyL")) {
        e.preventDefault();
        const currentIndex = routing.locales.indexOf(currentLocale as any);
        const nextLocale = routing.locales[(currentIndex + 1) % routing.locales.length];
        router.replace(pathname, { locale: nextLocale });
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
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

  // Handle Escape key & outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
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
          className="pointer-events-none fixed left-0 w-full h-14 bg-[#B48520]/20 border-y-2 border-[#B48520] z-40 transition-transform duration-75 shadow-[0_0_15px_rgba(180,133,32,0.25)]"
          style={{ top: `${mouseY - 28}px` }}
        />
      )}

      {/* Floating Filharmonia-styled Button */}
      <div className="fixed bottom-6 right-6 z-50 font-sans" data-a11y-panel="true">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="a11y-dialog"
          aria-label={t("openPanel")}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-950/90 hover:bg-neutral-900 text-white border border-[#B48520]/50 hover:border-[#B48520] shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B48520]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B48520] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B48520]" />
          </span>

          <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-200 group-hover:text-white">
            Dostępność
          </span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-[#C9972E] transition-transform duration-300 group-hover:rotate-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="4.5" r="2.5" />
            <path d="M4 8.5h16" />
            <path d="M12 8.5v6" />
            <path d="M8 21l4-6.5 4 6.5" />
          </svg>

          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-[#B48520] text-black">
              {activeCount}
            </span>
          )}
        </button>

        {/* Accessibility Modal Panel */}
        {isOpen && (
          <div
            ref={panelRef}
            id="a11y-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-panel-heading"
            className="absolute bottom-14 right-0 w-[calc(100vw-2rem)] sm:w-[410px] max-h-[85vh] overflow-y-auto rounded-[32px] bg-[#0F0F0F]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-6 space-y-6 text-white"
          >
            {/* Header with Filharmonia Branding */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="text-[10px] tracking-[0.22em] font-semibold text-[#C9972E] uppercase">
                  Filharmonia Szczecin • WCAG
                </div>
                <h2 id="a11y-panel-heading" className="font-bold text-xl tracking-tight text-white mt-0.5">
                  {t("panelTitle")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs px-2.5 py-1 rounded-full text-[#C9972E] hover:text-white hover:bg-white/5 transition cursor-pointer font-medium"
                  >
                    {t("resetAll")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  aria-label={t("closePanel")}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Section 1: Wielkość tekstu */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.14em] block">
                {t("textSize")}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-neutral-900/90 border border-white/5 rounded-full">
                {(["normal", "large", "xlarge"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, textSize: size }))}
                    aria-pressed={settings.textSize === size}
                    className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                      settings.textSize === size
                        ? "bg-[#B48520] text-white shadow-md"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {size === "normal" && t("textNormal")}
                    {size === "large" && t("textLarge")}
                    {size === "xlarge" && t("textXLarge")}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Kontrast */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.14em] block">
                {t("contrast")}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-neutral-900/90 border border-white/5 rounded-full">
                {(["normal", "high", "yellow-black"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, contrast: c }))}
                    aria-pressed={settings.contrast === c}
                    className={`py-2 px-1 text-xs font-semibold rounded-full transition-all truncate cursor-pointer ${
                      settings.contrast === c
                        ? "bg-[#B48520] text-white shadow-md"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {c === "normal" && t("contrastNormal")}
                    {c === "high" && t("contrastHigh")}
                    {c === "yellow-black" && t("contrastYellowBlack")}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Przełączniki (Toggles) */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              {/* Reading Guide / Ruler */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("readingGuide")}</div>
                  <div className="text-[11px] text-neutral-500">Pasek skupienia wzroku za kursorem</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.readingGuide}
                  onClick={() =>
                    setSettings((s) => ({ ...s, readingGuide: !s.readingGuide }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.readingGuide ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.readingGuide ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Grayscale Mode */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("grayscale")}</div>
                  <div className="text-[11px] text-neutral-500">Dla osób z daltonizmem</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.grayscale}
                  onClick={() =>
                    setSettings((s) => ({ ...s, grayscale: !s.grayscale }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.grayscale ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.grayscale ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Dyslexia / Readable Font */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("readableFont")}</div>
                  <div className="text-[11px] text-neutral-500">Wyraźne podstawy liter</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.readableFont}
                  onClick={() =>
                    setSettings((s) => ({ ...s, readableFont: !s.readableFont }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.readableFont ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.readableFont ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Highlight Links */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("highlightLinks")}</div>
                  <div className="text-[11px] text-neutral-500">Wyraźne obramowanie odnośników</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.highlightLinks}
                  onClick={() =>
                    setSettings((s) => ({ ...s, highlightLinks: !s.highlightLinks }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.highlightLinks ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.highlightLinks ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Big Cursor */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("bigCursor")}</div>
                  <div className="text-[11px] text-neutral-500">Wysokokontrastowy kursor</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.bigCursor}
                  onClick={() => setSettings((s) => ({ ...s, bigCursor: !s.bigCursor }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.bigCursor ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.bigCursor ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Text Spacing */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("textSpacing")}</div>
                  <div className="text-[11px] text-neutral-500">Zgodne z WCAG 1.4.12</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.textSpacing}
                  onClick={() => setSettings((s) => ({ ...s, textSpacing: !s.textSpacing }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.textSpacing ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.textSpacing ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{t("reduceMotion")}</div>
                  <div className="text-[11px] text-neutral-500">Bezpieczne dla osób z epilepsją</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.reduceMotion}
                  onClick={() => setSettings((s) => ({ ...s, reduceMotion: !s.reduceMotion }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.reduceMotion ? "bg-[#B48520]" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reduceMotion ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Section 4: Keyboard Shortcuts Footer */}
            <div className="pt-3 border-t border-white/10 text-[11px] text-neutral-400 space-y-1.5">
              <div className="font-semibold text-neutral-300 uppercase tracking-[0.16em] text-[10px]">
                {t("shortcutsTitle")}
              </div>
              <div className="flex items-center justify-between">
                <span>{t("shortcutA11y")}</span>
                <kbd className="px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 font-mono text-[10px] text-[#C9972E]">
                  Alt + A
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("shortcutLang")}</span>
                <kbd className="px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 font-mono text-[10px] text-[#C9972E]">
                  Alt + L
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
