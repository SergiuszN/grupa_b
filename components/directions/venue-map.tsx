"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";

const VENUE: [number, number] = [53.42939, 14.55813];
const VENUE_QUERY = encodeURIComponent(
  "Filharmonia im. Mieczysława Karłowicza, Małopolska 48, 70-515 Szczecin",
);
const MAPS_HREF = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_QUERY}&travelmode=transit`;

function dot(color: string) {
  return {
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px rgba(17,17,17,.15)"></span>`,
    iconSize: [16, 16] as [number, number],
    iconAnchor: [8, 8] as [number, number],
  };
}

export function VenueMap() {
  const t = useTranslations("Directions");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      }).setView(VENUE, 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker(VENUE, { icon: L.divIcon(dot("#111111")) }).addTo(map);

      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div>
      <div
        aria-label={t("mapAria")}
        className="border-line z-0 h-[280px] overflow-hidden rounded-[22px] border"
        ref={containerRef}
        role="application"
      />

      <a
        className="bg-ink text-paper hover:bg-ink/90 focus-visible:outline-gold mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.875rem] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        href={MAPS_HREF}
        rel="noreferrer"
        target="_blank"
      >
        <Navigation aria-hidden="true" size={16} strokeWidth={1.8} />
        {t("mapOpen")}
      </a>
    </div>
  );
}
