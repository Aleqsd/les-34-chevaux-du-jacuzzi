/**
 * Four ORIGINAL energetic synth compositions. All instruments are synthesized
 * locally: no recordings, licensed music, network calls, storage or autoplay.
 * Call createEnergyMusic only from the opt-in playback UI. Native AudioContext
 * policy handles activation; no brittle navigator.userActivation gate is used.
 * The caller pauses on document hide. stop() is terminal and releases audio.
 */
export type EnergyTrackId = "turbo-biscuit" | "galop-neon" | "pluie-meteores" | "jackpot-cosmique";
export interface EnergyMusic {
  setVolume(volume: number): void;
  pause(): void;
  resume(): Promise<void>;
  stop(): void;
}
export interface EnergyTrackInfo {
  readonly id: EnergyTrackId;
  readonly name: string;
  readonly bpm: number;
  readonly description: string;
}
type Note = readonly [sixteenth: number, midi: number, length: number];
type Hook = readonly (readonly Note[])[];
interface Score {
  info: EnergyTrackInfo;
  roots: readonly number[];
  chords: readonly (readonly number[])[];
  hooks: readonly [Hook, Hook];
  style: "house" | "rave" | "break" | "anthem";
  lead: OscillatorType;
}

const SCORES: readonly Score[] = [
  {
    info: { id: "turbo-biscuit", name: "Turbo biscuit", bpm: 148,
      description: "Électro house : grosse pulsation, basse à contretemps et refrain turbo." },
    style: "house", lead: "sawtooth", roots: [40, 36, 43, 38],
    chords: [[55, 59, 64], [55, 60, 64], [55, 59, 62], [54, 57, 62]],
    hooks: [
      [
        [[0, 76, 2.5], [3, 79, 1.5], [6, 83, 3], [10, 81, 2], [14, 79, 1.5]],
        [[0, 76, 4], [6, 79, 2], [9, 84, 2.5], [13, 83, 2.5]],
        [[0, 79, 2.5], [3, 83, 1.5], [6, 86, 3], [10, 83, 2], [14, 81, 1.5]],
        [[0, 81, 3], [4, 78, 2], [8, 74, 3], [12, 78, 1.5], [14, 79, 1.5]],
      ],
      [
        [[0, 83, 3], [4, 79, 1.5], [6, 76, 2], [10, 79, 1.5], [12, 83, 3]],
        [[0, 84, 3], [4, 83, 1.5], [7, 79, 2], [10, 76, 3], [14, 79, 1.5]],
        [[0, 86, 3], [4, 83, 2], [7, 79, 2], [10, 83, 2], [14, 86, 1.5]],
        [[0, 85, 2], [3, 81, 2], [6, 78, 3], [10, 74, 2], [13, 78, 2]],
      ],
    ],
  },
  {
    info: { id: "galop-neon", name: "Galop néon", bpm: 160,
      description: "Rave arcade : galop de basse, éclats chiptune et montée au grand saut." },
    style: "rave", lead: "square", roots: [33, 41, 38, 40],
    chords: [[57, 60, 64], [57, 60, 65], [57, 62, 65], [56, 59, 64]],
    hooks: [
      [
        [[0, 81, 1.4], [2, 84, 1.4], [4, 88, 2.5], [7, 84, 0.8], [8, 83, 2], [11, 81, 1.5], [14, 76, 1.5]],
        [[0, 81, 1.4], [2, 84, 1.4], [4, 89, 2.5], [7, 88, 0.8], [8, 84, 2], [12, 81, 3]],
        [[0, 86, 1.4], [2, 89, 1.4], [4, 93, 2], [7, 89, 0.8], [8, 86, 2], [11, 84, 1.5], [14, 81, 1.5]],
        [[0, 83, 2], [3, 80, 1.5], [6, 76, 2], [9, 80, 1.5], [12, 83, 1], [14, 88, 1.5]],
      ],
      [
        [[0, 88, 2], [3, 84, 1], [5, 81, 2], [8, 88, 2], [11, 91, 1], [13, 88, 2]],
        [[0, 89, 2], [3, 88, 1], [5, 84, 2], [8, 81, 2], [11, 84, 1], [13, 89, 2]],
        [[0, 89, 2], [3, 86, 1], [5, 81, 2], [8, 86, 2], [11, 89, 1], [13, 93, 2]],
        [[0, 92, 2], [3, 88, 1], [5, 83, 2], [8, 80, 2], [11, 83, 1], [13, 88, 2]],
      ],
    ],
  },
  {
    info: { id: "pluie-meteores", name: "Pluie de météores", bpm: 174,
      description: "Drum & bass : batterie brisée, basse grondante et pluie de notes rapides." },
    style: "break", lead: "triangle", roots: [30, 38, 33, 40],
    chords: [[57, 61, 66], [57, 62, 66], [57, 61, 64], [56, 59, 64]],
    hooks: [
      [
        [[0, 78, 3], [5, 81, 2], [8, 85, 4], [14, 83, 1.5]],
        [[0, 81, 3], [5, 78, 2], [8, 74, 4], [14, 78, 1.5]],
        [[0, 76, 3], [4, 81, 2], [7, 85, 3], [12, 83, 3]],
        [[1, 80, 3], [6, 76, 2], [10, 71, 3], [14, 76, 1.5]],
      ],
      [
        [[0, 85, 3], [4, 83, 2], [7, 81, 3], [12, 78, 3]],
        [[0, 86, 3], [5, 85, 2], [8, 81, 4], [14, 78, 1.5]],
        [[0, 85, 3], [5, 81, 2], [8, 76, 3], [12, 73, 1.5], [14, 76, 1.5]],
        [[0, 80, 3], [4, 83, 2], [7, 88, 3], [12, 83, 3]],
      ],
    ],
  },
  {
    info: { id: "jackpot-cosmique", name: "Jackpot cosmique", bpm: 152,
      description: "Dance euphorique : grand refrain lumineux, accords bondissants et confettis." },
    style: "anthem", lead: "sawtooth", roots: [36, 43, 45, 41],
    chords: [[55, 60, 64], [55, 59, 62], [57, 60, 64], [57, 60, 65]],
    hooks: [
      [
        [[0, 76, 3], [4, 79, 2], [7, 84, 5], [14, 83, 1.5]],
        [[0, 83, 3], [4, 81, 2], [7, 79, 5], [14, 74, 1.5]],
        [[0, 76, 3], [4, 81, 2], [7, 84, 5], [14, 86, 1.5]],
        [[0, 84, 3], [4, 81, 2], [7, 77, 4], [12, 79, 3]],
      ],
      [
        [[0, 84, 5], [6, 79, 1.5], [8, 76, 3], [12, 79, 3]],
        [[0, 86, 5], [6, 83, 1.5], [8, 79, 3], [12, 74, 3]],
        [[0, 88, 5], [6, 84, 1.5], [8, 81, 3], [12, 79, 3]],
        [[0, 89, 3], [4, 88, 2], [7, 84, 3], [11, 81, 2], [14, 79, 1.5]],
      ],
    ],
  },
];

export const ENERGY_MUSIC_TRACKS: readonly EnergyTrackInfo[] = Object.freeze(
  SCORES.map(score => Object.freeze({ ...score.info })),
);
const PHRASE_STEPS = 32 * 16;
const PHRASES_PER_ROTATION = 2; // 64 bars: 88–104 s, depending on tempo.
const LOOKAHEAD = 0.16;
const POLL_MS = 40;
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const clamp = (n: number) => Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
type Voice = { sources: AudioScheduledSourceNode[]; nodes: AudioNode[] };
type Instrument = "lead" | "bass" | "stab" | "arp" | "pad";

export async function createEnergyMusic(volume = 0.3, onTrack?: (name: string) => void,
  trackId?: EnergyTrackId): Promise<EnergyMusic> {
  const selected = trackId === undefined ? 0 : SCORES.findIndex(score => score.info.id === trackId);
  if (selected < 0) throw new Error("Ce morceau n’existe pas.");
  if (typeof window === "undefined") throw new Error("La musique nécessite un navigateur.");
  const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) throw new Error("Ce navigateur ne prend pas en charge la musique du jeu.");
  const context = new Audio({ latencyHint: "playback" });
  const nodes: AudioNode[] = [];
  const voices = new Set<Voice>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false, playing = false, generation = 0, level = clamp(volume);
  let songIndex = selected, step = 0, phrases = 0;
  let nextTime = context.currentTime + 0.055;
  let announcements: { at: number; index: number }[] = [];
  let announced = -1;

  // Tone/drum buses allow subtle kick-driven ducking without a DSP worklet.
  const mix = context.createGain(), tonal = context.createGain(), output = context.createGain();
  const soften = context.createBiquadFilter(), limiter = context.createDynamicsCompressor();
  nodes.push(mix, tonal, output, soften, limiter);
  soften.type = "lowpass"; soften.frequency.value = 7600; soften.Q.value = 0.5;
  limiter.threshold.value = -8; limiter.knee.value = 5; limiter.ratio.value = 12;
  limiter.attack.value = 0.003; limiter.release.value = 0.13;
  output.gain.value = 0;
  tonal.connect(mix).connect(soften).connect(limiter).connect(output).connect(context.destination);
  const echoSend = context.createGain(), delay = context.createDelay(1);
  const echoFilter = context.createBiquadFilter(), feedback = context.createGain();
  nodes.push(echoSend, delay, echoFilter, feedback);
  echoSend.gain.value = 0.13; feedback.gain.value = 0.19;
  delay.delayTime.value = 60 / SCORES[songIndex].info.bpm * 0.75;
  echoFilter.type = "lowpass"; echoFilter.frequency.value = 2400;
  echoSend.connect(delay).connect(echoFilter).connect(tonal);
  echoFilter.connect(feedback).connect(delay);
  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.75), context.sampleRate);
  const data = noise.getChannelData(0);
  let seed = 341521;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = seed / 0x80000000 - 1;
  }

  function release(voice: Voice, stop = false) {
    for (const source of voice.sources) {
      source.onended = null;
      if (stop) { try { source.stop(); } catch { /* Already ended. */ } }
      source.disconnect();
    }
    voice.nodes.forEach(node => node.disconnect());
    voices.delete(voice);
  }
  function register(sources: AudioScheduledSourceNode[], privateNodes: AudioNode[]) {
    const voice = { sources, nodes: privateNodes };
    let remaining = sources.length;
    voices.add(voice);
    for (const source of sources) source.onended = () => { if (--remaining === 0) release(voice); };
  }

  function tone(note: number, at: number, duration: number, instrument: Instrument,
    score: Score, velocity = 1, pan = 0, brightness = 1) {
    const bass = instrument === "bass", pad = instrument === "pad", lead = instrument === "lead";
    const oscillator = context.createOscillator(), envelope = context.createGain();
    const filter = context.createBiquadFilter(), position = context.createStereoPanner();
    const amp = (bass ? 0.13 : lead ? 0.125 : pad ? 0.028 : instrument === "stab" ? 0.047 : 0.034) * velocity;
    const attack = pad ? 0.13 : bass ? 0.007 : 0.006;
    const releaseTime = pad ? 0.22 : lead ? 0.07 : bass ? 0.028 : 0.045;
    oscillator.type = bass ? score.style === "break" ? "sawtooth" : "triangle" :
      lead ? score.lead : instrument === "arp" ? "triangle" : pad ? "sine" : "sawtooth";
    oscillator.frequency.value = hz(note);
    filter.type = "lowpass"; filter.Q.value = bass && score.style === "break" ? 1.6 : 0.65;
    const cutoff = bass ? (score.style === "break" ? 1050 : 800) : pad ? 1700 : lead ? 4600 : 3400;
    filter.frequency.setValueAtTime(cutoff * brightness, at);
    filter.frequency.exponentialRampToValueAtTime((bass ? 180 : pad ? 1100 : 1400) * Math.min(1, brightness), at + duration + releaseTime);
    position.pan.value = pan;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(amp, at + Math.min(attack, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(amp * (pad ? 0.70 : lead ? 0.48 : 0.25), at + duration);
    envelope.gain.exponentialRampToValueAtTime(0.00004, at + duration + releaseTime);
    oscillator.connect(filter).connect(envelope).connect(position).connect(tonal);
    if (lead || instrument === "arp") position.connect(echoSend);
    const sources: OscillatorNode[] = [oscillator], privateNodes: AudioNode[] = [filter, envelope, position];
    // A quiet detuned layer gives the drops body; the bright waveform remains filtered.
    if (lead || (bass && score.style === "break")) {
      const second = context.createOscillator(), blend = context.createGain();
      second.type = bass ? "sawtooth" : score.style === "rave" ? "triangle" : "sawtooth";
      second.frequency.value = hz(note) * (score.style === "rave" && lead ? 0.5 : 1);
      second.detune.value = bass ? 11 : score.style === "anthem" ? -8 : 6;
      blend.gain.value = bass ? 0.28 : 0.32;
      second.connect(blend).connect(filter);
      sources.push(second); privateNodes.push(blend);
    }
    register(sources, privateNodes);
    sources.forEach(source => { source.start(at); source.stop(at + duration + releaseTime + 0.015); });
  }

  function drum(kind: "kick" | "snare" | "hat" | "open" | "crash", at: number, velocity = 1, beat = 0.4) {
    const gain = context.createGain();
    const duration = kind === "kick" ? 0.23 : kind === "snare" ? 0.17 : kind === "crash" ? 0.55 : kind === "open" ? 0.16 : 0.043;
    const amp = (kind === "kick" ? 0.32 : kind === "snare" ? 0.15 : kind === "crash" ? 0.073 : kind === "open" ? 0.049 : 0.034) * velocity;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(amp, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.00004, at + duration);
    gain.connect(mix);
    const privateNodes: AudioNode[] = [gain], sources: AudioScheduledSourceNode[] = [];
    if (kind === "kick") {
      const oscillator = context.createOscillator();
      oscillator.frequency.setValueAtTime(170, at);
      oscillator.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      oscillator.connect(gain); sources.push(oscillator);
      tonal.gain.setValueAtTime(0.58, at);
      tonal.gain.exponentialRampToValueAtTime(1, at + beat * 0.42);
    } else {
      const source = context.createBufferSource(), filter = context.createBiquadFilter();
      source.buffer = noise;
      filter.type = kind === "snare" ? "bandpass" : "highpass";
      filter.frequency.value = kind === "snare" ? 1600 : kind === "crash" ? 3500 : 5900;
      filter.Q.value = 0.65;
      source.connect(filter).connect(gain); privateNodes.push(filter); sources.push(source);
      if (kind === "snare") {
        const body = context.createOscillator(), bodyGain = context.createGain();
        body.frequency.setValueAtTime(210, at);
        body.frequency.exponentialRampToValueAtTime(145, at + 0.075);
        bodyGain.gain.value = 0.24;
        body.connect(bodyGain).connect(gain); privateNodes.push(bodyGain); sources.push(body);
      }
    }
    register(sources, privateNodes);
    sources.forEach(source => { source.start(at); source.stop(at + duration + 0.012); });
  }

  function rise(at: number, duration: number, intensity: number) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = noise; source.loop = true;
    filter.type = "bandpass"; filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(600 + intensity * 450, at);
    filter.frequency.exponentialRampToValueAtTime(2200 + intensity * 1100, at + duration);
    gain.gain.setValueAtTime(0.004, at);
    gain.gain.linearRampToValueAtTime(0.013 + intensity * 0.004, at + duration - 0.025);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    source.connect(filter).connect(gain).connect(mix);
    register([source], [filter, gain]); source.start(at); source.stop(at + duration + 0.01);
  }

  function schedule(index: number, at: number, score: Score) {
    const bar = Math.floor(index / 16), sixteenth = index % 16, harmony = bar % 4;
    const beat = 60 / score.info.bpm, unit = beat / 4;
    const breath = bar >= 16 && bar < 20, build = bar >= 20 && bar < 24, drop = bar >= 24;
    const entry = bar < 4, fill = bar % 8 === 7, variant = Math.floor(bar / 4) % 2;
    const root = score.roots[harmony], chord = score.chords[harmony];
    const strength = breath ? 0.45 : entry ? 0.82 : drop ? 1 : 0.91;
    const brightness = breath ? 0.43 : build ? 0.55 + (bar - 20) * 0.18 : drop ? 1.1 : 0.9;
    if (sixteenth === 0 && [0, 4, 12, 24].includes(bar)) drum("crash", at, drop ? 1 : 0.6);

    if (breath) {
      if (sixteenth === 0) {
        chord.forEach((note, i) => tone(note, at, beat * 3.7, "pad", score, 1.1, (i - 1) * 0.25));
        tone(root, at, beat * 2.6, "bass", score, 0.42);
      }
      if (sixteenth === 8 && bar % 2 === 0) drum("snare", at, 0.22);
    } else if (build) {
      if (sixteenth === 0) rise(at, beat * 3.92, bar - 20);
      if ((bar < 22 && sixteenth % 8 === 0) || (bar === 22 && sixteenth % 4 === 0)) drum("kick", at, 0.75, beat);
      const division = bar === 23 ? 1 : bar === 22 ? 2 : 4;
      if (sixteenth % division === 0 && !(bar === 23 && sixteenth > 13)) {
        drum("snare", at, 0.22 + (bar - 20) * 0.09 + sixteenth / 100);
      }
      if (sixteenth % 4 === 2) tone(root + 12, at, unit * 1.3, "bass", score, 0.44, 0, brightness);
    } else {
      const kicks = score.style === "break" ? (bar % 2 ? [0, 7, 10] : [0, 6, 8, 14]) : [0, 4, 8, 12];
      if (kicks.includes(sixteenth)) drum("kick", at, strength, beat);
      if (sixteenth === 4 || sixteenth === 12) drum("snare", at, strength);
      if (score.style === "break" && [3, 11, 15].includes(sixteenth)) drum("snare", at, 0.22);
      if (sixteenth % 2 === 0 || (!entry && (score.style === "break" || score.style === "rave"))) {
        drum(sixteenth % 4 === 2 && score.style !== "break" ? "open" : "hat", at,
          sixteenth % 2 ? 0.42 : sixteenth % 4 === 2 ? 0.85 : 0.55);
      }
      if (fill && sixteenth >= 13) drum("snare", at, 0.33 + (sixteenth - 13) * 0.1);
      const bassPattern = score.style === "house" ? [2, 6, 10, 14] : score.style === "rave" ? [0, 3, 6, 8, 11, 14] :
        score.style === "break" ? (bar % 2 ? [0, 3, 7, 10, 14] : [0, 6, 9, 12, 15]) : [2, 6, 10, 12, 14];
      if (bassPattern.includes(sixteenth)) {
        const octave = score.style === "rave" && [6, 14].includes(sixteenth) ? 12 : 0;
        const pitch = score.style === "break" && sixteenth === 15 ? 7 : octave;
        tone(root + pitch, at, unit * (score.style === "break" && sixteenth === 0 ? 4.6 : 1.7),
          "bass", score, strength, 0, drop ? 1.25 : 1);
      }
    }

    // Strong, written hooks; longer notes alternate with syncopated responses.
    const hook = score.hooks[variant][harmony];
    for (const [onset, midi, length] of hook) {
      if (sixteenth !== onset || (breath && onset > 7) || (bar === 23 && onset > 8)) continue;
      tone(midi, at, length * unit, "lead", score, strength, 0.06, brightness);
      if (drop && (onset === 0 || onset === 8) && score.style === "anthem") {
        tone(midi - 12, at, length * unit, "lead", score, 0.24, -0.18, 0.7);
      }
    }
    const stabPattern = score.style === "break" ? [2, 10] : score.style === "rave" ? [0, 6, 8, 14] : [2, 6, 10, 14];
    if (!breath && !build && stabPattern.includes(sixteenth) && (!entry || sixteenth < 8)) {
      chord.forEach((note, i) => tone(note, at, unit * (score.style === "anthem" ? 2.4 : 1.4),
        "stab", score, drop ? 0.86 : 0.68, (i - 1) * 0.20, brightness));
    }
    if ((drop || score.style === "rave") && !breath && !build && sixteenth % 2 === 1) {
      const note = chord[(Math.floor(sixteenth / 2) + bar) % chord.length] + 12;
      tone(note, at, unit * 0.9, "arp", score, drop ? 0.65 : 0.42, -0.3);
    }
  }

  function clearTimer() { if (timer !== undefined) clearTimeout(timer); timer = undefined; }
  function announceDue() {
    // Announce the latest audible track only. Long UI stalls never replay a
    // backlog of notifications; pending future announcements survive pause.
    let latest: { at: number; index: number } | undefined;
    while (announcements.length && announcements[0].at <= context.currentTime) latest = announcements.shift();
    if (latest && latest.index !== announced) {
      announced = latest.index;
      try { onTrack?.(SCORES[announced].info.name); } catch { /* UI callback is isolated. */ }
    }
  }

  function tick() {
    if (stopped || !playing) return;
    if (context.state !== "running") { playing = false; clearTimer(); return; }
    announceDue();
    if (stopped || !playing) return;
    // Skip elapsed slots within the current piece after throttling. Count the
    // skipped time as one pending rotation at most, never many silent songs.
    let score = SCORES[songIndex], unit = 60 / score.info.bpm / 4;
    if (nextTime < context.currentTime - 0.025) {
      const missed = Math.ceil((context.currentTime + 0.025 - nextTime) / unit);
      const advanced = step + missed;
      phrases = Math.min(PHRASES_PER_ROTATION, phrases + Math.floor(advanced / PHRASE_STEPS));
      step = advanced % PHRASE_STEPS;
      nextTime += missed * unit;
    }
    while (nextTime < context.currentTime + LOOKAHEAD) {
      if (step === 0 && phrases >= PHRASES_PER_ROTATION) {
        phrases = 0;
        if (trackId === undefined) {
          songIndex = (songIndex + 1) % SCORES.length;
          score = SCORES[songIndex]; unit = 60 / score.info.bpm / 4;
          delay.delayTime.setTargetAtTime(60 / score.info.bpm * 0.75, nextTime, 0.08);
          announcements.push({ at: nextTime, index: songIndex });
        }
      }
      schedule(step, Math.max(nextTime, context.currentTime + 0.002), score);
      nextTime += unit;
      step++;
      if (step === PHRASE_STEPS) { step = 0; phrases++; }
    }
    announceDue();
    if (!stopped && playing) timer = setTimeout(tick, POLL_MS);
  }

  const player: EnergyMusic = {
    setVolume(value) {
      level = clamp(value);
      if (!stopped) output.gain.setTargetAtTime(level * 0.42, context.currentTime, 0.045);
    },
    pause() {
      if (stopped) return;
      generation++; playing = false; clearTimer();
      // Suspending freezes every scheduled voice, delay tail and musical clock.
      void context.suspend().catch(() => {});
    },
    async resume() {
      if (stopped || playing) return;
      const operation = ++generation;
      try {
        await context.resume();
        if (stopped || operation !== generation) return;
        if (context.state !== "running") throw new Error("Relance la musique avec le bouton de lecture.");
        playing = true;
        output.gain.setTargetAtTime(level * 0.42, context.currentTime, 0.05);
        tick();
      } catch (error) {
        if (stopped || operation !== generation) return;
        playing = false; clearTimer();
        throw error;
      }
    },
    stop() {
      if (stopped) return;
      stopped = true; playing = false; generation++; clearTimer();
      announcements = [];
      output.gain.cancelScheduledValues(context.currentTime); output.gain.value = 0;
      for (const voice of voices) release(voice, true);
      nodes.forEach(node => node.disconnect());
      context.onstatechange = null;
      void context.close().catch(() => {});
    },
  };
  context.onstatechange = () => {
    if (context.state !== "running" && playing) { playing = false; clearTimer(); }
  };
  announcements.push({ at: nextTime, index: songIndex });
  try {
    // The factory is called at the UI gesture; resume starts before first await.
    await player.resume();
    return player;
  } catch (error) {
    player.stop();
    throw error;
  }
}
