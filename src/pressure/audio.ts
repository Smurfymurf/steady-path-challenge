/**
 * Placeholder glass / stress SFX for the pressure illusion (Web Audio).
 */

let audioCtx: AudioContext | null = null;
let enabled = true;

export function setPressureAudioEnabled(next: boolean): void {
  enabled = next;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioCtx =
    window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

/** Unlock audio on first user gesture. */
export function unlockPressureAudio(): void {
  getCtx();
}

function noiseBurst(
  ctx: AudioContext,
  start: number,
  duration: number,
  gainPeak: number,
  bandHz: number,
): void {
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = bandHz;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(start);
  src.stop(start + duration + 0.02);
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
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export type PressureSfx = 'tick' | 'creak' | 'crack' | 'warning';

export function playPressureSfx(name: PressureSfx): void {
  if (!enabled) {
    return;
  }
  const ctx = getCtx();
  if (!ctx) {
    return;
  }
  const now = ctx.currentTime;

  switch (name) {
    case 'tick':
      noiseBurst(ctx, now, 0.04, 0.045, 4200);
      tone(ctx, 2100, now, 0.03, 'triangle', 0.03);
      break;
    case 'creak':
      tone(ctx, 180, now, 0.18, 'sawtooth', 0.025);
      tone(ctx, 95, now + 0.04, 0.22, 'sine', 0.03);
      noiseBurst(ctx, now, 0.2, 0.02, 600);
      break;
    case 'crack':
      noiseBurst(ctx, now, 0.08, 0.07, 2800);
      tone(ctx, 900, now, 0.05, 'square', 0.02);
      break;
    case 'warning':
      tone(ctx, 660, now, 0.12, 'square', 0.04);
      tone(ctx, 520, now + 0.14, 0.14, 'square', 0.035);
      break;
    default:
      break;
  }
}
