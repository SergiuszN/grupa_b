"use client";

import { useEffect } from "react";
import {
  getSampler,
  setStringSoundAvailable,
  useStringSound,
} from "@/components/landing/string-sound";
import { NOTES } from "@/components/landing/violin-sampler";
import { prefersStillMotion } from "@/lib/motion";

const IDLE_MS = 120;
const MIN_PLUCK_GAP_MS = 35;

// Quarter note, eighth note and beamed eighths, drawn on a 24x24 grid.
const NOTE_GLYPHS = [
  '<ellipse cx="9" cy="18" rx="4.2" ry="3.1" transform="rotate(-22 9 18)"/><rect x="12" y="3" width="1.8" height="15"/>',
  '<ellipse cx="8" cy="18" rx="4.2" ry="3.1" transform="rotate(-22 8 18)"/><rect x="11" y="3" width="1.8" height="15"/><path d="M12.8 3c0 3 5.2 4.4 5.2 8.6 0 1.4-.5 2.6-1.2 3.6.3-3.6-2.4-5.4-4-5.8z"/>',
  '<ellipse cx="5.5" cy="19" rx="3.6" ry="2.7" transform="rotate(-22 5.5 19)"/><ellipse cx="17.5" cy="17" rx="3.6" ry="2.7" transform="rotate(-22 17.5 17)"/><rect x="8" y="5" width="1.6" height="14"/><rect x="20" y="3" width="1.6" height="14"/><path d="M8 5 21.6 3v3L8 8z"/>',
];

// Zero gravity: each note keeps a bit of the pointer's momentum plus a random push,
// then drifts and tumbles slowly with no fall or rise.
function floatingNote(
  root: HTMLElement,
  x: number,
  y: number,
  strength: number,
  vx: number,
  vy: number,
) {
  const note = document.createElement("span");
  note.className = "string-note";
  note.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${
    NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)]
  }</svg>`;
  const angle = Math.random() * Math.PI * 2;
  const push = 40 + Math.random() * 60;
  const carry = (v: number) => Math.max(-120, Math.min(120, v * 90));
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  // Random size, nudged up a little by how hard the string was played.
  const size = (9 + Math.random() * 40) * (0.85 + strength * 0.3);
  note.style.setProperty("--note-size", `${size}px`);
  note.style.setProperty(
    "--note-dx",
    `${Math.cos(angle) * push + carry(vx)}px`,
  );
  note.style.setProperty(
    "--note-dy",
    `${Math.sin(angle) * push + carry(vy)}px`,
  );
  note.style.setProperty("--note-tilt", `${(Math.random() - 0.5) * 50}deg`);
  note.style.setProperty("--note-spin", `${(Math.random() - 0.5) * 300}deg`);
  note.addEventListener("animationend", () => note.remove());
  root.appendChild(note);
}

/** Plays the violin from pointer movement over the hero; toggled from the menu sheet. */
export function StringPlayground() {
  const { status } = useStringSound();

  useEffect(() => {
    setStringSoundAvailable(true);
    return () => setStringSoundAvailable(false);
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    const sampler = getSampler();
    if (status !== "on" || !root || !sampler) return;

    const still = prefersStillMotion();
    // Tracked per pointer, so several fingers can play at once on a phone.
    const pointers = new Map<
      number,
      { x: number; y: number; t: number; note: number }
    >();
    let lastPluck = 0;
    let idle = 0;

    const release = () => {
      pointers.clear();
      sampler.release();
    };

    const lift = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (event.pointerType === "mouse") sampler.release();
    };

    const onInteractive = (event: PointerEvent) =>
      (event.target as Element).closest("a, button, input, [role='dialog']") !==
      null;

    const locate = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const column = Math.min(
        NOTES.length - 1,
        Math.floor((x / bounds.width) * NOTES.length),
      );
      return { x, y, note: NOTES[Math.max(0, column)] };
    };

    const pluck = (
      x: number,
      y: number,
      note: number,
      intensity: number,
      vx: number,
      vy: number,
      touch: boolean,
    ) => {
      sampler.pluck(note, Math.max(0.3, intensity));
      if (!still) floatingNote(root, x, y, intensity, vx, vy);
      // A tiny tick under the finger where supported (Android).
      if (touch) navigator.vibrate?.(4);
    };

    const move = (event: PointerEvent) => {
      const touch = event.pointerType !== "mouse";
      if (touch && event.buttons === 0) return;
      if (onInteractive(event)) {
        lift(event);
        return;
      }

      const { x, y, note } = locate(event);
      const now = event.timeStamp;
      const last = pointers.get(event.pointerId);

      if (last) {
        const distance = Math.hypot(x - last.x, y - last.y);
        const dt = Math.max(1, now - last.t);
        const vx = (x - last.x) / dt;
        const vy = (y - last.y) / dt;
        const intensity = Math.min(1, distance / dt / 1.5);
        // Held mouse button bows; hover and finger swipes pluck across the strings.
        const bowing = !touch && event.buttons === 1;

        if (bowing) {
          if (distance > 0) {
            sampler.bow(note, Math.max(0.25, intensity));
            if (note !== last.note && !still)
              floatingNote(root, x, y, intensity, vx, vy);
          }
        } else if (
          note !== last.note &&
          (touch || now - lastPluck > MIN_PLUCK_GAP_MS)
        ) {
          pluck(x, y, note, intensity, vx, vy, touch);
          lastPluck = now;
        }
      }
      pointers.set(event.pointerId, { x, y, t: now, note });

      if (touch) return;
      window.clearTimeout(idle);
      idle = window.setTimeout(release, IDLE_MS);
    };

    const down = (event: PointerEvent) => {
      if (onInteractive(event)) return;
      if (event.pointerType === "mouse") {
        event.preventDefault();
        return;
      }
      // A tap plucks the string under the finger, before any swipe.
      const { x, y, note } = locate(event);
      pointers.set(event.pointerId, { x, y, t: event.timeStamp, note });
      pluck(x, y, note, 0.6, 0, 0, true);
    };

    const hidden = () => {
      if (document.hidden) release();
    };

    // Keep the browser from scrolling, zooming, selecting or showing the long-press menu.
    const previous = {
      touchAction: root.style.touchAction,
      userSelect: root.style.userSelect,
      callout: root.style.getPropertyValue("-webkit-touch-callout"),
    };
    root.style.touchAction = "none";
    root.style.userSelect = "none";
    root.style.setProperty("-webkit-user-select", "none");
    root.style.setProperty("-webkit-touch-callout", "none");
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", lift);
    root.addEventListener("pointerup", lift);
    root.addEventListener("pointercancel", lift);
    document.addEventListener("visibilitychange", hidden);

    return () => {
      window.clearTimeout(idle);
      root.style.touchAction = previous.touchAction;
      root.style.userSelect = previous.userSelect;
      root.style.removeProperty("-webkit-user-select");
      root.style.setProperty("-webkit-touch-callout", previous.callout);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", lift);
      root.removeEventListener("pointerup", lift);
      root.removeEventListener("pointercancel", lift);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [status]);

  return null;
}
