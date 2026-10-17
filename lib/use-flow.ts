"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { EVENTS, localizeEvent } from "./events";
import { PARTY_KEY, SWIPE_KEY } from "./taste";

const EVENT_KEY = "filharmonia:event";

export function useFlow() {
  const locale = useLocale();
  const [event, setEvent] = useState(EVENTS[0]);
  const [people, setPeople] = useState(2);

  useEffect(() => {
    const decisions = JSON.parse(
      localStorage.getItem(SWIPE_KEY) ?? "[]",
    ) as { id: string; choice: string }[];
    const liked = [...decisions].reverse().find((d) => d.choice === "tak");
    let resolved = EVENTS.find((item) => item.id === liked?.id);

    if (!resolved) {
      const savedId = localStorage.getItem(EVENT_KEY);
      resolved = EVENTS.find((item) => item.id === savedId);

      if (!resolved) {
        resolved = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        localStorage.setItem(EVENT_KEY, resolved.id);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the flow's saved choices
    setEvent(resolved);
    setPeople(Number(localStorage.getItem(PARTY_KEY)) || 2);
  }, []);

  return { event: localizeEvent(event, locale), people };
}
