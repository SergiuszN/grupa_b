"use client";

// Browser audio for the voice assistant: microphone recording with silence
// detection, conversion to 16 kHz mono WAV (the format the transcription model
// accepts) and gapless playback of the MP3 clips streamed back by the API.

const SAMPLE_RATE = 16000;

type RecorderOptions = {
  onLevel?: (level: number) => void;
  // Called when the speaker went quiet after talking (or never started).
  onSilence?: (heardSpeech: boolean) => void;
};

export type Recorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

const SPEECH_LEVEL = 0.04;
const SILENCE_AFTER_SPEECH_MS = 1400;
const NO_SPEECH_TIMEOUT_MS = 8000;
const MAX_RECORDING_MS = 30000;

export async function startRecording({
  onLevel,
  onSilence,
}: RecorderOptions = {}): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(250);

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);

  const started = performance.now();
  let lastSound = started;
  let heardSpeech = false;
  let finished = false;

  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const s of samples) sum += s * s;
    const rms = Math.sqrt(sum / samples.length);
    onLevel?.(Math.min(1, rms * 8));

    const now = performance.now();
    if (rms > SPEECH_LEVEL) {
      heardSpeech = true;
      lastSound = now;
    }
    const quiet = now - lastSound;
    if (
      (heardSpeech && quiet > SILENCE_AFTER_SPEECH_MS) ||
      (!heardSpeech && now - started > NO_SPEECH_TIMEOUT_MS) ||
      now - started > MAX_RECORDING_MS
    ) {
      window.clearInterval(timer);
      onSilence?.(heardSpeech);
    }
  }, 100);

  const cleanup = () => {
    finished = true;
    window.clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    onLevel?.(0);
  };

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        if (finished || recorder.state === "inactive") {
          resolve(new Blob(chunks, { type: recorder.mimeType }));
          return;
        }
        recorder.onstop = () => {
          cleanup();
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      }),
    cancel: () => {
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
    },
  };
}

// toWav decodes any recording the browser made (webm/opus, mp4/aac) and
// re-encodes it as 16-bit PCM WAV, mono, 16 kHz.
export async function toWav(blob: Blob): Promise<ArrayBuffer> {
  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    void ctx.close();
  }

  const length = Math.max(1, Math.ceil(decoded.duration * SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const pcm = (await offline.startRendering()).getChannelData(0);

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++)
      view.setUint8(offset + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Player schedules MP3 clips back to back on one AudioContext. It must be
// created (or resumed) inside a user gesture so that iOS Safari lets it play.
export class Player {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private decoding: Promise<void> = Promise.resolve();
  private generation = 0; // bumped by stop(), drops clips still being decoded
  onIdle?: () => void;

  unlock() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get playing() {
    return this.sources.size > 0;
  }

  enqueue(base64: string) {
    const ctx = this.ctx;
    if (!ctx) return;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const generation = this.generation;
    // Decode in arrival order, so clips never swap places.
    this.decoding = this.decoding.then(async () => {
      try {
        const buffer = await ctx.decodeAudioData(bytes.buffer);
        if (generation !== this.generation) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        const at = Math.max(ctx.currentTime + 0.05, this.nextStart);
        source.start(at);
        this.nextStart = at + buffer.duration;
        this.sources.add(source);
        source.onended = () => {
          this.sources.delete(source);
          if (this.sources.size === 0) this.onIdle?.();
        };
      } catch {
        // A broken clip is skipped; the text is still on screen.
      }
    });
  }

  // Resolves once every clip received so far has been scheduled.
  flushed() {
    return this.decoding;
  }

  stop() {
    this.generation++;
    for (const s of this.sources) {
      s.onended = null;
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    this.sources.clear();
    this.nextStart = 0;
    this.decoding = Promise.resolve();
  }
}
