/**
 * Settings overlay for game configuration.
 */

import { useState, useEffect } from 'react';
import type { GameConfig } from '../types';
import { getGameConfig, saveGameConfig } from '../storage';
import styles from './Settings.module.css';

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function Settings({ visible, onClose }: SettingsProps) {
  const [config, setConfig] = useState<GameConfig>(getGameConfig());
  
  useEffect(() => {
    if (visible) {
      setConfig(getGameConfig());
    }
  }, [visible]);
  
  const handleToggle = (key: keyof GameConfig, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    saveGameConfig(newConfig);
  };
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        
        <div className={styles.settings}>
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Sound Effects</div>
              <div className={styles.settingDesc}>
                Enable audio for distractions
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={e => handleToggle('soundEnabled', e.target.checked)}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
          
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Intense Scares</div>
              <div className={styles.settingDesc}>
                Enable jump scare distractions
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.jumpScaresEnabled}
                onChange={e => handleToggle('jumpScaresEnabled', e.target.checked)}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
          
          <div className={styles.info}>
            <p className={styles.infoText}>
              Jump scare probability: 5-25% depending on duration
            </p>
            <p className={styles.infoText}>
              {config.respectReducedMotion && 'Reduced motion detected: some animations disabled'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
