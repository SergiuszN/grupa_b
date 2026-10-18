"use client";

import { useEffect, useRef, useState } from "react";

function placeholder(src: string) {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=32&q=30`;
}

/**
 * Photograph with a tiny blurred stand-in that fades into the real image.
 * The placeholder goes through the Next image optimiser, so remote artwork
 * costs a few hundred bytes instead of the full file.
 */
export function BlurImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (image.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <div
      className={`relative overflow-clip bg-[#E7E2D8] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny placeholder, already optimised */}
      <img
        aria-hidden="true"
        alt=""
        className={`absolute inset-0 size-full scale-110 object-cover blur-xl transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        src={placeholder(src)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- fade-in needs the raw load event */}
      <img
        alt={alt}
        className={`relative size-full object-cover transition-[filter,opacity] duration-500 ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        }`}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        ref={image}
        src={src}
      />
    </div>
  );
}
