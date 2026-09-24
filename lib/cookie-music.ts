/** Original, locally synthesized soundtrack: 16 bars at 118 BPM (~32.5 s).
 * Call createCookieMusic only from an explicit user interaction. No autoplay,
 * network requests, audio files or storage; the caller owns the opt-in UI.
 */
export interface CookieMusic {
  setVolume(volume: number): void;
  pause(): void;
  resume(): Promise<void>;
  stop(): void;
}

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const BPM = 118;
const STEP = 60 / BPM / 2;
const LOOKAHEAD = 0.12;
const ROOTS = [36, 45, 41, 43];
const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
// Two call-and-response themes; zero denotes a deliberate breath.
const THEMES = [
  [[76, 0, 79, 76, 74, 72, 0, 74], [72, 0, 76, 79, 76, 72, 71, 0],
    [69, 72, 0, 77, 76, 72, 69, 0], [71, 74, 79, 0, 77, 74, 71, 74]],
  [[79, 76, 0, 84, 83, 79, 76, 0], [81, 0, 79, 76, 72, 76, 0, 79],
    [77, 76, 72, 0, 69, 72, 77, 79], [79, 0, 77, 74, 71, 74, 0, 72]],
];
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export async function createCookieMusic(volume = 0.3): Promise<CookieMusic> {
  const Audio = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!Audio) throw new Error("Ce navigateur ne prend pas en charge la musique du jeu.");
  const context = new Audio({ latencyHint: "playback" });
  const master = context.createGain();
  master.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;
  master.connect(limiter).connect(context.destination);

  // A quiet stereo echo gives the lead room without muddying the beat.
  const echo = context.createDelay(1);
  echo.delayTime.value = STEP * 1.5;
  const feedback = context.createGain();
  feedback.gain.value = 0.16;
  const wet = context.createGain();
  wet.gain.value = 0.18;
  echo.connect(feedback).connect(echo);
  echo.connect(wet).connect(master);

  // Deterministic noise means the soundtrack is repeatable, even in tests.
  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.25), context.sampleRate);
  const samples = noise.getChannelData(0);
  let seed = 340118;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = seed / 0x80000000 - 1;
  }

  let level = clamp(volume);
  let stopped = false;
  let playing = false;
  let generation = 0;
  let step = 0;
  let nextTime = context.currentTime + 0.04;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const voices = new Map<AudioScheduledSourceNode, AudioNode[]>();

  function track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    voices.set(source, nodes);
    source.onended = () => {
      source.disconnect();
      nodes.forEach(node => node.disconnect());
      voices.delete(source);
    };
  }

  function tone(note: number, time: number, duration: number, amplitude: number,
    type: OscillatorType = "triangle", withEcho = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = hz(note);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(amplitude, time + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    envelope.gain.linearRampToValueAtTime(0, time + duration + 0.015);
    oscillator.connect(envelope).connect(master);
    if (withEcho) envelope.connect(echo);
    track(oscillator, [envelope]);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function kick(time: number) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.frequency.setValueAtTime(145, time);
    oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(0.34, time + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.19);
    oscillator.connect(envelope).connect(master);
    track(oscillator, [envelope]);
    oscillator.start(time);
    oscillator.stop(time + 0.2);
  }

  function percussion(time: number, snare: boolean, accent = false) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noise;
    filter.type = "highpass";
    filter.frequency.value = snare ? 1700 : 7600;
    const duration = snare ? 0.14 : accent ? 0.085 : 0.045;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(snare ? 0.14 : accent ? 0.07 : 0.045, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter).connect(envelope).connect(master);
    track(source, [filter, envelope]);
    source.start(time);
    source.stop(time + duration + 0.01);
    if (snare) tone(50, time, 0.075, 0.035, "triangle");
  }

  function schedule(index: number, time: number) {
    const bar = Math.floor(index / 8);
    const beat = index % 8;
    const chord = bar % 4;
    const section = Math.floor(bar / 4);
    // A lighter third phrase leaves space before the final lift.
    const breakdown = section === 2;
    if (beat % 2 === 0 && (!breakdown || beat === 0 || beat === 4)) kick(time);
    if (beat === 2 || beat === 6) percussion(time, true);
    if (!breakdown || beat % 2 === 1) percussion(time, false, beat % 2 === 1);
    if (beat === 0 || beat === 3 || beat === 4 || beat === 7) {
      tone(ROOTS[chord] + (beat === 7 ? 12 : 0), time,
        STEP * (beat === 0 ? 1.7 : 0.7), 0.105, "triangle");
    }
    if (beat % 2 === 1) {
      const arpeggio = CHORDS[chord][Math.floor(beat / 2) % 3] + 12;
      tone(arpeggio, time, STEP * 0.62, breakdown ? 0.018 : 0.026, "sine", true);
    }
    if (beat === 0) CHORDS[chord].forEach(note => tone(note, time, STEP * 6.8, 0.016, "sine"));
    const lead = THEMES[section % 2][chord][beat];
    if (lead && (!breakdown || beat < 4)) {
      tone(lead, time, STEP * 0.78, 0.056, "triangle", true);
      if (section === 3 && beat % 2 === 0) tone(lead - 12, time, STEP * 0.6, 0.014, "square");
    }
    if (bar % 4 === 3 && beat === 7 && !breakdown) {
      percussion(time + STEP / 2, true);
    }
  }

  function tick() {
    if (stopped || !playing) return;
    // Never replay missed ticks in a burst after a throttled/background tab.
    if (nextTime < context.currentTime) nextTime = context.currentTime + 0.025;
    while (nextTime < context.currentTime + LOOKAHEAD) {
      schedule(step, nextTime);
      step = (step + 1) % 128;
      nextTime += STEP;
    }
    timer = setTimeout(tick, 25);
  }

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  const player: CookieMusic = {
    setVolume(value) {
      level = clamp(value);
      if (!stopped) master.gain.setTargetAtTime(playing ? level * 0.65 : 0, context.currentTime, 0.035);
    },
    pause() {
      if (stopped) return;
      generation++;
      playing = false;
      clearTimer();
      master.gain.setTargetAtTime(0, context.currentTime, 0.02);
      void context.suspend().catch(() => {});
    },
    async resume() {
      if (stopped || playing) return;
      const operation = ++generation;
      await context.resume();
      if (stopped || operation !== generation) return;
      playing = true;
      nextTime = Math.max(nextTime, context.currentTime + 0.035);
      master.gain.setTargetAtTime(level * 0.65, context.currentTime, 0.04);
      tick();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      playing = false;
      generation++;
      clearTimer();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.value = 0;
      for (const [source, nodes] of voices) {
        source.onended = null;
        try { source.stop(); } catch { /* Already ended. */ }
        source.disconnect();
        nodes.forEach(node => node.disconnect());
      }
      voices.clear();
      [master, limiter, echo, feedback, wet].forEach(node => node.disconnect());
      void context.close().catch(() => {});
    },
  };
  try {
    // Invoked before any asynchronous work, preserving browser user activation.
    await player.resume();
    return player;
  } catch (error) {
    player.stop();
    throw error;
  }
}
