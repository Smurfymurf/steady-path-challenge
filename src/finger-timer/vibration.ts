/**
 * Haptic feedback across browsers.
 *
 * ! There is no single API that works everywhere:
 * ! - Android Chromium / Samsung Internet: navigator.vibrate, full patterns.
 * ! - iOS (all browsers are WebKit): navigator.vibrate has never been
 * !   implemented and silently returns false. The only web haptic path is a
 * !   native `<input type="checkbox" switch>` control, which plays a system
 * !   tick when the user's finger DIRECTLY taps it. Since iOS 26.5 a
 * !   programmatic .click() no longer fires it, so it cannot be driven from
 * !   script and cannot produce sustained or patterned feedback.
 * ! - Firefox: removed in 129; Android build has produced no haptic since 79.
 * ! - Desktop: no hardware.
 *
 * Callers should treat every function here as best-effort.
 */

/**
 * True when navigator.vibrate is present AND functional.
 *
 * ! A plain `'vibrate' in navigator` check is not enough: the method exists on
 * ! some engines that never vibrate. Calling it with 0 is a no-op that returns
 * ! true only where the API actually works.
 */
export function isVibrationSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    return navigator.vibrate(0);
  } catch {
    return false;
  }
}

function vibrate(pattern: number | number[]): boolean {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Stop any in-progress vibration.
 */
export function stopVibration(): void {
  vibrate(0);
}

/**
 * Pulse steadily while the circle is held.
 *
 * * Re-armed on an interval because a single long pattern cannot be extended,
 * * and the hold has no known end time. Returns a stop function.
 */
export function startHoldingVibration(): () => void {
  if (!isVibrationSupported()) {
    return () => {};
  }

  // * A firm thump on contact, then a regular heartbeat. 20ms was too faint to
  // * register through a case, so the pulse carries more weight.
  vibrate(45);

  const interval = setInterval(() => {
    vibrate(28);
  }, 850);

  return () => {
    clearInterval(interval);
    stopVibration();
  };
}

/**
 * Violent burst for a jump scare.
 */
export function jumpScareVibration(): void {
  vibrate([0, 120, 45, 120, 45, 200, 70, 140, 50, 110]);
}

/**
 * Celebratory run for a near-perfect result.
 */
export function perfectScoreVibration(): void {
  vibrate([0, 40, 60, 40, 60, 40, 60, 260]);
}

/**
 * Light tick for button presses.
 */
export function tapVibration(): void {
  vibrate(18);
}
