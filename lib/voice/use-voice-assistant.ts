"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Player,
  type Recorder,
  startRecording,
  toBase64,
  toWav,
} from "./audio";

export type EventCard = {
  event_id: number;
  performance_id: number;
  title: string;
  subtitle: string | null;
  kind: string;
  image_url: string | null;
  starts_at: string;
  venue: string;
  ticket_status: string;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  ticket_url: string | null;
  source_url: string;
};

export type Source = { title: string; url: string };

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  events?: EventCard[];
  sources?: Source[];
  pending?: boolean;
};

export type Status = "idle" | "listening" | "processing" | "speaking";
export type Activity =
  | "transcribing"
  | "searching"
  | "reading"
  | "checking"
  | "showing"
  | "answering"
  | null;
export type ErrorCode =
  "mic" | "unsupported" | "nothing_heard" | "unavailable" | "failed";

const TOOL_ACTIVITY: Record<string, Activity> = {
  search_events: "searching",
  get_event_details: "reading",
  get_visitor_info: "checking",
  show_events: "showing",
};

let nextId = 1;

const FOLLOW_UP_DELAY_MS = 350;
const FOLLOW_UP_TIMEOUT_MS = 7000;

export function useVoiceAssistant(lang: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [activity, setActivity] = useState<Activity>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [level, setLevel] = useState(0);

  const messagesRef = useRef<ChatMessage[]>([]);
  const recorderRef = useRef<Recorder | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<Player | null>(null);
  const streamingRef = useRef(false);
  // Hands-free conversation: after a spoken answer, listen for the follow-up.
  const handsFreeRef = useRef(false);
  const followUpRef = useRef<() => void>(() => {});

  const update = useCallback((fn: (m: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = fn(messagesRef.current);
    setMessages(messagesRef.current);
  }, []);

  const player = () => {
    if (!playerRef.current) {
      playerRef.current = new Player();
      playerRef.current.onIdle = () => {
        if (streamingRef.current) return;
        setStatus("idle");
        followUpRef.current();
      };
    }
    return playerRef.current;
  };

  useEffect(
    () => () => {
      abortRef.current?.abort();
      recorderRef.current?.cancel();
      playerRef.current?.stop();
    },
    [],
  );

  const send = useCallback(
    async (input: { audio?: string; text?: string }) => {
      const history = messagesRef.current
        .filter((m) => !m.pending && m.text)
        .map((m) => ({ role: m.role, content: m.text }));
      const userId = nextId++;
      const botId = nextId++;
      update((m) => [
        ...m,
        {
          id: userId,
          role: "user",
          text: input.text ?? "",
          pending: !input.text,
        },
        { id: botId, role: "assistant", text: "", pending: true },
      ]);
      const patch = (id: number, fn: (m: ChatMessage) => ChatMessage) =>
        update((all) => all.map((m) => (m.id === id ? fn(m) : m)));

      const controller = new AbortController();
      abortRef.current = controller;
      streamingRef.current = true;
      setStatus("processing");
      setActivity(input.audio ? "transcribing" : "answering");
      setError(null);

      let failed: ErrorCode | null = null;
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lang,
            history,
            audio_format: "wav",
            ...input,
          }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          failed =
            response.status === 503 || response.status === 502
              ? "unavailable"
              : "failed";
        } else {
          await readEvents(response.body, (event, data) => {
            switch (event) {
              case "transcript":
                patch(userId, (m) => ({
                  ...m,
                  text: data.text,
                  pending: false,
                }));
                setActivity("answering");
                break;
              case "tool":
                setActivity(TOOL_ACTIVITY[data.name] ?? "searching");
                break;
              case "events":
                patch(botId, (m) => ({ ...m, events: data.events }));
                break;
              case "sources":
                patch(botId, (m) => ({
                  ...m,
                  sources: [
                    ...(m.sources ?? []),
                    ...(data.sources as Source[]).filter(
                      (s) => !m.sources?.some((x) => x.url === s.url),
                    ),
                  ],
                }));
                break;
              case "delta":
                patch(botId, (m) => ({ ...m, text: m.text + data.text }));
                break;
              case "audio":
                player().enqueue(data.data);
                setStatus("speaking");
                break;
              case "done":
                patch(botId, (m) => ({
                  ...m,
                  text: data.text,
                  pending: false,
                }));
                break;
              case "error":
                failed =
                  data.code === "nothing_heard" ? "nothing_heard" : "failed";
                break;
            }
          });
        }
      } catch (e) {
        if (!controller.signal.aborted) failed = "failed";
        void e;
      }

      if (controller.signal.aborted) return;
      streamingRef.current = false;
      setActivity(null);
      if (failed) {
        handsFreeRef.current = false;
        setError(failed);
        // Drop the empty turn; keep a transcript the user may want to see.
        update((all) =>
          all.filter(
            (m) =>
              !(m.id === botId && !m.text) && !(m.id === userId && !m.text),
          ),
        );
      } else {
        patch(botId, (m) => ({ ...m, pending: false }));
      }
      await playerRef.current?.flushed();
      if (!playerRef.current?.playing) {
        setStatus("idle");
        followUpRef.current(); // no audio (e.g. speech failed): still keep listening
      }
    },
    [lang, update],
  );

  const stopListening = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    const blob = await recorder.stop();
    if (blob.size === 0) {
      setStatus("idle");
      return;
    }
    setStatus("processing");
    setActivity("transcribing");
    handsFreeRef.current = true;
    try {
      const wav = await toWav(blob);
      await send({ audio: toBase64(wav) });
    } catch {
      setStatus("idle");
      setActivity(null);
      setError("failed");
    }
  }, [send]);

  const interrupt = useCallback(() => {
    handsFreeRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    playerRef.current?.stop();
    recorderRef.current?.cancel();
    recorderRef.current = null;
    update((all) =>
      all
        .filter((m) => !(m.pending && !m.text))
        .map((m) => ({ ...m, pending: false })),
    );
    setActivity(null);
    setStatus("idle");
  }, [update]);

  // followUp: started automatically after an answer, not by a tap.
  const listen = useCallback(
    async (followUp = false) => {
      if (!followUp) player().unlock(); // inside the tap: allows audio playback later
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setError("unsupported");
        return;
      }
      setError(null);
      try {
        recorderRef.current = await startRecording({
          onLevel: setLevel,
          context: playerRef.current?.context,
          noSpeechTimeoutMs: followUp ? FOLLOW_UP_TIMEOUT_MS : undefined,
          onSilence: (heard) => {
            if (heard) {
              void stopListening();
            } else {
              recorderRef.current?.cancel();
              recorderRef.current = null;
              handsFreeRef.current = false;
              setStatus("idle");
              // Silence after an answer just ends the conversation.
              if (!followUp) setError("nothing_heard");
            }
          },
        });
        setStatus("listening");
      } catch {
        handsFreeRef.current = false;
        setError("mic");
        setStatus("idle");
      }
    },
    [stopListening],
  );

  useEffect(() => {
    followUpRef.current = () => {
      if (!handsFreeRef.current) return;
      // A short pause so the end of the answer does not leak into the microphone.
      window.setTimeout(() => {
        if (
          handsFreeRef.current &&
          !recorderRef.current &&
          !streamingRef.current
        ) {
          void listen(true);
        }
      }, FOLLOW_UP_DELAY_MS);
    };
  }, [listen]);

  // The single big button: talk, finish talking, or cut into the answer.
  const toggle = useCallback(() => {
    if (status === "idle") {
      void listen();
    } else if (status === "listening") {
      if (recorderRef.current?.heardSpeech()) {
        void stopListening();
      } else {
        // Nothing said yet: the tap ends the conversation.
        interrupt();
      }
    } else if (status === "speaking") {
      interrupt(); // stop talking and let the user speak
      void listen();
    } else {
      interrupt();
    }
  }, [status, listen, stopListening, interrupt]);

  const ask = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      interrupt();
      player().unlock();
      void send({ text: q });
    },
    [interrupt, send],
  );

  const reset = useCallback(() => {
    interrupt();
    update(() => []);
    setError(null);
  }, [interrupt, update]);

  return { status, activity, messages, error, level, toggle, ask, reset };
}

// readEvents parses a Server-Sent Events stream from fetch.
async function readEvents(
  body: ReadableStream<Uint8Array>,
  // The payload shape depends on the event name.
  onEvent: (event: string, data: any) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      if (data) {
        try {
          onEvent(event, JSON.parse(data));
        } catch {
          // ignore malformed event
        }
      }
    }
  }
}
