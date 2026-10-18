"use client";

// Shared on/off state for the violin on the home page, so the switch can live in the
// menu sheet while the pointer handling stays on the hero. On by default; turning it
// off in the menu is remembered per browser.

import { useSyncExternalStore } from "react";
import { ViolinSampler } from "@/components/landing/violin-sampler";

type Status = "off" | "loading" | "on";
type State = { status: Status; available: boolean };

const SERVER_STATE: State = { status: "off", available: false };
const PREFERENCE_KEY = "string-sound";
// Events that count as a user gesture, letting the browser start audio.
const UNLOCK_EVENTS = [
  "pointerdown",
  "pointerup",
  "touchstart",
  "touchend",
  "keydown",
  "click",
];

let state: State = SERVER_STATE;
let sampler: ViolinSampler | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
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

function unlock() {
  sampler?.resume();
  if (!sampler || sampler.unlocked) removeUnlockListeners();
}

function removeUnlockListeners() {
  for (const type of UNLOCK_EVENTS)
    window.removeEventListener(type, unlock, true);
}

async function start() {
  const next = new ViolinSampler();
  sampler = next;
  set({ status: "loading" });
  // Started without a gesture the audio is suspended; the first click or key unlocks it.
  next.resume();
  for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
  try {
    await next.load();
    if (sampler === next) set({ status: "on" });
  } catch {
    if (sampler === next) stop();
  }
}

function stop() {
  removeUnlockListeners();
  sampler?.close();
  sampler = null;
  set({ status: "off" });
}

/** Called from the menu switch, so turning on happens inside a user gesture. */
export async function toggleStringSound() {
  if (sampler) {
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
    if (!sampler && wantsSound()) start();
    return;
  }
  stop();
  set({ available });
}
