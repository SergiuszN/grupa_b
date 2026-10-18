"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { eventSlug } from "@/lib/format";

type Hit = {
  events?: {
    id: number;
    title: string;
    subtitle: string | null;
    image_url: string | null;
  }[];
  artists?: { id: number; name: string; type: string }[];
  works?: { id: number; title: string; composer: { name: string } | null }[];
  series?: { id: number; name: string }[];
};

export function MenuSearch({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ q: string; data: Hit | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const value = query.trim();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&lang=${locale}`,
          { signal: controller.signal },
        );
        const json = (await response.json()) as { data?: Hit | null };
        setHits({ q: term, data: json.data ?? null });
      } catch {
        if (!controller.signal.aborted) setHits({ q: term, data: null });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [query, locale]);

  const current = hits?.q === value ? hits.data : null;
  const events = current?.events ?? [];
  const artists = current?.artists ?? [];
  const works = current?.works ?? [];
  const series = current?.series ?? [];
  const searching = value.length >= 2 && (!hits || hits.q !== value) && loading;
  const empty =
    value.length >= 2 && hits?.q === value && !loading &&
    events.length + artists.length + works.length + series.length === 0;

  return (
    <div className="mt-6">
      <label className="relative block">
        <span className="sr-only">{t("label")}</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 opacity-60"
          size={16}
          strokeWidth={1.8}
        />
        <input
          className="focus-visible:outline-ink h-12 w-full rounded-full border-[1.5px] border-ink/25 bg-transparent pr-11 pl-11 text-[15px] placeholder:text-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-search-cancel-button]:appearance-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label={t("clear")}
            className="focus-visible:outline-ink absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden="true" size={15} strokeWidth={1.8} />
          </button>
        ) : null}
      </label>

      {value.length >= 2 ? (
        <div aria-live="polite" className="mt-3">
          {searching ? (
            <p className="text-[13px] opacity-70">{t("searching")}</p>
          ) : null}

          {empty ? (
            <p className="text-[13px] opacity-70">{t("empty")}</p>
          ) : null}

          {events.length > 0 ? (
            <ul className="flex flex-col">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    className="focus-visible:outline-ink flex items-center gap-3 rounded-lg py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/calendar/${eventSlug(event.id, event.title)}`}
                    onClick={onNavigate}
                  >
                    <div
                      className="size-10 shrink-0 overflow-clip rounded-lg bg-ink/10 bg-cover bg-[50%]"
                      style={
                        event.image_url
                          ? { backgroundImage: `url(${event.image_url})` }
                          : undefined
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] leading-5 font-bold">
                        {event.title}
                      </span>
                      {event.subtitle ? (
                        <span className="block truncate text-[12px] leading-4 opacity-70">
                          {event.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {artists.length > 0 ? (
            <div className="mt-2">
              <p className="text-[10px] leading-3 font-medium tracking-[0.14em] uppercase opacity-60">
                {t("artists")}
              </p>
              <ul className="mt-1 flex flex-col">
                {artists.map((artist) => (
                  <li key={artist.id}>
                    <Link
                      className="focus-visible:outline-ink block rounded-md py-1 text-[14px] leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 hover:underline"
                      href={`/artists/${artist.id}`}
                      onClick={onNavigate}
                    >
                      {artist.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {works.length > 0 ? (
            <div className="mt-2">
              <p className="text-[10px] leading-3 font-medium tracking-[0.14em] uppercase opacity-60">
                {t("works")}
              </p>
              <ul className="mt-1 flex flex-col">
                {works.map((work) => (
                  <li className="py-1 text-[14px] leading-5" key={work.id}>
                    {work.title}
                    {work.composer?.name ? (
                      <span className="opacity-70"> — {work.composer.name}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {series.length > 0 ? (
            <div className="mt-2">
              <p className="text-[10px] leading-3 font-medium tracking-[0.14em] uppercase opacity-60">
                {t("series")}
              </p>
              <ul className="mt-1 flex flex-col">
                {series.map((item) => (
                  <li className="py-1 text-[14px] leading-5" key={item.id}>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
