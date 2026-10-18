"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { prefersStillMotion } from "@/lib/motion";

/** Decorative only: native Link navigation and prefetching must never wait for it. */
export function PageTransition() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (prefersStillMotion()) return;

    // A brief, non-blocking fade after the new route commits. No click
    // interception, navigation timers or expensive full-screen backdrop blur.
    const animation = veilRef.current?.animate(
      [{ opacity: 0.35 }, { opacity: 0 }],
      { duration: 160, easing: "ease-out" },
    );

    return () => animation?.cancel();
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="page-veil pointer-events-none fixed inset-0 z-[70]"
      ref={veilRef}
    />
  );
}
