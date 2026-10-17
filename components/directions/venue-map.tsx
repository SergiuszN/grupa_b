"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Navigation, LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";

const VENUE: [number, number] = [53.4287, 14.5529];

type Place = { display_name: string; lat: string; lon: string };

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
  const layersRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const venueIconRef = useRef<Leaflet.DivIcon | null>(null);
  const originIconRef = useRef<Leaflet.DivIcon | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

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

      const layers = L.layerGroup().addTo(map);
      venueIconRef.current = L.divIcon(dot("#111111"));
      originIconRef.current = L.divIcon(dot("#ad891c"));
      L.marker(VENUE, { icon: venueIconRef.current }).addTo(layers);

      mapRef.current = map;
      layersRef.current = layers;
      window.setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (query === selectedRef.current) return;

    const text = query.trim();

    if (text.length < 3) return;

    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=pl&q=${encodeURIComponent(text)}`,
        );
        const data = (await res.json()) as Place[];
        setPlaces(data);
      } catch {
        setPlaces([]);
      }
    }, 350);

    return () => window.clearTimeout(id);
  }, [query]);

  function drawOrigin(pos: [number, number]) {
    const map = mapRef.current;
    const layers = layersRef.current;
    const L = leafletRef.current;

    if (!map || !layers || !L || !venueIconRef.current || !originIconRef.current) {
      return;
    }

    setOrigin({ lat: pos[0], lon: pos[1] });
    layers.clearLayers();
    L.marker(VENUE, { icon: venueIconRef.current }).addTo(layers);
    L.marker(pos, { icon: originIconRef.current }).addTo(layers);
    L.polyline([pos, VENUE], {
      color: "#ad891c",
      weight: 2.5,
      dashArray: "6 8",
    }).addTo(layers);
    map.fitBounds(L.latLngBounds([pos, VENUE]), { padding: [36, 36] });
  }

  function choose(place: Place) {
    const pos: [number, number] = [Number(place.lat), Number(place.lon)];

    selectedRef.current = place.display_name;
    setQuery(place.display_name);
    setPlaces([]);
    drawOrigin(pos);
  }

  function locateMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const label = t("mapLabel");

      selectedRef.current = label;
      setQuery(label);
      setPlaces([]);
      drawOrigin([coords.latitude, coords.longitude]);
    });
  }

  const mapsHref = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${VENUE[0]},${VENUE[1]}&travelmode=transit`
    : `https://www.google.com/maps/dir/?api=1&destination=${VENUE[0]},${VENUE[1]}&travelmode=transit`;

  return (
    <div>
      <div className="relative">
        <label className="sr-only" htmlFor="origin-search">
          {t("mapLabel")}
        </label>

        <div className="flex items-center gap-2">
          <input
            autoComplete="off"
            className="border-line focus-visible:outline-gold h-11 w-full flex-1 rounded-full border bg-paper px-4 text-[14px]"
            id="origin-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("mapPlaceholder")}
            type="search"
            value={query}
          />
          <button
            aria-label={t("mapLocate")}
            className="border-line hover:bg-surface focus-visible:outline-gold flex size-11 shrink-0 items-center justify-center rounded-full border bg-paper transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={locateMe}
            type="button"
          >
            <LocateFixed aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        {query.trim().length >= 3 && places.length > 0 ? (
          <ul className="border-line bg-paper absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border shadow-lg">
            {places.map((place) => (
              <li key={`${place.lat},${place.lon}`}>
                <button
                  className="hover:bg-surface w-full px-4 py-2.5 text-left text-[13px] leading-[18px]"
                  onClick={() => choose(place)}
                  type="button"
                >
                  <span className="line-clamp-2">{place.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        aria-label={t("mapAria")}
        className="border-line z-0 mt-2.5 h-[280px] overflow-hidden rounded-[22px] border"
        ref={containerRef}
        role="application"
      />

      <a
        className="bg-ink text-paper hover:bg-ink/90 focus-visible:outline-gold mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        href={mapsHref}
        rel="noreferrer"
        target="_blank"
      >
        <Navigation aria-hidden="true" size={16} strokeWidth={1.8} />
        {t("mapOpen")}
      </a>
    </div>
  );
}
