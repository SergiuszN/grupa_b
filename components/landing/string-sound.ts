"use client";

// Enabled by default, but audio/network work starts only on the first gesture.
// The menu can still disable it before anything has been downloaded.
import { useSyncExternalStore } from "react";
import type { ViolinSampler } from "@/components/landing/violin-sampler";

type Status = "off" | "armed" | "loading" | "on";
type State = { status: Status; available: boolean };

const SERVER_STATE: State = { status: "off", available: false };
const PREFERENCE_KEY = "string-sound";
const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown"];

let state: State = SERVER_STATE;
let sampler: ViolinSampler | null = null;
let pendingContext: AudioContext | null = null;
let generation = 0;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  if (
    Object.entries(patch).every(
      ([key, value]) => state[key as keyof State] === value,
    )
  )
    return;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStringSound() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export function getSampler() {
  return sampler;
}

function savePreference(on: boolean) {
  try {
    localStorage.setItem(PREFERENCE_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice just won't survive a reload.
  }
}

function wantsSound() {
  try {
    return localStorage.getItem(PREFERENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

function addUnlockListeners() {
  for (const type of UNLOCK_EVENTS)
    window.addEventListener(type, unlock, { capture: true, passive: true });
}

function removeUnlockListeners() {
  for (const type of UNLOCK_EVENTS)
    window.removeEventListener(type, unlock, true);
}

function unlock(event?: Event) {
  if (!state.available || document.hidden) return;
  if (state.status === "armed") {
    // Opening the menu or following a CTA is not an attempt to play the photo.
    // In particular, allow switching sound off without downloading its samples.
    if (
      event?.target instanceof Element &&
      event.target.closest(
        "a, button, input, select, textarea, [role='dialog']",
      )
    )
      return;
    void start();
  } else if (sampler) {
    void sampler
      .resume()
      .then(() => {
        if (sampler?.unlocked) removeUnlockListeners();
      })
      .catch(() => {});
  }
}

function syncVisibility() {
  if (document.hidden) {
    void sampler?.suspend().catch(() => {});
    void pendingContext?.suspend().catch(() => {});
  } else if (sampler) {
    // Some browsers require another gesture after an interruption.
    addUnlockListeners();
    unlock();
  }
}

async function start() {
  if (!state.available || sampler || state.status === "loading") return;
  const ticket = ++generation;
  set({ status: "loading" });

  try {
    // Create/resume synchronously in the gesture, BEFORE the dynamic import;
    // otherwise Safari may reject the unlock after the asynchronous boundary.
    const session = (navigator as { audioSession?: { type: string } })
      .audioSession;
    if (session) session.type = "playback";
    const context = new AudioContext();
    pendingContext = context;
    void context.resume().catch(() => {});

    const { ViolinSampler } =
      await import("@/components/landing/violin-sampler");
    if (ticket !== generation) return;
    const next = new ViolinSampler(context);
    sampler = next;
    pendingContext = null;
    syncVisibility();
    await next.load();
    if (ticket === generation) set({ status: "on" });
  } catch {
    if (ticket === generation) stop();
  }
}

function stop() {
  generation++;
  removeUnlockListeners();
  void sampler?.close().catch(() => {});
  void pendingContext?.close().catch(() => {});
  sampler = null;
  pendingContext = null;
  set({ status: "off" });
}

/** Called from the menu switch, so turning on happens inside a user gesture. */
export async function toggleStringSound() {
  if (state.status !== "off") {
    savePreference(false);
    stop();
    return;
  }
  savePreference(true);
  await start();
}

/** The hero marks the violin as playable while it is mounted. */
export function setStringSoundAvailable(available: boolean) {
  if (available) {
    set({ available });
    document.addEventListener("visibilitychange", syncVisibility);
    if (state.status === "off" && wantsSound()) {
      set({ status: "armed" });
      addUnlockListeners();
    }
    return;
  }
  document.removeEventListener("visibilitychange", syncVisibility);
  stop();
  set({ available });
}
