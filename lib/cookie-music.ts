/** Four original, locally synthesized tracks. Each rotates after four complete
 * 16-bar loops (~2 min), always on a musical boundary. Pausing freezes playback.
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

interface Track {
  name: string;
  bpm: number;
  roots: number[];
  chords: number[][];
  themes: number[][][];
  kicks: number[];
  bass: number[];
  lead: OscillatorType;
  arpeggio: OscillatorType;
  snareNote: number;
}

const LOOKAHEAD = 0.12;
const STEPS_PER_LOOP = 128;
const LOOPS_PER_TRACK = 4;
// Every melody is original. Zero denotes a deliberate breath in the phrase.
const TRACKS: Track[] = [
  {
    name: "Biscuit cosmique", bpm: 118,
    roots: [36, 45, 41, 43],
    chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
    themes: [
      [[76, 0, 79, 76, 74, 72, 0, 74], [72, 0, 76, 79, 76, 72, 71, 0],
        [69, 72, 0, 77, 76, 72, 69, 0], [71, 74, 79, 0, 77, 74, 71, 74]],
      [[79, 76, 0, 84, 83, 79, 76, 0], [81, 0, 79, 76, 72, 76, 0, 79],
        [77, 76, 72, 0, 69, 72, 77, 79], [79, 0, 77, 74, 71, 74, 0, 72]],
    ],
    kicks: [0, 2, 4, 6], bass: [0, 3, 4, 7], lead: "triangle", arpeggio: "sine", snareNote: 50,
  },
  {
    name: "Caramel disco", bpm: 124,
    roots: [41, 38, 46, 36],
    chords: [[57, 60, 65], [57, 62, 65], [58, 62, 65], [55, 60, 64]],
    themes: [
      [[77, 0, 81, 0, 84, 81, 79, 77], [74, 77, 0, 81, 79, 0, 77, 74],
        [77, 0, 74, 77, 82, 81, 0, 77], [76, 79, 0, 84, 82, 79, 76, 0]],
      [[84, 81, 77, 0, 81, 84, 0, 86], [86, 84, 81, 77, 0, 74, 77, 81],
        [82, 0, 81, 77, 74, 77, 0, 81], [79, 76, 72, 0, 76, 79, 0, 77]],
    ],
    kicks: [0, 2, 4, 6], bass: [0, 2, 3, 5, 6, 7], lead: "triangle", arpeggio: "triangle", snareNote: 53,
  },
  {
    name: "Jacuzzi néon", bpm: 128,
    roots: [38, 35, 43, 45],
    chords: [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]],
    themes: [
      [[78, 81, 0, 86, 81, 78, 0, 76], [78, 0, 74, 78, 83, 81, 78, 0],
        [79, 78, 74, 0, 71, 74, 79, 0], [76, 81, 0, 85, 83, 81, 76, 73]],
      [[86, 0, 81, 78, 81, 86, 88, 86], [83, 81, 78, 0, 74, 78, 81, 83],
        [86, 83, 79, 78, 0, 74, 79, 83], [85, 83, 81, 0, 76, 73, 0, 74]],
    ],
    kicks: [0, 2, 4, 7], bass: [0, 1, 4, 6, 7], lead: "triangle", arpeggio: "sine", snareNote: 54,
  },
  {
    name: "Goûter tropical", bpm: 114,
    roots: [43, 40, 36, 38],
    chords: [[55, 59, 62], [55, 59, 64], [55, 60, 64], [54, 57, 62]],
    themes: [
      [[79, 0, 83, 81, 79, 0, 74, 0], [76, 79, 0, 83, 81, 79, 0, 76],
        [76, 0, 79, 84, 83, 79, 76, 0], [78, 0, 81, 78, 74, 76, 78, 0]],
      [[83, 79, 0, 86, 83, 81, 79, 0], [83, 0, 81, 79, 76, 79, 0, 83],
        [84, 83, 79, 0, 76, 79, 84, 83], [81, 78, 74, 0, 78, 81, 0, 79]],
    ],
    kicks: [0, 3, 4, 6], bass: [0, 3, 4, 7], lead: "sine", arpeggio: "triangle", snareNote: 55,
  },
];

export const COOKIE_MUSIC_TRACKS = TRACKS.map(track => ({
  name: track.name,
  bpm: track.bpm,
  secondsPerRotation: 60 / track.bpm * 64 * LOOPS_PER_TRACK,
}));

const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export async function createCookieMusic(volume = 0.3, onTrack?: (name: string) => void): Promise<CookieMusic> {
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
  echo.delayTime.value = 60 / TRACKS[0].bpm / 2 * 1.5;
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
  let trackIndex = 0;
  let completedLoops = 0;
  let announcedTrack = -1;
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

  function percussion(time: number, snare: boolean, accent = false, snareNote = 50) {
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
    if (snare) tone(snareNote, time, 0.075, 0.035, "triangle");
  }

  function schedule(index: number, time: number, song: Track, stepDuration: number) {
    const bar = Math.floor(index / 8);
    const beat = index % 8;
    const chord = bar % 4;
    const section = Math.floor(bar / 4);
    // Each 16-bar loop has a lighter third phrase and a final lift.
    const breakdown = section === 2;
    if (song.kicks.includes(beat) && (!breakdown || beat === 0 || beat === 4)) kick(time);
    if (beat === 2 || beat === 6) percussion(time, true, false, song.snareNote);
    if (!breakdown || beat % 2 === 1) percussion(time, false, beat % 2 === 1);
    if (song.bass.includes(beat)) {
      tone(song.roots[chord] + (beat === 7 ? 12 : 0), time,
        stepDuration * (beat === 0 ? 1.7 : 0.7), 0.105, "triangle");
    }
    if (beat % 2 === 1) {
      const arpeggio = song.chords[chord][Math.floor(beat / 2) % 3] + 12;
      tone(arpeggio, time, stepDuration * 0.62, breakdown ? 0.018 : 0.026, song.arpeggio, true);
    }
    if (beat === 0) song.chords[chord].forEach(note => tone(note, time, stepDuration * 6.8, 0.016, "sine"));
    const lead = song.themes[section % 2][chord][beat];
    if (lead && (!breakdown || beat < 4)) {
      tone(lead, time, stepDuration * 0.78, 0.056, song.lead, true);
      if (section === 3 && beat % 2 === 0) tone(lead - 12, time, stepDuration * 0.6, 0.014, "square");
    }
    if (bar % 4 === 3 && beat === 7 && !breakdown) {
      percussion(time + stepDuration / 2, true, false, song.snareNote);
    }
  }

  function tick() {
    if (stopped || !playing) return;
    // Never catch up with a burst after timer throttling. Only scheduled music
    // advances the rotation; wall-clock time spent paused is never counted.
    if (nextTime < context.currentTime) nextTime = context.currentTime + 0.025;
    while (nextTime < context.currentTime + LOOKAHEAD) {
      if (step === 0 && completedLoops === LOOPS_PER_TRACK) {
        trackIndex = (trackIndex + 1) % TRACKS.length;
        completedLoops = 0;
      }
      const song = TRACKS[trackIndex];
      const stepDuration = 60 / song.bpm / 2;
      if (announcedTrack !== trackIndex) {
        announcedTrack = trackIndex;
        // Gentle tempo adjustment preserves the echo tail across track changes.
        echo.delayTime.setTargetAtTime(stepDuration * 1.5, nextTime, 0.08);
        try { onTrack?.(song.name); } catch { /* UI callbacks cannot interrupt audio. */ }
      }
      if (stopped || !playing) return;
      schedule(step, nextTime, song, stepDuration);
      nextTime += stepDuration;
      step++;
      if (step === STEPS_PER_LOOP) {
        step = 0;
        completedLoops++;
      }
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
