/**
 * Invisible native switch that lets iOS play a system haptic tick on tap.
 * See ../iosHaptics for why this control is required and its limits.
 */

import { IOS_HAPTIC_ATTRIBUTE, supportsIosSwitchHaptic } from '../iosHaptics';
import styles from './IosHapticTarget.module.css';

export function IosHapticTarget() {
  if (!supportsIosSwitchHaptic()) {
    return null;
  }

  return (
    <input
      type="checkbox"
      // * WebKit-only attribute; absent from React's prop types.
      {...{ switch: '' }}
      {...{ [IOS_HAPTIC_ATTRIBUTE]: '' }}
      className={styles.hapticSwitch}
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
