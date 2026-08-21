/**
 * Best-effort haptics for pressure moments.
 *
 * Reality check (2024+ browsers):
 * - Chrome/Edge Android: navigator.vibrate works
 * - Firefox (desktop + Android): Vibration API removed / no-op since FF129 — cannot vibrate
 * - iPhone Safari: never supported vibrate — best-effort checkbox[switch] taps
 *   only while a finger gesture is active
 */

let switchInput: HTMLInputElement | null = null;
let gestureAliveUntil = 0;

function isFirefox(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /firefox/i.test(navigator.userAgent);
}

function ensureSwitch(): HTMLInputElement {
  if (switchInput && document.body.contains(switchInput)) {
    return switchInput;
  }
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  input.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:1px',
    'height:1px',
    'opacity:0.01',
    'pointer-events:none',
    'z-index:-1',
    'margin:0',
    'padding:0',
    'border:0',
  ].join(';');
  document.body.appendChild(input);
  switchInput = input;
  return input;
}

/** Call from pointerdown / pointermove while holding so iOS keeps a gesture window. */
export function markHapticGesture(): void {
  gestureAliveUntil = performance.now() + 900;
}

function iosPulse(): void {
  if (performance.now() > gestureAliveUntil) {
    return;
  }
  try {
    const input = ensureSwitch();
    input.checked = !input.checked;
    // * Switching a checkbox[switch] is what triggers Taptic on recent iOS.
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } catch {
    // ignore
  }
}

function supportsVibrateApi(): boolean {
  // * Firefox still may expose the function in old builds, but haptics are dead.
  if (isFirefox()) {
    return false;
  }
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Single short tick (stage bumps, bleed growth). */
export function hapticTick(): void {
  if (supportsVibrateApi()) {
    navigator.vibrate(12);
    return;
  }
  iosPulse();
}

/** Stronger pulse (harder stages / crack start). */
export function hapticBump(): void {
  if (supportsVibrateApi()) {
    navigator.vibrate(28);
    return;
  }
  iosPulse();
  window.setTimeout(() => iosPulse(), 40);
}

/** Scare / climax pattern — Android Chrome only in practice. */
export function hapticScare(): void {
  if (supportsVibrateApi()) {
    navigator.vibrate([40, 30, 80, 40, 120]);
    return;
  }
  iosPulse();
  window.setTimeout(() => iosPulse(), 50);
  window.setTimeout(() => iosPulse(), 120);
  window.setTimeout(() => iosPulse(), 200);
}

export function hapticStop(): void {
  if (supportsVibrateApi()) {
    navigator.vibrate(0);
  }
}
