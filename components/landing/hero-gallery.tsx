"use client";

import { useEffect, useState } from "react";

const IMAGES = [
  "/photos/exterior-1.jpg",
  "/photos/exterior-2.jpg",
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

const INTERVAL = 5000;

export function HeroGallery() {
  const [slides, setSlides] = useState([0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setSlides(([current]) => [(current + 1) % IMAGES.length, current]);
    }, INTERVAL);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className="bg-ink absolute inset-0">
      {slides.map((index, layer) => (
        <div
          className={`absolute inset-0 bg-cover bg-[50%] ${
            layer === 0 ? "hero-slide" : ""
          }`}
          key={index}
          style={{ backgroundImage: `url(${IMAGES[index]})` }}
        />
      ))}
    </div>
  );
}
