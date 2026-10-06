/**
 * iOS haptic detection and shared identifiers.
 *
 * ! iOS has no web vibration API. WebKit's native switch control is the only
 * ! way a web page can play a system haptic: toggling it makes iOS emit a
 * ! tick, so a real switch is laid invisibly over the tap target and the
 * ! player's finger toggles it directly.
 * !
 * ! Hard limits, all imposed by WebKit:
 * ! - Direct taps only. Since iOS 26.5 a programmatic .click() does nothing,
 * !   so this cannot be fired from script.
 * ! - One system tick. Custom or sustained patterns are impossible.
 * ! - The control must keep its native appearance; overriding `appearance`
 * !   disables the haptic.
 */

/**
 * Identifies the overlay so pointer handlers can leave its activation intact.
 */
export const IOS_HAPTIC_ATTRIBUTE = 'data-ios-haptic';

/**
 * True on Apple touch devices whose WebKit exposes the switch control.
 */
export function supportsIosSwitchHaptic(): boolean {
  if (typeof navigator === 'undefined' || typeof HTMLInputElement === 'undefined') {
    return false;
  }

  // * iPadOS reports a Mac user agent, so touch points disambiguate it.
  const ua = navigator.userAgent;
  const isAppleTouch =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  return isAppleTouch && 'switch' in HTMLInputElement.prototype;
}
