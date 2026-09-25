/**
 * Original procedural music for Cookie Jacuzzi. No recordings, samples,
 * network requests or third-party compositions. Safe to import during SSR.
 *
 * Create freely; call start()/resume() directly from an explicit user gesture.
 * The constructor does not create an AudioContext. The owner handles document
 * visibility: pause() when hidden, then offer a user-triggered resume().
 */
export type JacuzziTrackId = "cosmic-lounge" | "observatory-ambient" | "garden-dreamy";
export type JacuzziMusicState = "idle" | "playing" | "paused" | "disposed";
export interface JacuzziTrackInfo {
  readonly id: JacuzziTrackId;
  readonly name: string;
  readonly description: string;
  readonly bpm: number;
  readonly phraseSeconds: number;
}
export interface JacuzziMusicOptions {
  onStateChange?: (state: JacuzziMusicState) => void;
}
export interface JacuzziMusicEngine {
  readonly state: JacuzziMusicState;
  readonly track: JacuzziTrackId | null;
  /** Starts a selected track; selecting the playing track only changes volume. */
  start(track: JacuzziTrackId, volume?: number): Promise<void>;
  /** Freezes musical time, including voices already scheduled. */
  pause(): void;
  /** User gesture required. Continues a paused phrase. */
  resume(): Promise<void>;
  /** Stops and resets the phrase. The engine remains reusable. */
  stop(): void;
  setVolume(volume: number): void;
  /** Releases all nodes, timers and the owned AudioContext. */
  dispose(): void;
}

type Chord = readonly [bass: number, notes: readonly number[]];
type MelodyNote = readonly [eighth: number, midi: number, beats: number];
type Timbre = "pad" | "keys" | "glass" | "harp" | "bass";
interface Score {
  info: JacuzziTrackInfo;
  chords: readonly Chord[];
  melody: readonly (readonly MelodyNote[])[];
  lead: Timbre;
  swing: number;
  echo: number;
}

// Eight two-bar phrases = sixteen 4/4 bars. Deliberate rests and different
// note lengths make these composed melodies, rather than a random note stream.
const SCORES: readonly Score[] = [
  {
    info: { id: "cosmic-lounge", name: "Salon des étoiles", bpm: 84,
      description: "Piano feutré, basse ronde et petite batterie cosmique.", phraseSeconds: 64 * 60 / 84 },
    // Dmaj9 / Bm9 / Em9 / A13 / F#m7 / Bm9 / Gmaj9 / A13.
    chords: [[38, [54, 57, 61, 64]], [35, [54, 57, 61, 62]],
      [40, [55, 59, 62, 66]], [33, [55, 61, 66, 71]],
      [42, [57, 61, 64, 69]], [35, [54, 57, 61, 62]],
      [31, [54, 57, 59, 62]], [33, [55, 61, 64, 66]]],
    melody: [
      [[1, 66, 1], [4, 69, 0.75], [7, 73, 1.5], [12, 71, 1], [15, 69, 0.4]],
      [[0, 66, 1.5], [5, 64, 0.75], [8, 62, 2], [14, 66, 0.7]],
      [[2, 67, 1], [5, 71, 1], [9, 74, 1.5], [14, 73, 0.7]],
      [[0, 71, 1.5], [4, 69, 1], [8, 66, 1], [12, 64, 1.6]],
      [[2, 69, 2], [8, 73, 1.5], [13, 76, 1]],
      [[1, 74, 1.5], [6, 73, 1], [10, 69, 2]],
      [[0, 71, 1.5], [4, 69, 1], [8, 66, 1], [12, 62, 1.5]],
      [[2, 64, 1], [6, 61, 1], [10, 64, 1], [14, 69, 0.75]],
    ], lead: "keys", swing: 0.12, echo: 0.14,
  },
  {
    info: { id: "observatory-ambient", name: "Veille de l’observatoire", bpm: 60,
      description: "Nappes profondes et notes de verre dans un ciel calme.", phraseSeconds: 64 },
    // E minor with soft suspended colours; every two-bar breath has its own motif.
    chords: [[40, [55, 59, 62, 66]], [36, [55, 59, 62, 64]],
      [43, [54, 57, 59, 62]], [38, [54, 57, 62, 64]],
      [45, [55, 59, 60, 64]], [40, [55, 59, 62, 66]],
      [36, [55, 59, 62, 64]], [35, [54, 57, 59, 64]]],
    melody: [
      [[0, 71, 2.8], [7, 78, 2.5], [14, 74, 0.9]],
      [[2, 76, 2.5], [10, 71, 2.5]],
      [[0, 74, 2.4], [8, 69, 2], [14, 71, 0.9]],
      [[3, 69, 2.8], [11, 66, 1.8]],
      [[0, 72, 3], [9, 71, 2.2]],
      [[2, 67, 2.8], [10, 74, 2]],
      [[0, 71, 2.5], [7, 76, 2.5], [14, 74, 0.8]],
      [[2, 69, 2.5], [10, 66, 2.5]],
    ], lead: "glass", swing: 0, echo: 0.26,
  },
  {
    info: { id: "garden-dreamy", name: "Jardin de caramel", bpm: 72,
      description: "Harpe douce, accords veloutés et percussions de jardin.", phraseSeconds: 64 * 60 / 72 },
    // Fmaj9 / Dm9 / Bbmaj7 / Cadd9 / Am7 / Dm9 / Bbmaj7 / C6.
    chords: [[41, [57, 60, 64, 67]], [38, [53, 57, 60, 64]],
      [34, [53, 57, 62, 65]], [36, [55, 60, 62, 64]],
      [33, [55, 60, 64, 67]], [38, [53, 57, 60, 64]],
      [34, [53, 57, 62, 65]], [36, [55, 57, 60, 64]]],
    melody: [
      [[0, 69, 1], [3, 72, 0.9], [6, 76, 1.5], [10, 79, 1], [13, 76, 1]],
      [[1, 77, 1], [4, 76, 1], [7, 72, 1.5], [12, 69, 1.4]],
      [[0, 70, 1], [3, 74, 1], [6, 77, 1.4], [11, 74, 1.5]],
      [[1, 76, 1], [5, 74, 1], [8, 72, 1.2], [12, 67, 1.5]],
      [[2, 72, 1.5], [7, 76, 1.4], [12, 79, 1.3]],
      [[0, 77, 1.5], [5, 76, 1], [9, 72, 2]],
      [[0, 74, 1], [3, 77, 1], [7, 81, 1.3], [11, 77, 1.7]],
      [[1, 76, 1.2], [5, 72, 1.2], [9, 69, 1], [13, 67, 1]],
    ], lead: "harp", swing: 0.025, echo: 0.20,
  },
];

export const JACUZZI_MUSIC_TRACKS: readonly JacuzziTrackInfo[] = Object.freeze(
  SCORES.map(score => Object.freeze({ ...score.info })),
);

const clamp = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const STEPS = 128;
const LOOKAHEAD = 0.22;
const SCHEDULE_INTERVAL = 50;
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
interface Voice { sources: AudioScheduledSourceNode[]; nodes: AudioNode[] }
interface Graph { input: GainNode; echoSend: GainNode; output: GainNode; nodes: AudioNode[] }

export class OriginalJacuzziMusicEngine implements JacuzziMusicEngine {
  private context: AudioContext | null = null;
  private graph: Graph | null = null;
  private noise: AudioBuffer | null = null;
  private voices = new Set<Voice>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private score: Score | null = null;
  private step = 0;
  private loop = 0;
  private nextTime = 0;
  private volume = 0.3;
  private status: JacuzziMusicState = "idle";

  constructor(private readonly options: JacuzziMusicOptions = {}) {}
  get state(): JacuzziMusicState { return this.status; }
  get track(): JacuzziTrackId | null { return this.score?.info.id ?? null; }

  private updateState(state: JacuzziMusicState): void {
    if (this.status === state) return;
    this.status = state;
    try { this.options.onStateChange?.(state); } catch { /* UI cannot break audio cleanup. */ }
  }

  private checkGesture(): void {
    if (this.status === "disposed") throw new Error("Le lecteur musical a été fermé.");
    if (typeof window === "undefined") throw new Error("La musique nécessite un navigateur.");
    // The UI starts playback only from its controls. Native AudioContext.resume
    // enforces autoplay policy, including select controls on mobile browsers.
  }

  private getContext(): AudioContext {
    if (this.context) return this.context;
    const Audio = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Audio) throw new Error("Ce navigateur ne prend pas en charge la musique du jeu.");
    const context = new Audio({ latencyHint: "playback" });
    this.context = context;
    context.onstatechange = () => {
      if (context.state !== "running" && this.status === "playing") {
        this.clearTimer();
        this.updateState("paused");
      }
    };
    const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.5), context.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 340020;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = seed / 0x80000000 - 1;
    }
    this.noise = noise;
    return context;
  }

  private createGraph(context: AudioContext, score: Score): Graph {
    const input = context.createGain();
    const soften = context.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = score.info.id === "observatory-ambient" ? 5200 : 6800;
    soften.Q.value = 0.45;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 16;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.25;
    const output = context.createGain();
    output.gain.value = 0;
    input.connect(soften).connect(compressor).connect(output).connect(context.destination);
    const echoSend = context.createGain();
    echoSend.gain.value = score.echo;
    const delay = context.createDelay(2);
    delay.delayTime.value = 60 / score.info.bpm * 0.75;
    const echoFilter = context.createBiquadFilter();
    echoFilter.type = "lowpass";
    echoFilter.frequency.value = 2100;
    const feedback = context.createGain();
    feedback.gain.value = 0.23;
    const echoPan = context.createStereoPanner();
    echoPan.pan.value = 0.32;
    echoSend.connect(delay).connect(echoFilter).connect(echoPan).connect(input);
    echoFilter.connect(feedback).connect(delay);
    return { input, echoSend, output,
      nodes: [input, soften, compressor, output, echoSend, delay, echoFilter, feedback, echoPan] };
  }

  private register(sources: AudioScheduledSourceNode[], nodes: AudioNode[]): void {
    const voice = { sources, nodes };
    let remaining = sources.length;
    this.voices.add(voice);
    for (const source of sources) source.onended = () => {
      remaining--;
      if (!remaining) this.releaseVoice(voice, false);
    };
  }

  private releaseVoice(voice: Voice, stop: boolean): void {
    for (const source of voice.sources) {
      source.onended = null;
      if (stop) { try { source.stop(); } catch { /* Already stopped. */ } }
      source.disconnect();
    }
    for (const node of voice.nodes) node.disconnect();
    this.voices.delete(voice);
  }

  private tone(midi: number, at: number, duration: number, kind: Timbre,
    velocity = 1, pan = 0): void {
    const context = this.context!, graph = this.graph!;
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const position = context.createStereoPanner();
    const pad = kind === "pad", bass = kind === "bass";
    const amp = (pad ? 0.027 : bass ? 0.10 : kind === "glass" ? 0.071 : 0.087) * velocity;
    const attack = Math.min(duration * 0.2, pad ? 0.65 : bass ? 0.035 : kind === "glass" ? 0.08 : 0.016);
    const tail = pad ? 0.7 : bass ? 0.12 : kind === "harp" ? 0.30 : 0.22;
    filter.type = "lowpass";
    filter.Q.value = 0.35;
    filter.frequency.setValueAtTime(pad ? 1500 : bass ? 700 : kind === "keys" ? 2700 : 4200, at);
    if (kind === "keys" || kind === "harp") filter.frequency.exponentialRampToValueAtTime(950, at + duration + tail);
    position.pan.value = pan;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(amp, at + attack);
    if (pad) {
      envelope.gain.linearRampToValueAtTime(amp * 0.78, at + duration * 0.70);
      envelope.gain.linearRampToValueAtTime(0, at + duration + tail);
    } else {
      envelope.gain.exponentialRampToValueAtTime(0.00008, at + duration + tail);
      envelope.gain.linearRampToValueAtTime(0, at + duration + tail + 0.01);
    }
    filter.connect(envelope).connect(position).connect(graph.input);
    if (!bass) position.connect(graph.echoSend);
    const first = context.createOscillator();
    first.type = kind === "keys" || kind === "harp" ? "triangle" : "sine";
    first.frequency.value = frequency(midi);
    first.connect(filter);
    const sources: OscillatorNode[] = [first];
    const nodes: AudioNode[] = [filter, envelope, position];
    if (pad || kind === "glass") {
      const shimmer = context.createOscillator();
      const blend = context.createGain();
      shimmer.type = "sine";
      shimmer.frequency.value = frequency(midi) * (pad ? 1 : 2);
      shimmer.detune.value = pad ? 5 : 0;
      blend.gain.value = pad ? 0.36 : 0.16;
      shimmer.connect(blend).connect(filter);
      sources.push(shimmer);
      nodes.push(blend);
    }
    this.register(sources, nodes);
    for (const source of sources) {
      source.start(at);
      source.stop(at + duration + tail + 0.025);
    }
  }

  private percussion(at: number, kind: "kick" | "brush" | "shaker", level: number): void {
    const context = this.context!, graph = this.graph!;
    const envelope = context.createGain();
    const duration = kind === "kick" ? 0.22 : kind === "brush" ? 0.18 : 0.065;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.00005, at + duration);
    envelope.connect(graph.input);
    let source: AudioScheduledSourceNode;
    const nodes: AudioNode[] = [envelope];
    if (kind === "kick") {
      const oscillator = context.createOscillator();
      oscillator.frequency.setValueAtTime(96, at);
      oscillator.frequency.exponentialRampToValueAtTime(43, at + 0.13);
      oscillator.connect(envelope);
      source = oscillator;
    } else {
      const noise = context.createBufferSource();
      noise.buffer = this.noise;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = kind === "brush" ? 1700 : 6100;
      filter.Q.value = kind === "brush" ? 0.55 : 0.8;
      noise.connect(filter).connect(envelope);
      nodes.push(filter);
      source = noise;
    }
    this.register([source], nodes);
    source.start(at);
    source.stop(at + duration + 0.02);
  }

  private schedule(step: number, at: number, score: Score): void {
    const beat = 60 / score.info.bpm;
    const pair = Math.floor(step / 16), eighth = step % 16;
    const [root, chord] = score.chords[pair];
    const section = Math.floor(pair / 2);
    const breathing = section === 2;
    const ambient = score.info.id === "observatory-ambient";
    const garden = score.info.id === "garden-dreamy";
    // The third quarter thins out; the final quarter returns gently. Repeating
    // phrases alternate the quiet arpeggio register, leaving the melody intact.
    if (eighth === 0) {
      chord.forEach((note, i) => this.tone(note, at + i * (garden ? 0.035 : 0.012),
        beat * 7.4, "pad", ambient ? 0.88 : 0.72, (i - 1.5) * 0.20));
      this.tone(root, at, beat * (ambient ? 6.5 : 2.6), "bass", ambient ? 0.52 : 0.72);
    }
    if (!ambient && (eighth === 8 || (!garden && !breathing && eighth === 13))) {
      this.tone(root + (eighth === 13 ? 7 : 0), at, beat * (eighth === 8 ? 2 : 0.6), "bass", 0.58);
    }
    for (const [onset, midi, length] of score.melody[pair]) {
      if (onset === eighth) this.tone(midi, at, beat * length, score.lead,
        breathing ? 0.66 : section === 3 ? 0.88 : 0.80, ambient ? -0.12 : 0.07);
    }
    const arpSteps = ambient ? [6, 14] : garden ? [1, 4, 7, 10, 13] : [3, 7, 11, 15];
    if (arpSteps.includes(eighth) && (!breathing || eighth < 8)) {
      const index = (Math.floor(eighth / 3) + pair + this.loop) % chord.length;
      const octave = ambient || (this.loop % 2 === 1 && garden) ? 12 : 0;
      this.tone(chord[index] + octave, at, beat * (ambient ? 1.5 : 0.8),
        ambient ? "glass" : garden ? "harp" : "keys", ambient ? 0.16 : 0.22, -0.35);
    }
    if (ambient) {
      if (eighth === 8 && pair % 2 === 1) this.percussion(at, "brush", 0.008);
    } else if (garden) {
      if (eighth === 0 || (eighth === 8 && !breathing)) this.percussion(at, "kick", 0.043);
      if ([3, 7, 11, 15].includes(eighth) && !breathing) this.percussion(at, "shaker", 0.010);
      if (eighth === 12) this.percussion(at, "brush", 0.017);
    } else {
      if (eighth === 0 || eighth === 8 || (!breathing && eighth === 11)) this.percussion(at, "kick", 0.069);
      if (eighth === 4 || eighth === 12) this.percussion(at, "brush", breathing ? 0.018 : 0.030);
      if (eighth % 2 === 1 && (!breathing || eighth % 4 === 3)) this.percussion(at, "shaker", 0.011);
    }
  }

  private tick = (): void => {
    const context = this.context, score = this.score;
    if (!context || !score || this.status !== "playing") return;
    if (context.state !== "running") {
      this.updateState("paused");
      this.clearTimer();
      return;
    }
    const eighth = 60 / score.info.bpm / 2;
    // A delayed/throttled timer drops elapsed slots instead of replaying a burst.
    if (this.nextTime < context.currentTime - 0.03) {
      const skipped = Math.ceil((context.currentTime + 0.025 - this.nextTime) / eighth);
      const advanced = this.step + skipped;
      this.loop += Math.floor(advanced / STEPS);
      this.step = advanced % STEPS;
      this.nextTime += skipped * eighth;
    }
    while (this.nextTime < context.currentTime + LOOKAHEAD) {
      const swungTime = this.nextTime + (this.step % 2 ? eighth * score.swing : 0);
      this.schedule(this.step, Math.max(swungTime, context.currentTime + 0.003), score);
      this.nextTime += eighth;
      this.step++;
      if (this.step === STEPS) { this.step = 0; this.loop++; }
    }
    this.timer = setTimeout(this.tick, SCHEDULE_INTERVAL);
  };

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private clearGraph(): void {
    this.clearTimer();
    if (this.graph && this.context) {
      this.graph.output.gain.cancelScheduledValues(this.context.currentTime);
      this.graph.output.gain.value = 0;
    }
    for (const voice of this.voices) this.releaseVoice(voice, true);
    for (const node of this.graph?.nodes ?? []) node.disconnect();
    this.graph = null;
  }

  async start(track: JacuzziTrackId, volume = this.volume): Promise<void> {
    this.checkGesture();
    const score = SCORES.find(candidate => candidate.info.id === track);
    if (!score) throw new Error("Ce morceau n’existe pas.");
    if (this.status === "playing" && this.score === score) { this.setVolume(volume); return; }
    const operation = ++this.generation;
    this.clearGraph();
    this.updateState("idle");
    if (operation !== this.generation) return;
    this.score = score;
    this.volume = clamp(volume);
    this.step = 0;
    this.loop = 0;
    const context = this.getContext();
    this.graph = this.createGraph(context, score);
    this.nextTime = context.currentTime + 0.06;
    try {
      // Called synchronously before the first await, preserving activation.
      await context.resume();
      if (operation !== this.generation) return;
      if (context.state !== "running") throw new Error("La musique attend une interaction.");
      this.nextTime = context.currentTime + 0.06;
      this.updateState("playing");
      if (operation !== this.generation) return;
      this.graph!.output.gain.setTargetAtTime(this.volume * 0.45, context.currentTime, 0.09);
      this.tick();
    } catch (error) {
      if (operation === this.generation) this.stop();
      throw error;
    }
  }

  setVolume(volume: number): void {
    this.volume = clamp(volume);
    if (this.graph && this.context) this.graph.output.gain.setTargetAtTime(
      this.volume * 0.45, this.context.currentTime, 0.045,
    );
  }

  pause(): void {
    if (this.status === "disposed" || !this.context || !this.graph) return;
    this.generation++;
    this.clearTimer();
    this.updateState("paused");
    void this.context.suspend().catch(() => { /* Interruption may already have suspended it. */ });
  }

  async resume(): Promise<void> {
    this.checkGesture();
    if (!this.context || !this.graph || this.status === "playing") return;
    const operation = ++this.generation;
    const context = this.context;
    await context.resume();
    if (operation !== this.generation) return;
    if (context.state !== "running") throw new Error("Relance la musique avec le bouton de lecture.");
    this.updateState("playing");
    if (operation !== this.generation) return;
    this.graph!.output.gain.setTargetAtTime(this.volume * 0.45, context.currentTime, 0.045);
    this.tick();
  }

  stop(): void {
    if (this.status === "disposed") return;
    this.generation++;
    this.clearGraph();
    this.score = null;
    this.step = 0;
    this.loop = 0;
    this.updateState("idle");
    void this.context?.suspend().catch(() => {});
  }

  dispose(): void {
    if (this.status === "disposed") return;
    this.generation++;
    this.clearGraph();
    const context = this.context;
    if (context) {
      context.onstatechange = null;
      void context.close().catch(() => {});
    }
    this.context = null;
    this.noise = null;
    this.score = null;
    this.updateState("disposed");
  }
}

export function createJacuzziMusicEngine(options: JacuzziMusicOptions = {}): JacuzziMusicEngine {
  return new OriginalJacuzziMusicEngine(options);
}
