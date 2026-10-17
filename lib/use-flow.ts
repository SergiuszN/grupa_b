"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { EVENTS, localizeEvent } from "./events";
import { PARTY_KEY, SWIPE_KEY } from "./taste";

export function useFlow() {
  const locale = useLocale();
  const [event, setEvent] = useState(EVENTS[0]);
  const [people, setPeople] = useState(2);

  useEffect(() => {
    const decisions = JSON.parse(
      localStorage.getItem(SWIPE_KEY) ?? "[]",
    ) as { id: string; choice: string }[];
    const liked = [...decisions].reverse().find((d) => d.choice === "tak");
    const found = EVENTS.find((item) => item.id === liked?.id);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the flow's saved choices
    if (found) setEvent(found);
    setPeople(Number(localStorage.getItem(PARTY_KEY)) || 2);
  }, []);

  return { event: localizeEvent(event, locale), people };
}
