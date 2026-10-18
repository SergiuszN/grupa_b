// Solo violin sampler on Web Audio. Samples: VSCO 2 Community Edition (CC0),
// trimmed to mono mp3 in /public/audio/violin. Sound starts once resume() runs in a user gesture.

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

// D minor pentatonic from G3 to E6: any sweep across the photo stays consonant.
const PENTATONIC = [0, 3, 5, 7, 10];
export const NOTES = Array.from(
  { length: 88 - 55 + 1 },
  (_, i) => 55 + i,
).filter((midi) => PENTATONIC.includes((midi - 50 + 120) % 12));

// Region of the 5 s arco files that is held steady and looped while bowing.
const LOOP_START = 1.2;
const LOOP_END = 4.4;
// Legato note changes enter past the attack, so a bow sweep sounds like one stroke.
const LEGATO_OFFSET = 0.28;

type Sample = { midi: number; buffer: AudioBuffer };
type Voice = { source: AudioBufferSourceNode; gain: GainNode; midi: number };

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
  private ctx = new AudioContext();
  private out: GainNode;
  private arco: Sample[] = [];
  private pizz: Sample[] = [];
  private voice: Voice | null = null;

  constructor() {
    const { ctx } = this;
    // iOS mutes Web Audio on silent mode unless the page asks for a playback session.
    const session = (navigator as { audioSession?: { type: string } })
      .audioSession;
    if (session) session.type = "playback";
    const master = new GainNode(ctx, { gain: 0.9 });
    master.connect(new DynamicsCompressorNode(ctx)).connect(ctx.destination);

    const reverb = new ConvolverNode(ctx, { buffer: hallImpulse(ctx) });
    reverb.connect(new GainNode(ctx, { gain: 0.25 })).connect(master);

    this.out = new GainNode(ctx);
    this.out.connect(master);
    this.out.connect(reverb);
  }

  /** Audio stays suspended until this runs inside a user gesture. */
  resume() {
    return this.ctx.resume();
  }

  get unlocked() {
    return this.ctx.state === "running";
  }

  async load() {
    const fetchSet = (dir: string, map: Record<string, number>) =>
      Promise.all(
        Object.entries(map).map(async ([name, midi]) => {
          const response = await fetch(`/audio/violin/${dir}/${name}.mp3`);
          const buffer = await this.ctx.decodeAudioData(
            await response.arrayBuffer(),
          );
          return { midi, buffer };
        }),
      );
    [this.arco, this.pizz] = await Promise.all([
      fetchSet("arco", ARCO),
      fetchSet("pizz", PIZZ),
    ]);
  }

  private source(samples: Sample[], midi: number) {
    const sample = nearest(samples, midi);
    return new AudioBufferSourceNode(this.ctx, {
      buffer: sample.buffer,
      playbackRate: 2 ** ((midi - sample.midi) / 12),
    });
  }

  /** Plucked note, velocity 0..1. */
  pluck(midi: number, velocity: number) {
    if (!this.pizz.length) return;
    const now = this.ctx.currentTime;
    const source = this.source(this.pizz, midi);
    const gain = new GainNode(this.ctx, { gain: 0.25 + 0.75 * velocity });
    source.connect(gain).connect(this.out);
    source.start(now);
  }

  /** Bowed note that keeps sounding until release(); pressure 0..1 sets loudness. */
  bow(midi: number, pressure: number) {
    if (!this.arco.length) return;
    const now = this.ctx.currentTime;
    const level = 0.2 + 0.8 * pressure;

    if (this.voice?.midi === midi) {
      this.voice.gain.gain.setTargetAtTime(level, now, 0.08);
      return;
    }

    const legato = this.voice !== null;
    this.fadeOut(legato ? 0.06 : 0.25);

    const source = this.source(this.arco, midi);
    source.loop = true;
    source.loopStart = LOOP_START;
    source.loopEnd = LOOP_END;
    const gain = new GainNode(this.ctx, { gain: 0 });
    gain.gain.setTargetAtTime(level, now, legato ? 0.04 : 0.09);
    source.connect(gain).connect(this.out);
    source.start(now, legato ? LEGATO_OFFSET : 0);
    this.voice = { source, gain, midi };
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

  close() {
    return this.ctx.close();
  }
}
