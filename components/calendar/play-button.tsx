"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function PlayButton({
  src,
  label,
  pauseLabel,
}: {
  src: string;
  label: string;
  pauseLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.55;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  return (
    <>
      <button
        aria-label={playing ? pauseLabel : label}
        className="bg-gold focus-visible:outline-ink flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
        onClick={toggle}
        type="button"
      >
        {playing ? (
          <Pause aria-hidden="true" fill="currentColor" size={13} strokeWidth={0} />
        ) : (
          <Play
            aria-hidden="true"
            className="translate-x-px"
            fill="currentColor"
            size={13}
            strokeWidth={0}
          />
        )}
      </button>

      <audio
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        preload="auto"
        ref={audioRef}
        src={src}
      />
    </>
  );
}
