"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, LoaderCircle, Music2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { MenuSearch } from "@/components/landing/menu-search";
import { toggleStringSound, useStringSound } from "@/components/landing/string-sound";

const PRIMARY = [
  { key: "programme", href: "/calendar" },
  { key: "forYou", href: "/start" },
  { key: "visit", href: "/visit" },
  { key: "edu", href: "/edu" },
] as const;

const SECONDARY = [
  { key: "artists", href: "/artists" },
  { key: "exhibitions", href: "/exhibitions" },
  { key: "tours", href: "/tours" },
  { key: "building", href: "/building" },
  { key: "history", href: "/history" },
  { key: "partners", href: "/partners" },
  { key: "media", href: "/media" },
  { key: "account", href: "/account" },
] as const;

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://facebook.com/filharmoniaszczecin",
    path: "M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.2-1.5 1.5-1.5H16V4.3c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7v3h2.6V21z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/filharmoniaszczecin",
    path: "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm4 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7m0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M17 6.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/channel/UCQ7RqRSiL8J0A5mOLxZMTZg",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8M10 15V9l5.2 3z",
  },
] as const;

export function MenuSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Menu");
  const tn = useTranslations("Nav");
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sound = useStringSound();

  useEffect(() => {
    // Trigger fluid background transition on mount
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 450);
  }, [isClosing, onClose]);

  async function toggleSound() {
    const turningOn = sound.status === "off";
    await toggleStringSound();
    // Close the sheet once the violin is ready, so the photo can be played right away.
    if (turningOn) handleClose();
  }

  useEffect(() => {
    closeRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleClose]);

  return (
    <div
      aria-label={tn("menu")}
      aria-modal="true"
      className={`bg-gold text-ink fixed inset-0 z-50 overflow-y-auto transition-opacity duration-500 ease-in-out ${
        isOpen && !isClosing ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
    >
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-6 pt-[calc(env(safe-area-inset-top)+21px)] pb-[calc(env(safe-area-inset-bottom)+32px)] transition-all duration-500 ease-out transform ${
          isOpen && !isClosing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link
            className="focus-visible:outline-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/"
            onClick={() => {
              if (pathname === "/") handleClose();
            }}
          >
            <Logo />
            <span className="sr-only">{tn("home")}</span>
          </Link>

          <button
            aria-label={tn("closeMenu")}
            className="focus-visible:outline-ink flex size-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-4 cursor-pointer"
            onClick={handleClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <MenuSearch onNavigate={onClose} />

        <nav aria-label="Menu główne" className="rise mt-6">
          {PRIMARY.map((link) => (
            <Link
              className="focus-visible:outline-ink flex items-baseline justify-between border-b border-ink/25 py-3.5 text-[24px] leading-7 font-bold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-2 md:text-[28px]"
              href={link.href}
              key={link.key}
              onClick={() => {
                if (pathname === link.href) handleClose();
              }}
            >
              {t(link.key)}
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </Link>
          ))}

          <div className="mt-5 grid grid-cols-2 gap-x-5">
            {SECONDARY.map((link) => (
              <Link
                className="focus-visible:outline-ink border-ink/15 flex items-baseline justify-between gap-2 border-b py-2.5 text-[15px] leading-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                href={link.href}
                key={link.key}
                onClick={() => {
                  if (pathname === link.href) handleClose();
                }}
              >
                {t(link.key)}
                <ArrowUpRight
                  aria-hidden="true"
                  className="opacity-60"
                  size={14}
                  strokeWidth={1.8}
                />
              </Link>
            ))}
          </div>
        </nav>

        {sound.available ? (
          <button
            aria-busy={sound.status === "loading"}
            aria-checked={sound.status !== "off"}
            className="rise focus-visible:outline-ink mt-6 flex w-full cursor-pointer items-center gap-4 rounded-2xl border-[1.5px] border-ink/25 px-4 py-3.5 text-left transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2"
            disabled={sound.status === "loading"}
            onClick={toggleSound}
            role="switch"
            type="button"
          >
            <Music2
              aria-hidden="true"
              className="shrink-0"
              size={22}
              strokeWidth={1.7}
            />
            <span className="flex-1">
              <span className="block text-[17px] leading-6 font-bold">
                {t("sound")}
              </span>
              <span className="block text-[13px] leading-[18px] opacity-75">
                {t("soundHint")}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`relative h-7 w-12 shrink-0 rounded-full border-[1.5px] border-ink transition-colors ${
                sound.status === "off" ? "" : "bg-ink"
              }`}
            >
              <span
                className={`absolute top-1/2 left-[3px] flex size-5 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 ${
                  sound.status === "off" ? "bg-ink" : "bg-gold translate-x-5"
                }`}
              >
                {sound.status === "loading" ? (
                  <LoaderCircle
                    className="animate-spin text-ink"
                    size={14}
                    strokeWidth={2.2}
                  />
                ) : null}
              </span>
            </span>
          </button>
        ) : null}

        <div className="mt-auto pt-10">
          <p className="text-[11px] leading-[14px] font-medium tracking-[0.14em] opacity-70">
            {t("contact")}
          </p>

          <div className="mt-3 flex flex-col gap-1.5 text-[15px] leading-[22px]">
            <a className="w-fit underline underline-offset-4" href="mailto:kasa@filharmonia.szczecin.pl">
              kasa@filharmonia.szczecin.pl
            </a>
            <a className="w-fit underline underline-offset-4" href="tel:+48537999307">
              +48 537 999 307
            </a>
            <p className="opacity-80">ul. Małopolska 48, 70-515 Szczecin</p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {SOCIALS.map(({ label, href, path }) => (
              <a
                aria-label={label}
                className="focus-visible:outline-ink flex size-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-4"
                href={href}
                key={label}
                rel="noreferrer"
                target="_blank"
              >
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
