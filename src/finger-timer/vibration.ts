/**
 * Haptic feedback utilities using Vibration API.
 */

/**
 * Check if vibration is supported.
 */
export function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Continuous gentle vibration while holding (subtle pulse).
 * Returns stop function.
 */
export function startHoldingVibration(): () => void {
  if (!isVibrationSupported()) return () => {};
  
  let active = true;
  
  const vibrate = () => {
    if (!active) return;
    // * Gentle pulse: 20ms vibration every 500ms
    navigator.vibrate([20, 480]);
    setTimeout(vibrate, 500);
  };
  
  vibrate();
  
  return () => {
    active = false;
    navigator.vibrate(0);
  };
}

/**
 * Stop all vibration.
 */
export function stopVibration(): void {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
}

/**
 * Jump scare vibration (strong shake pattern).
 */
export function jumpScareVibration(): void {
  if (!isVibrationSupported()) return;
  
  // * Intense pattern: strong bursts simulating shock
  navigator.vibrate([
    100, 50,  // * Initial shock
    100, 50,  // * Double shock
    150, 100, // * Sustained shake
    100, 50,
    80,
  ]);
}

/**
 * Success vibration (perfect score).
 */
export function perfectScoreVibration(): void {
  if (!isVibrationSupported()) return;
  
  // * Celebratory pattern
  navigator.vibrate([
    30, 30,
    30, 30,
    30, 30,
    200,
  ]);
}

/**
 * Light tap vibration (button press, notification).
 */
export function tapVibration(): void {
  if (!isVibrationSupported()) return;
  
  navigator.vibrate(10);
}
