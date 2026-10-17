"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import {
  Accessibility,
  X,
  RotateCcw,
  Type,
  SunMedium,
  Ruler,
  MousePointer,
  ScanLine,
  Activity,
  Palette,
  BookOpen,
  Underline,
} from "lucide-react";

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
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

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
        (desktopTriggerRef.current ?? mobileTriggerRef.current)?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(target as Node) &&
        !target?.closest("[data-a11y-trigger]")
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
          className="pointer-events-none fixed left-0 w-full h-14 bg-gold/20 border-y-2 border-gold z-40 transition-transform duration-75"
          style={{ top: `${mouseY - 28}px` }}
        />
      )}

      {/* Accessibility Trigger & Dialog */}
      <div className="font-sans" data-a11y-panel="true">
        {/* MOBILE SLIDE-OUT TAB: docked to right edge, vertical text, height: fit-content (elongated) */}
        <button
          ref={mobileTriggerRef}
          data-a11y-trigger="true"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="a11y-dialog"
          aria-label={t("openPanel")}
          className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 flex h-fit min-h-[140px] w-8 flex-col items-center justify-between gap-3 rounded-l-2xl border-l border-y border-r-0 border-white/20 bg-black/60 py-3.5 text-paper backdrop-blur-xl transition-all duration-300 hover:border-gold/60 hover:bg-black/85 hover:translate-x-0 translate-x-1 active:translate-x-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {activeCount > 0 && (
            <span className="absolute inset-0 rounded-l-2xl bg-gold/10 animate-pulse" />
          )}

          <Accessibility
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
            className="text-gold shrink-0 relative"
          />

          <span
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            className="text-[9px] font-bold tracking-[0.18em] uppercase text-paper/90 select-none py-1 relative"
          >
            {t("buttonLabel")}
          </span>

          {activeCount > 0 ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white shrink-0 relative">
              {activeCount}
            </span>
          ) : (
            <span className="h-1 shrink-0" />
          )}
        </button>

        {/* DESKTOP CAPSULE: floating bottom-6 right-6 pill */}
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
          <button
            ref={desktopTriggerRef}
            data-a11y-trigger="true"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="a11y-dialog"
            aria-label={t("openPanel")}
            className="group relative flex h-11 items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 text-paper backdrop-blur-xl transition-all duration-300 hover:border-gold/60 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold cursor-pointer"
          >
            {activeCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-gold/10 animate-pulse" />
            )}

            <Accessibility aria-hidden="true" size={17} strokeWidth={1.8} className="text-gold relative" />

            <span className="text-caption font-bold tracking-[0.16em] uppercase text-paper relative">
              {t("buttonLabel")}
            </span>

            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white relative">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Accessibility Modal Panel — Glassmorphism (Mobile: bottom sheet / Desktop: anchored right) */}
        {isOpen && (
          <div
            ref={panelRef}
            id="a11y-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-panel-heading"
            className="fixed inset-x-3 bottom-4 md:inset-auto md:fixed md:bottom-20 md:right-6 z-50 w-[calc(100vw-1.5rem)] md:w-[410px] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-black/75 p-5 md:p-6 text-paper backdrop-blur-2xl space-y-6"
          >
            {/* Subtle top highlight line */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <p className="text-caption font-medium tracking-[0.16em] uppercase text-gold">
                  {t("panelSubtitle")}
                </p>
                <h2 id="a11y-panel-heading" className="text-title font-bold mt-1 tracking-tight">
                  {t("panelTitle")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-caption font-semibold text-gold hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    <span>{t("resetAll")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    (desktopTriggerRef.current ?? mobileTriggerRef.current)?.focus();
                  }}
                  aria-label={t("closePanel")}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-paper transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold cursor-pointer"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Section 1: Wielkość tekstu */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Type size={15} strokeWidth={1.8} className="text-gold" />
                <label className="text-caption font-medium tracking-[0.16em] uppercase text-muted">
                  {t("textSize")}
                </label>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
                {(["normal", "large", "xlarge"] as const).map((size) => {
                  const active = settings.textSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, textSize: size }))}
                      aria-pressed={active}
                      className={`py-1.5 text-caption font-bold rounded-full transition-all cursor-pointer ${
                        active
                          ? "bg-gold text-white"
                          : "text-muted hover:text-paper"
                      }`}
                    >
                      {size === "normal" && t("textNormal")}
                      {size === "large" && t("textLarge")}
                      {size === "xlarge" && t("textXLarge")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Kontrast */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <SunMedium size={15} strokeWidth={1.8} className="text-gold" />
                <label className="text-caption font-medium tracking-[0.16em] uppercase text-muted">
                  {t("contrast")}
                </label>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
                {(["normal", "high", "yellow-black"] as const).map((c) => {
                  const active = settings.contrast === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, contrast: c }))}
                      aria-pressed={active}
                      className={`py-1.5 px-1 text-caption font-bold rounded-full transition-all truncate cursor-pointer ${
                        active
                          ? "bg-gold text-white"
                          : "text-muted hover:text-paper"
                      }`}
                    >
                      {c === "normal" && t("contrastNormal")}
                      {c === "high" && t("contrastHigh")}
                      {c === "yellow-black" && t("contrastYellowBlack")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {[
                {
                  key: "readingGuide" as const,
                  icon: <Ruler size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("readingGuide"),
                  desc: t("readingGuideDesc"),
                },
                {
                  key: "grayscale" as const,
                  icon: <Palette size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("grayscale"),
                  desc: t("grayscaleDesc"),
                },
                {
                  key: "readableFont" as const,
                  icon: <BookOpen size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("readableFont"),
                  desc: t("readableFontDesc"),
                },
                {
                  key: "highlightLinks" as const,
                  icon: <Underline size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("highlightLinks"),
                  desc: t("highlightLinksDesc"),
                },
                {
                  key: "bigCursor" as const,
                  icon: <MousePointer size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("bigCursor"),
                  desc: t("bigCursorDesc"),
                },
                {
                  key: "textSpacing" as const,
                  icon: <ScanLine size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("textSpacing"),
                  desc: t("textSpacingDesc"),
                },
                {
                  key: "reduceMotion" as const,
                  icon: <Activity size={18} strokeWidth={1.8} className="text-gold shrink-0" />,
                  label: t("reduceMotion"),
                  desc: t("reduceMotionDesc"),
                },
              ].map(({ key, icon, label, desc }) => {
                const active = settings[key] as boolean;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {icon}
                      <div>
                        <div className="text-body font-medium leading-none">{label}</div>
                        <div className="text-caption text-muted mt-1">{desc}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                        active
                          ? "bg-gold"
                          : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-paper transition-transform ${
                          active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Section 4: Keyboard Shortcuts Footer */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="text-caption text-muted font-medium tracking-[0.16em] uppercase">
                {t("shortcutsTitle")}
              </div>
              <div className="flex items-center justify-between text-caption text-muted">
                <span>{t("shortcutA11y")}</span>
                <kbd className="px-2 py-0.5 rounded-md border border-gold/30 bg-gold/10 font-mono text-[11px] text-gold">
                  Alt + A
                </kbd>
              </div>
              <div className="flex items-center justify-between text-caption text-muted">
                <span>{t("shortcutLang")}</span>
                <kbd className="px-2 py-0.5 rounded-md border border-gold/30 bg-gold/10 font-mono text-[11px] text-gold">
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
