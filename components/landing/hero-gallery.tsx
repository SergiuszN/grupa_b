"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { observeHeroActivity } from "@/components/landing/hero-activity";

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
const IMAGE_PROPS = {
  alt: "",
  fill: true,
  sizes: "100vw",
  quality: 75,
} as const;

export function HeroGallery() {
  const [slides, setSlides] = useState([0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    let active = false;
    let initialReady = false;
    let loading = false;
    let timer = 0;
    let candidate = (current.current + 1) % IMAGES.length;
    let prepared: number | null = null;

    const schedule = () => {
      if (!disposed && active && initialReady && !loading && !timer)
        timer = window.setTimeout(advance, INTERVAL);
    };

    const advance = async () => {
      timer = 0;
      // Decode exactly one candidate. A slow/broken image must never trigger a
      // burst of downloads for the rest of the gallery; the old slide stays up.
      if (prepared === null) {
        loading = true;
        const index =
          candidate === current.current
            ? (candidate + 1) % IMAGES.length
            : candidate;
        candidate = (index + 1) % IMAGES.length;
        const { props } = getImageProps({ ...IMAGE_PROPS, src: IMAGES[index] });
        const image = new window.Image();
        image.decoding = "async";
        image.fetchPriority = "low";
        image.sizes = props.sizes!;
        image.srcset = props.srcSet!;
        image.src = props.src;
        try {
          await image.decode();
          prepared = index;
        } catch {
          // Try the next photo on the next interval, without a tight retry loop.
        }
        loading = false;
      }

      if (disposed) return;
      if (active && prepared !== null) {
        const next = prepared;
        prepared = null;
        setSlides([current.current, next]);
        current.current = next;
      }
      schedule();
    };

    const stop = observeHeroActivity(root, (value) => {
      active = value;
      if (!active) {
        window.clearTimeout(timer);
        timer = 0;
      } else {
        schedule();
      }
    });

    // Do not compete with the first (LCP) image, even on a slow connection.
    root
      .querySelector("img")
      ?.decode()
      .catch(() => {})
      .then(() => {
        if (disposed) return;
        initialReady = true;
        schedule();
      });

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      stop();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="bg-ink absolute inset-0"
      data-anim="gallery"
      ref={rootRef}
    >
      {slides.map((index) => (
        <div
          className="hero-slide absolute inset-0"
          data-zoom={index % 2 === 0 ? "in" : "out"}
          key={index}
          onAnimationEnd={(event) => {
            if (event.animationName === "hero-in")
              setSlides((visible) =>
                visible.length > 1 ? visible.slice(-1) : visible,
              );
          }}
        >
          <Image
            {...IMAGE_PROPS}
            className="object-cover object-center"
            fetchPriority={index === 0 ? "high" : "low"}
            loading="eager"
            src={IMAGES[index]}
          />
        </div>
      ))}
    </div>
  );
}
