"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const COVER_MS = 140;
const REVEAL_MS = 320;

/**
 * Soft page handoff: a blurred paper veil covers the old page, the route
 * changes underneath, then the veil fades away. Links that cannot be handled
 * client-side (external, new tab, hash, download) are left alone.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const target = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.dataset.noTransition !== undefined
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash && url.pathname === window.location.pathname) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      event.preventDefault();
      clear();
      target.current = url.pathname;
      setPhase("cover");

      timers.current.push(
        window.setTimeout(() => {
          router.push(`${url.pathname}${url.search}${url.hash}`);
        }, COVER_MS),
      );
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, [router]);

  useEffect(() => {
    if (!target.current) return;

    const reached = pathname === target.current;
    if (!reached) return;

    target.current = null;
    const frame = requestAnimationFrame(() => setPhase("reveal"));
    const timer = window.setTimeout(() => setPhase("idle"), REVEAL_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={`page-veil fixed inset-0 z-[70] ${
        phase === "cover"
          ? "page-veil-cover"
          : phase === "reveal"
            ? "page-veil-reveal"
            : ""
      }`}
    />
  );
}
