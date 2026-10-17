"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { key: "programme", href: "/calendar" },
  { key: "forYou", href: "/start" },
  {
    key: "edu",
    href: "https://filharmonia.szczecin.pl/edu_filharmonia",
  },
  {
    key: "discover",
    href: "https://filharmonia.szczecin.pl/the_building",
  },
  {
    key: "visit",
    href: "https://filharmonia.szczecin.pl/zaplanuj_swoja_wizyte",
  },
  { key: "account", href: "https://filharmonia.szczecin.pl/tickets" },
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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-label={tn("menu")}
      aria-modal="true"
      className="bg-gold text-ink fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-6 pt-[calc(env(safe-area-inset-top)+21px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="flex items-center justify-between">
          <Link
            className="focus-visible:outline-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/"
            onClick={onClose}
          >
            <Logo />
            <span className="sr-only">{tn("home")}</span>
          </Link>

          <button
            aria-label={tn("closeMenu")}
            className="focus-visible:outline-ink flex size-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <nav aria-label="Menu główne" className="rise mt-6">
          {LINKS.map((link) => {
            const external = link.href.startsWith("http");
            const className =
              "focus-visible:outline-ink flex items-baseline justify-between border-b border-ink/25 py-4 text-[24px] leading-7 font-bold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-2 md:text-[28px]";

            return external ? (
              <a
                className={className}
                href={link.href}
                key={link.key}
                rel="noreferrer"
                target="_blank"
              >
                {t(link.key)}
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
              </a>
            ) : (
              <Link
                className={className}
                href={link.href}
                key={link.key}
                onClick={onClose}
              >
                {t(link.key)}
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
              </Link>
            );
          })}
        </nav>

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
