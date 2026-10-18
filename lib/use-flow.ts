"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { EVENTS, findEvent, hasSeats, localizeEvent } from "./events";
import { PARTY_KEY, SEATS_KEY, SWIPE_KEY, type SelectedSeat } from "./taste";

const EVENT_KEY = "filharmonia:event";

export function useFlow() {
  const locale = useLocale();
  const [event, setEvent] = useState(EVENTS[0]);
  const [people, setPeople] = useState(2);
  const [seats, setSeats] = useState<SelectedSeat[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const decisions = JSON.parse(
      localStorage.getItem(SWIPE_KEY) ?? "[]",
    ) as { id: string; choice: string }[];
    const liked = [...decisions].reverse().find((d) => d.choice === "tak");
    let resolved = findEvent(liked?.id);

    if (!resolved) {
      resolved = findEvent(localStorage.getItem(EVENT_KEY));

      if (!resolved) {
        resolved = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        localStorage.setItem(EVENT_KEY, resolved.id);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the flow's saved choices
    setEvent(resolved);
    setPeople(Number(localStorage.getItem(PARTY_KEY)) || 2);

    try {
      const storedSeats = JSON.parse(
        localStorage.getItem(SEATS_KEY) ?? "[]",
      ) as SelectedSeat[];
      setSeats(storedSeats);
    } catch {
      setSeats([]);
    }
    setReady(true);
  }, []);

  // At a concert the party is as big as the number of seats picked on the map.
  const party = hasSeats(event) && seats.length > 0 ? seats.length : people;

  return { event: localizeEvent(event, locale), people: party, seats, ready };
}
