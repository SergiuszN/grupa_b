import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, test } from "node:test";
import { transformAsync } from "@babel/core";

// Use the project's existing TS transform; no browser/test-runner dependency.
const source = await readFile(
  new URL("../components/landing/violin-sampler.ts", import.meta.url),
  "utf8",
);
const { code } = await transformAsync(source, {
  filename: "violin-sampler.ts",
  configFile: false,
  babelrc: false,
  presets: ["@babel/preset-typescript"],
});
const { ViolinSampler } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

class AudioNodeStub {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.gain = {
      value: options.gain,
      setTargetAtTime() {},
      cancelScheduledValues() {},
    };
  }
  connect(node) {
    return node;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class SourceStub extends AudioNodeStub {
  constructor(ctx) {
    super(ctx);
    ctx.sources.push(this);
  }
  start() {
    this.started = true;
  }
  stop(time = this.ctx.currentTime) {
    this.stopTime = time;
    if (time <= this.ctx.currentTime) this.finish();
  }
  finish() {
    this.onended?.();
  }
}

class ContextStub {
  currentTime = 0;
  sampleRate = 100;
  state = "running";
  destination = {};
  sources = [];
  decoded = 0;
  createBuffer(channels, length) {
    return { getChannelData: () => new Float32Array(length) };
  }
  async decodeAudioData() {
    this.decoded++;
    return {};
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}

const keys = [
  "GainNode",
  "DynamicsCompressorNode",
  "ConvolverNode",
  "AudioBufferSourceNode",
  "fetch",
];
let original;
beforeEach(() => {
  original = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, {
    GainNode: AudioNodeStub,
    DynamicsCompressorNode: AudioNodeStub,
    ConvolverNode: AudioNodeStub,
    AudioBufferSourceNode: SourceStub,
    fetch: async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    }),
  });
});
afterEach(() => {
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("all original samples load with at most four concurrent requests", async () => {
  const urls = [];
  let active = 0;
  let peak = 0;
  globalThis.fetch = async (url) => {
    urls.push(url);
    peak = Math.max(peak, ++active);
    await wait(2);
    active--;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
  };
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  await sampler.load();
  assert.equal(new Set(urls).size, 23);
  assert.equal(ctx.decoded, 23);
  assert.ok(peak <= 4);
  await sampler.close();
});

test("leaving during loading aborts in-flight fetches and closes the context", async () => {
  let requested = 0;
  let aborted = 0;
  globalThis.fetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      requested++;
      signal.addEventListener(
        "abort",
        () => {
          aborted++;
          reject(new globalThis.DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  const loading = sampler.load();
  const rejected = assert.rejects(loading, { name: "AbortError" });
  await sampler.close();
  await rejected;
  assert.equal(requested, 4);
  assert.equal(aborted, 4);
  assert.equal(ctx.decoded, 0);
  assert.equal(ctx.state, "closed");
});

test("HTTP errors are rejected rather than passed to the audio decoder", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  await assert.rejects(sampler.load(), /404/);
  assert.equal(ctx.decoded, 0);
  await sampler.close();
});

test("rapid plucks are bounded and finished sources are disconnected", async () => {
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  await sampler.load();
  for (let i = 0; i < 40; i++) sampler.pluck(60, 0.7);
  assert.equal(ctx.sources.length, 40);
  assert.equal(
    ctx.sources.filter((node) => node.stopTime === undefined).length,
    12,
  );
  ctx.sources.forEach((node) => node.finish());
  assert.ok(ctx.sources.every((node) => node.disconnected));
  await sampler.close();
});

test("suspending also stops the short fade-outs of stolen voices", async () => {
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  await sampler.load();
  for (let i = 0; i < 40; i++) sampler.pluck(60, 0.7);
  await sampler.suspend();
  assert.ok(ctx.sources.every((node) => node.stopTime === ctx.currentTime));
  assert.ok(ctx.sources.every((node) => node.disconnected));
  await sampler.close();
});

test("hidden tabs stop voices; returning does not resurrect a held bow", async () => {
  const ctx = new ContextStub();
  const sampler = new ViolinSampler(ctx);
  await sampler.load();
  sampler.bow(64, 0.5);
  sampler.pluck(60, 0.7);
  assert.equal(ctx.sources[0].loop, true);
  await sampler.suspend();
  assert.equal(ctx.state, "suspended");
  assert.ok(ctx.sources.every((node) => node.disconnected));
  sampler.pluck(60, 0.7);
  assert.equal(ctx.sources.length, 2);
  await sampler.resume();
  sampler.bow(64, 0.5);
  assert.equal(ctx.sources.length, 3);
  sampler.release();
  assert.ok(ctx.sources[2].stopTime > ctx.currentTime);
  await sampler.close();
});
