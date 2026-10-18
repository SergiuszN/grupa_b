"use client";

import { useEffect } from "react";
import { observeHeroActivity } from "@/components/landing/hero-activity";

/** Entrances use compositor-friendly CSS; no per-frame JS or second background zoom. */
export function HeroMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;

    const stop = observeHeroActivity(root, (active) => {
      root.dataset.heroPaused = String(!active);
    });
    return () => {
      stop();
      delete root.dataset.heroPaused;
    };
  }, []);

  return null;
}
