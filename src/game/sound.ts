/**
 * Tiny Web Audio synth for UI blips, plus jump-scare scream samples.
 */

export type SfxName =
  | 'tap'
  | 'pop'
  | 'whoosh'
  | 'success'
  | 'go'
  | 'tick'
  | 'fail'
  | 'toggle'
  | 'score'
  | 'spinStart'
  | 'win'
  | 'claim';

let enabled = true;
let audioCtx: AudioContext | null = null;
let screamAudio: HTMLAudioElement | null = null;

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  if (!next) {
    stopScream();
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Stop any playing jump-scare scream. */
export function stopScream(): void {
  if (!screamAudio) {
    return;
  }
  screamAudio.pause();
  screamAudio.currentTime = 0;
  screamAudio = null;
}

/**
 * Play a jump-scare scream from public assets.
 * Uses HTMLAudio so long samples work without decoding in Web Audio.
 */
export function playScream(src: string): void {
  if (!enabled) {
    return;
  }
  stopScream();
  getCtx();
  const audio = new Audio(src);
  audio.volume = 1;
  screamAudio = audio;
  void audio.play().catch(() => {
    // * Autoplay may be blocked until a gesture; wall hits always follow a gesture.
  });
}

/** Play a short UI sound effect if sound is enabled. */
export function playSfx(name: SfxName): void {
  if (!enabled) {
    return;
  }
  const ctx = getCtx();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;

  switch (name) {
    case 'tap':
      tone(ctx, 520, now, 0.07, 'triangle', 0.08);
      break;
    case 'toggle':
      tone(ctx, 440, now, 0.06, 'square', 0.04);
      tone(ctx, 660, now + 0.05, 0.07, 'square', 0.04);
      break;
    case 'pop':
      tone(ctx, 320, now, 0.09, 'sine', 0.09);
      tone(ctx, 540, now + 0.04, 0.1, 'sine', 0.07);
      break;
    case 'tick':
      tone(ctx, 880, now, 0.05, 'triangle', 0.06);
      break;
    case 'whoosh': {
      const bufferSize = ctx.sampleRate * 0.22;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.24);
      break;
    }
    case 'go':
      tone(ctx, 392, now, 0.1, 'triangle', 0.09);
      tone(ctx, 523, now + 0.08, 0.11, 'triangle', 0.09);
      tone(ctx, 659, now + 0.16, 0.14, 'triangle', 0.1);
      break;
    case 'success':
      tone(ctx, 523, now, 0.1, 'sine', 0.08);
      tone(ctx, 659, now + 0.09, 0.1, 'sine', 0.08);
      tone(ctx, 784, now + 0.18, 0.16, 'sine', 0.09);
      break;
    case 'score':
      tone(ctx, 600, now, 0.06, 'triangle', 0.05);
      tone(ctx, 760, now + 0.05, 0.08, 'triangle', 0.05);
      break;
    case 'fail':
      tone(ctx, 220, now, 0.14, 'sawtooth', 0.05);
      tone(ctx, 165, now + 0.08, 0.18, 'sawtooth', 0.04);
      break;
    case 'spinStart':
      tone(ctx, 280, now, 0.08, 'triangle', 0.07);
      tone(ctx, 420, now + 0.06, 0.1, 'triangle', 0.08);
      tone(ctx, 560, now + 0.12, 0.12, 'triangle', 0.09);
      break;
    case 'win':
      tone(ctx, 523, now, 0.1, 'sine', 0.1);
      tone(ctx, 659, now + 0.08, 0.1, 'sine', 0.1);
      tone(ctx, 784, now + 0.16, 0.12, 'sine', 0.11);
      tone(ctx, 1046, now + 0.28, 0.18, 'sine', 0.1);
      break;
    case 'claim':
      tone(ctx, 660, now, 0.08, 'square', 0.06);
      tone(ctx, 880, now + 0.07, 0.1, 'square', 0.07);
      tone(ctx, 1174, now + 0.15, 0.14, 'triangle', 0.08);
      break;
    default:
      break;
  }
}
