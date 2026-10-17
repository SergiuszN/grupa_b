"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

function prefersStillMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

  try {
    const saved = localStorage.getItem("a11y-preferences");
    return saved ? JSON.parse(saved).reduceMotion === true : false;
  } catch {
    return false;
  }
}

export function HeroMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;

    const q = gsap.utils.selector(root);
    const animated = q('[data-anim], header');

    if (prefersStillMotion()) {
      gsap.set(animated, { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1, clearProps: "transform" });
      return;
    }

    const ctx = gsap.context(() => {
      const gallery = q('[data-anim="gallery"]');
      const scrim = q('[data-anim="scrim"]');
      const header = q("header");
      const lines = q('[data-anim="line"]');
      const copy = q('[data-anim="copy"]');

      gsap.set(gallery, { opacity: 0, scale: 1.14 });
      gsap.set(scrim, { opacity: 0.45 });
      gsap.set(header, { opacity: 0, y: -16 });
      gsap.set(lines, { yPercent: 110, y: 0, x: 0 });
      gsap.set(copy, { opacity: 0, y: 16 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(gallery, { opacity: 1, scale: 1.06, duration: 2.4, ease: "power2.out" })
        .to(scrim, { opacity: 1, duration: 0.9 }, 0.1)
        .to(header, { opacity: 1, y: 0, duration: 0.9, clearProps: "transform" }, 0.25)
        .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "expo.out" }, 0.35)
        .to(copy, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 }, 0.85);

      gsap.to(gallery, {
        scale: 1.13,
        duration: 18,
        ease: "none",
        repeat: -1,
        yoyo: true,
        delay: 2.4,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return null;
}
