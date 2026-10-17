"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { prefersStillMotion } from "@/lib/motion";

/**
 * Entrance choreography for every flow screen. Pages opt in with
 * data-flow="eyebrow|title|copy|media|image|actions", lists mark children
 * with data-flow-item, FlowSteps marks dots with data-flow-dot.
 */
export function FlowMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-flow-screen]");
    if (!root) return;

    const q = gsap.utils.selector(root);
    const marked = [...q("[data-flow]"), ...q("[data-flow-item]"), ...q("[data-flow-dot]")];

    if (prefersStillMotion()) {
      gsap.set(marked, { autoAlpha: 1, x: 0, y: 0, scale: 1, clearProps: "transform,visibility" });
      gsap.set(q("header"), { autoAlpha: 1, y: 0, clearProps: "transform,visibility" });
      return;
    }

    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        q("header"),
        { yPercent: -15, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.65, clearProps: "transform,visibility" },
        0,
      )
        .fromTo(
          q("[data-flow-dot]"),
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "back.out(2.4)",
            clearProps: "transform,visibility",
          },
          0.08,
        )
        .fromTo(
          q('[data-flow="eyebrow"]'),
          { y: 8, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, clearProps: "transform,visibility" },
          0.12,
        )
        .fromTo(
          q('[data-flow="title"]'),
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.75, clearProps: "transform,visibility" },
          0.2,
        )
        .fromTo(
          q('[data-flow="copy"]'),
          { y: 14, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.07,
            clearProps: "transform,visibility",
          },
          0.34,
        )
        .fromTo(
          q('[data-flow="image"]'),
          { scale: 1.12, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 1.5,
            ease: "power2.out",
            clearProps: "transform,visibility",
          },
          0.1,
        )
        .fromTo(
          q('[data-flow="media"]'),
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.75, clearProps: "transform,visibility" },
          0.38,
        )
        .fromTo(
          q("[data-flow-item]"),
          { y: 16, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.5,
            stagger: 0.06,
            clearProps: "transform,visibility",
          },
          0.44,
        )
        .fromTo(
          q('[data-flow="actions"]'),
          { y: 16, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.06,
            clearProps: "transform,visibility",
          },
          0.52,
        );

      q("a, button").forEach((node) => {
        const el = node as HTMLElement;
        const down = () =>
          gsap.to(el, { scale: 0.97, duration: 0.12, ease: "power2.out", overwrite: "auto" });
        const up = () =>
          gsap.to(el, {
            scale: 1,
            duration: 0.45,
            ease: "elastic.out(1, 0.55)",
            overwrite: "auto",
          });

        el.addEventListener("pointerdown", down);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointerleave", up);
        el.addEventListener("pointercancel", up);

        cleanups.push(() => {
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointerleave", up);
          el.removeEventListener("pointercancel", up);
          gsap.killTweensOf(el);
          gsap.set(el, { clearProps: "transform" });
        });
      });
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return null;
}
