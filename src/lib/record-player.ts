/**
 * Plays the shop's records: real audio files from /public/music, shuffled into a loop, with
 * turntable behaviour on top — spin-up and wind-down, surface crackle, and scratching where
 * the music follows the hand on the record.
 *
 * Tracks are from Pixabay Music (Pixabay Content License: free for commercial use, no
 * attribution required). Browser-only: create it lazily from a user gesture.
 */

export interface Track {
  src: string;
  title: string;
  artist: string;
}

// The first track always opens the set; the rest are shuffled.
export const TRACKS: Track[] = [
  { src: "/music/snatch.mp3", title: "Snatch", artist: "Octosound" },
  {
    src: "/music/underground-organ-rock.mp3",
    title: "60s Underground Organ Rock",
    artist: "Juliush",
  },
  { src: "/music/slow-mo.mp3", title: "Slow Mo", artist: "OrbitalGhost" },
];

// Degrees the platter turns per animation frame at 33⅓ rpm and 60 fps.
const NORMAL_DEG_PER_FRAME = ((100 / 3) * 360) / 60 / 60;

export class RecordPlayer {
  private ctx: AudioContext;
  private audio: HTMLAudioElement;
  private music: GainNode;
  private scratchGain: GainNode;
  private scratchFilter: BiquadFilterNode;
  private order: number[];
  private position = 0;
  private _playing = false;
  private held = false;
  private rateTimer: ReturnType<typeof setInterval> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  /** Called whenever a new track is loaded. */
  onTrackChange: ((track: Track) => void) | null = null;

  constructor() {
    this.ctx = new AudioContext();
    const ctx = this.ctx;

    this.audio = new Audio();
    this.audio.preload = "auto";
    // Let speed changes bend the pitch, as on a real turntable.
    this.audio.preservesPitch = false;
    this.audio.addEventListener("ended", () => this.next());

    // Record → needle gain → a touch of vinyl warmth → speakers.
    this.music = ctx.createGain();
    this.music.gain.value = 0;
    const warmth = ctx.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 12000;
    ctx.createMediaElementSource(this.audio).connect(this.music).connect(warmth);
    warmth.connect(ctx.destination);

    // Surface noise rides under the needle, so it fades with the music.
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuffer(ctx, 4);
    crackle.loop = true;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.35;
    crackle.connect(crackleGain).connect(this.music);
    crackle.start();

    // Scratch noise: the stylus dragged across the groove.
    const noise = ctx.createBufferSource();
    noise.buffer = whiteNoise(ctx, 2);
    noise.loop = true;
    this.scratchFilter = ctx.createBiquadFilter();
    this.scratchFilter.type = "bandpass";
    this.scratchFilter.Q.value = 2.5;
    this.scratchGain = ctx.createGain();
    this.scratchGain.gain.value = 0;
    noise.connect(this.scratchFilter).connect(this.scratchGain).connect(ctx.destination);
    noise.start();

    this.order = [0, ...shuffle(TRACKS.map((_, i) => i).slice(1))];
    this.load();
  }

  get track(): Track {
    return TRACKS[this.order[this.position]!]!;
  }

  get playing() {
    return this._playing;
  }

  async start() {
    if (this._playing) return;
    this._playing = true;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    await this.ctx.resume();
    // Spin up: the record starts slow and low and comes up to speed.
    this.audio.playbackRate = 0.6;
    await this.audio.play();
    this.fadeTo(1, 0.6);
    this.rampRate(1, 900);
  }

  stop() {
    if (!this._playing) return;
    this._playing = false;
    // Wind down: pitch sags as the platter slows, then the needle lifts.
    this.rampRate(0.5, 700);
    this.fadeTo(0, 0.7);
    this.stopTimer = setTimeout(() => {
      this.audio.pause();
      this.audio.playbackRate = 1;
    }, 750);
  }

  next() {
    this.position = (this.position + 1) % this.order.length;
    if (this.position === 0) this.order = shuffle(this.order);
    this.load();
    if (this._playing) void this.audio.play();
  }

  /** Hand on the record: the music stops until the record moves again. */
  hold(held: boolean) {
    if (!this._playing) return;
    this.held = held;
    if (this.rateTimer) clearInterval(this.rateTimer);
    if (held) {
      this.fadeTo(0, 0.03);
    } else {
      this.scratch(0);
      this.audio.playbackRate = 1;
      this.fadeTo(1, 0.15);
    }
  }

  /** While held, play the record at the speed the hand turns it (degrees per frame). */
  scratch(speed: number) {
    const now = this.ctx.currentTime;
    const amount = Math.min(Math.abs(speed) / 25, 1);
    this.scratchGain.gain.setTargetAtTime(amount * 0.25, now, 0.02);
    this.scratchFilter.frequency.setTargetAtTime(500 + amount * 2500, now, 0.02);
    if (!this.held) return;
    const rate = Math.abs(speed) / NORMAL_DEG_PER_FRAME;
    if (rate < 0.15) {
      this.music.gain.setTargetAtTime(0, now, 0.02);
      return;
    }
    this.audio.playbackRate = Math.min(Math.max(rate, 0.25), 3);
    this.music.gain.setTargetAtTime(Math.min(1, rate), now, 0.02);
  }

  private load() {
    this.audio.src = this.track.src;
    this.onTrackChange?.(this.track);
  }

  private fadeTo(level: number, seconds: number) {
    const now = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setValueAtTime(this.music.gain.value, now);
    this.music.gain.linearRampToValueAtTime(level, now + seconds);
  }

  /** playbackRate isn't an AudioParam, so step it towards `target` on a timer. */
  private rampRate(target: number, ms: number) {
    if (this.rateTimer) clearInterval(this.rateTimer);
    const from = this.audio.playbackRate;
    const started = performance.now();
    this.rateTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / ms);
      this.audio.playbackRate = from + (target - from) * (1 - (1 - p) ** 2);
      if (p === 1 && this.rateTimer) {
        clearInterval(this.rateTimer);
        this.rateTimer = null;
      }
    }, 30);
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function whiteNoise(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function crackleBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    let v = (Math.random() * 2 - 1) * 0.005; // hiss
    if (Math.random() < 0.0003) v += (Math.random() * 2 - 1) * 0.4; // pop
    data[i] = v;
  }
  return buffer;
}

let player: RecordPlayer | null = null;

/** The shared player; call only from a user gesture in the browser. */
export function getRecordPlayer() {
  player ??= new RecordPlayer();
  return player;
}
