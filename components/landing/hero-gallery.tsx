"use client";

import { useEffect, useRef, useState } from "react";

const IMAGES = [
  "/photos/1-main.jpg",
  "/photos/2-second.jpg",
  "/photos/3-main.jpg",
  "/photos/exterior-3.jpg",
  "/photos/foyer-4.jpg",
  "/photos/illumination-3.jpg",
  "/photos/illumination-2.jpg",
  "/photos/chamber-1.jpg",
  "/photos/chamber-2.jpg",
  "/photos/symphonic-1.jpg",
  "/photos/symphonic-2.jpg",
  "/photos/symphonic-3.jpg",
];

const INTERVAL = 6000;

export function HeroGallery() {
  const [slides, setSlides] = useState([0]);
  const ready = useRef(new Set<number>());
  const loading = useRef(new Set<number>());
  const failed = useRef(new Set<number>());
  const current = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const load = (index: number) => {
      if (ready.current.has(index) || loading.current.has(index)) return;
      if (failed.current.has(index)) return;

      loading.current.add(index);
      const image = new Image();
      image.src = IMAGES[index];

      const loaded = () => {
        loading.current.delete(index);
        ready.current.add(index);
      };
      const broken = () => {
        loading.current.delete(index);
        failed.current.add(index);
      };

      if (typeof image.decode === "function") {
        image.decode().then(
          loaded,
          () => (image.naturalWidth > 0 ? loaded() : broken()),
        );
      } else {
        image.onload = loaded;
        image.onerror = broken;
      }
    };

    load(1);

    let timer = 0;

    const tick = () => {
      let next: number | null = null;

      for (let step = 1; step < IMAGES.length; step += 1) {
        const candidate = (current.current + step) % IMAGES.length;

        if (ready.current.has(candidate)) {
          next = candidate;
          break;
        }

        load(candidate);
      }

      if (next === null) {
        timer = window.setTimeout(tick, 500);
        return;
      }

      setSlides([next, current.current]);
      current.current = next;
      load((next + 1) % IMAGES.length);
      timer = window.setTimeout(tick, INTERVAL);
    };

    timer = window.setTimeout(tick, INTERVAL);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden="true" className="bg-ink absolute inset-0" data-anim="gallery">
      {[...slides].reverse().map((index) => (
        <div
          className="hero-slide absolute inset-0 bg-cover bg-[50%]"
          data-zoom={index % 2 === 0 ? "in" : "out"}
          key={index}
          style={{ backgroundImage: `url(${IMAGES[index]})` }}
        />
      ))}
    </div>
  );
}
