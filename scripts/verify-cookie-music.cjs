// Bounded deterministic scheduling/lifecycle checks; timbre needs real playback.
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");
const ts = require("typescript");
const file = require("node:path").join(__dirname, "../lib/cookie-energy-music.ts");
const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;
const timers = new Map(), contexts = [];
let timerId = 0;
class Param {
  value = 0;
  setValueAtTime(value, at) { assert(Number.isFinite(value) && Number.isFinite(at) && at >= 0); this.value = value; }
  linearRampToValueAtTime(v, at) { this.setValueAtTime(v, at); }
  exponentialRampToValueAtTime(v, at) { assert(v > 0); this.setValueAtTime(v, at); }
  setTargetAtTime(v, at, constant) { assert(constant > 0); this.setValueAtTime(v, at); }
  cancelScheduledValues() {}
}
class Node {
  constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; ctx.nodes.add(this);
    for (const name of ["gain", "frequency", "Q", "pan", "detune", "delayTime", "threshold", "knee", "ratio", "attack", "release"]) this[name] = new Param(); }
  connect(other) { return other; }
  disconnect() { this.ctx.nodes.delete(this); }
  start(at) { assert(at >= this.ctx.currentTime - 0.000001); this.ctx.starts++;
    if (this.kind === "osc") this.ctx.oscillators++; else this.ctx.noises++;
    this.ctx.active.add(this); this.ctx.peak = Math.max(this.ctx.peak, this.ctx.active.size); }
  stop(at = this.ctx.currentTime) { this.end = at; }
}
class Context {
  state = "suspended"; currentTime = 0; sampleRate = 24000; destination = {}; onstatechange = null;
  active = new Set(); nodes = new Set(); starts = 0; oscillators = 0; noises = 0; peak = 0; pendingResume = null;
  constructor() { contexts.push(this); }
  createGain() { return new Node(this, "gain"); } createOscillator() { return new Node(this, "osc"); }
  createBiquadFilter() { return new Node(this, "filter"); } createStereoPanner() { return new Node(this, "pan"); }
  createDynamicsCompressor() { return new Node(this, "compressor"); } createDelay() { return new Node(this, "delay"); }
  createBufferSource() { return new Node(this, "noise"); }
  createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  resume() { if (this.defer) return new Promise(resolve => { this.pendingResume = () => {
    if (this.state !== "closed") { this.state = "running"; this.onstatechange?.(); } resolve();
  }; }); this.state = "running"; this.onstatechange?.(); return Promise.resolve(); }
  suspend() { this.state = "suspended"; this.onstatechange?.(); return Promise.resolve(); }
  close() { this.state = "closed"; this.onstatechange?.(); return Promise.resolve(); }
  advance(dt) {
    if (this.state === "running") this.currentTime += dt;
    for (const source of this.active) if (source.end <= this.currentTime) { this.active.delete(source); source.onended?.(); }
    const scheduled = [...timers.values()]; timers.clear(); scheduled.forEach(fn => fn());
  }
}
const sandbox = { exports: {}, window: { AudioContext: Context }, console,
  setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); } };
vm.runInNewContext(code, sandbox, { filename: file });
const { createEnergyMusic, ENERGY_MUSIC_TRACKS } = sandbox.exports;
const advance = (ctx, seconds) => { for (let i = 0; i < Math.ceil(seconds / 0.04); i++) ctx.advance(0.04); };
(async () => {
  assert.equal(contexts.length, 0, "SSR/import must not create audio");
  await assert.rejects(createEnergyMusic(.3, undefined, "missing"), /morceau/);
  assert.equal(contexts.length, 0);
  const metrics = [];
  for (const track of ENERGY_MUSIC_TRACKS) {
    const names = [];
    const player = await createEnergyMusic(.3, name => names.push(name), track.id);
    const ctx = contexts.at(-1);
    advance(ctx, 3); assert(ctx.oscillators > 40 && ctx.noises > 10, "energetic layers start immediately");
    const firstThreeSeconds = { oscillators: ctx.oscillators, percussion: ctx.noises };
    advance(ctx, 64 * 4 * 60 / track.bpm + 1);
    assert.deepEqual(names, [track.name], "fixed track must not rotate");
    assert.equal(timers.size, 1); assert(ctx.peak < 70, "bounded simultaneous source count");
    player.pause(); const time = ctx.currentTime, starts = ctx.starts;
    advance(ctx, 120); assert.equal(ctx.currentTime, time); assert.equal(ctx.starts, starts); assert.equal(timers.size, 0);
    await player.resume(); assert.equal(timers.size, 1);
    const beforeJump = ctx.starts; ctx.advance(120);
    assert(ctx.starts - beforeJump < 40, "no catch-up burst");
    player.setVolume(Number.NaN); player.setVolume(2); player.setVolume(.3);
    player.pause(); ctx.defer = true; const pending = player.resume(); player.stop(); ctx.pendingResume(); await pending;
    player.stop(); await player.resume();
    assert.equal(ctx.state, "closed"); assert.equal(timers.size, 0); assert.equal(ctx.nodes.size, 0);
    metrics.push({ id: track.id, firstThreeSeconds, peakLiveSources: ctx.peak });
  }
  const announcements = [];
  const radio = await createEnergyMusic(.3, name => announcements.push({ name, time: contexts.at(-1).currentTime }));
  const ctx = contexts.at(-1);
  advance(ctx, 402);
  assert.deepEqual(announcements.map(x => x.name), [...ENERGY_MUSIC_TRACKS.map(t => t.name), ENERGY_MUSIC_TRACKS[0].name]);
  let boundary = .055;
  for (let i = 0; i < announcements.length; i++) {
    assert(announcements[i].time >= boundary - .00001 && announcements[i].time < boundary + .05, "callback tracks audible phrase boundary");
    boundary += 64 * 4 * 60 / ENERGY_MUSIC_TRACKS[i % 4].bpm;
  }
  radio.stop(); assert.equal(timers.size, 0); assert.equal(ctx.nodes.size, 0);
  const throwing = await createEnergyMusic(.3, () => { throw new Error("UI callback failure"); });
  advance(contexts.at(-1), .2); assert.equal(timers.size, 1); throwing.stop();
  console.log(JSON.stringify({ ok: true, metrics, automaticTrackSequence: announcements, allNodesAndTimersReleased: true }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
