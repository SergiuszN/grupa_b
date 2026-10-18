// Solo violin sampler on Web Audio. Samples: VSCO 2 Community Edition (CC0),
// trimmed to mono mp3 in /public/audio/violin. Created only after a user gesture.

const ARCO = {
  G3: 55,
  A3: 57,
  C4: 60,
  E4: 64,
  G4: 67,
  A4: 69,
  C5: 72,
  E5: 76,
  G5: 79,
  A5: 81,
  C6: 84,
  E6: 88,
};
const PIZZ = {
  G3: 55,
  A3: 57,
  C4: 60,
  E4: 64,
  G4: 67,
  A4: 69,
  C5: 72,
  E5: 76,
  G5: 79,
  A5: 81,
  E6: 88,
};

const LOOP_START = 1.2;
const LOOP_END = 4.4;
const LEGATO_OFFSET = 0.28;
const MAX_VOICES = 12;
const LOAD_CONCURRENCY = 4;

type Sample = { midi: number; buffer: AudioBuffer };
type Voice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  midi: number;
  retiring?: boolean;
};

function nearest(samples: Sample[], midi: number) {
  return samples.reduce((best, s) =>
    Math.abs(s.midi - midi) < Math.abs(best.midi - midi) ? s : best,
  );
}

function hallImpulse(ctx: AudioContext, seconds = 2.6) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 4;
  }
  return buffer;
}

export class ViolinSampler {
  private out: GainNode;
  private arco: Sample[] = [];
  private pizz: Sample[] = [];
  private voice: Voice | null = null;
  private voices = new Set<Voice>();
  private abort = new AbortController();

  constructor(private ctx: AudioContext) {
    const master = new GainNode(ctx, { gain: 0.9 });
    master.connect(new DynamicsCompressorNode(ctx)).connect(ctx.destination);

    const reverb = new ConvolverNode(ctx, { buffer: hallImpulse(ctx) });
    reverb.connect(new GainNode(ctx, { gain: 0.25 })).connect(master);

    this.out = new GainNode(ctx);
    this.out.connect(master);
    this.out.connect(reverb);
  }

  resume() {
    return this.ctx.resume();
  }

  get unlocked() {
    return this.ctx.state === "running";
  }

  async load() {
    const entries = [
      ...Object.entries(ARCO).map(([name, midi]) => ({
        dir: "arco",
        name,
        midi,
      })),
      ...Object.entries(PIZZ).map(([name, midi]) => ({
        dir: "pizz",
        name,
        midi,
      })),
    ];
    const samples: Sample[] = new Array(entries.length);
    const { signal } = this.abort;
    let cursor = 0;

    // Keep network/decode concurrency bounded instead of decoding 23 files at once.
    await Promise.all(
      Array.from({ length: LOAD_CONCURRENCY }, async () => {
        while (cursor < entries.length) {
          signal.throwIfAborted();
          const index = cursor++;
          const { dir, name, midi } = entries[index];
          const response = await fetch(`/audio/violin/${dir}/${name}.mp3`, {
            signal,
          });
          if (!response.ok)
            throw new Error(`Violin sample: ${response.status}`);
          const data = await response.arrayBuffer();
          signal.throwIfAborted();
          const buffer = await this.ctx.decodeAudioData(data);
          signal.throwIfAborted();
          samples[index] = { midi, buffer };
        }
      }),
    );

    this.arco = samples.slice(0, Object.keys(ARCO).length);
    this.pizz = samples.slice(Object.keys(ARCO).length);
  }

  private disconnect(voice: Voice) {
    voice.source.onended = null;
    voice.source.disconnect();
    voice.gain.disconnect();
    this.voices.delete(voice);
    if (this.voice === voice) this.voice = null;
  }

  private createVoice(samples: Sample[], midi: number, level: number) {
    const playing = [...this.voices].filter((voice) => !voice.retiring);
    if (playing.length >= MAX_VOICES) {
      const oldest = playing.find((voice) => voice !== this.voice);
      if (oldest) {
        oldest.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.005);
        oldest.source.stop(this.ctx.currentTime + 0.03);
        // Keep fading voices tracked until ended, so suspend/close cleans them too.
        oldest.retiring = true;
      }
    }

    const sample = nearest(samples, midi);
    const source = new AudioBufferSourceNode(this.ctx, {
      buffer: sample.buffer,
      playbackRate: 2 ** ((midi - sample.midi) / 12),
    });
    const gain = new GainNode(this.ctx, { gain: level });
    const voice = { source, gain, midi };
    source.connect(gain).connect(this.out);
    source.onended = () => this.disconnect(voice);
    this.voices.add(voice);
    return voice;
  }

  /** Plucked note, velocity 0..1. */
  pluck(midi: number, velocity: number) {
    if (!this.pizz.length || !this.unlocked) return;
    const { source } = this.createVoice(
      this.pizz,
      midi,
      0.25 + 0.75 * velocity,
    );
    source.start(this.ctx.currentTime);
  }

  /** Bowed note that keeps sounding until release(). */
  bow(midi: number, pressure: number) {
    if (!this.arco.length || !this.unlocked) return;
    const now = this.ctx.currentTime;
    const level = 0.2 + 0.8 * pressure;

    if (this.voice?.midi === midi) {
      this.voice.gain.gain.setTargetAtTime(level, now, 0.08);
      return;
    }

    const legato = this.voice !== null;
    this.fadeOut(legato ? 0.06 : 0.25);
    const voice = this.createVoice(this.arco, midi, 0);
    voice.source.loop = true;
    voice.source.loopStart = LOOP_START;
    voice.source.loopEnd = LOOP_END;
    voice.gain.gain.setTargetAtTime(level, now, legato ? 0.04 : 0.09);
    voice.source.start(now, legato ? LEGATO_OFFSET : 0);
    this.voice = voice;
  }

  release() {
    this.fadeOut(0.25);
  }

  private fadeOut(timeConstant: number) {
    if (!this.voice) return;
    const { source, gain } = this.voice;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, timeConstant);
    source.stop(now + timeConstant * 6);
    this.voice = null;
  }

  suspend() {
    // No hanging bow or pluck should resume when the visitor returns to the tab.
    for (const voice of this.voices) {
      voice.source.stop();
      this.disconnect(voice);
    }
    return this.ctx.suspend();
  }

  close() {
    this.abort.abort();
    this.arco = [];
    this.pizz = [];
    this.voices.forEach((voice) => this.disconnect(voice));
    return this.ctx.close();
  }
}
