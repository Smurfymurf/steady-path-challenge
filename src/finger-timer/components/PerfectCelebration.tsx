/**
 * Epic mental celebration for near-perfect timing.
 * Triggers when error <= 0.050s (or exactly 0.000s).
 */

import { useEffect, useState } from 'react';
import { perfectScoreVibration } from '../vibration';
import styles from './PerfectCelebration.module.css';

interface PerfectCelebrationProps {
  errorSeconds: number;
  targetSeconds: number;
}

export function PerfectCelebration({ errorSeconds, targetSeconds }: PerfectCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showGlow, setShowGlow] = useState(false);
  
  const isAbsolutePerfection = errorSeconds === 0;
  const isNearPerfect = errorSeconds <= 0.050;
  
  useEffect(() => {
    if (!isNearPerfect) return;
    
    // * Particle explosion
    const particleArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(particleArray);
    
    // * Glow sequence
    setTimeout(() => setShowGlow(true), 200);
    
    // * Perfect score vibration
    perfectScoreVibration();
    
    // * Audio celebration (if available)
    try {
      const audio = new Audio('/sounds/perfect.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // * Silent fail
    }
  }, [isNearPerfect]);
  
  if (!isNearPerfect) return null;
  
  return (
    <div className={styles.celebrationOverlay}>
      {/* Strobe flash */}
      <div className={styles.strobeFlash} />
      
      {/* Screen shake container */}
      <div className={styles.shakeContainer}>
        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${Math.random() * 0.3}s`,
            }}
          />
        ))}
        
        {/* Main celebration message */}
        <div className={styles.celebrationContent}>
          {isAbsolutePerfection ? (
            <>
              <div className={styles.godTitle}>ABSOLUTE</div>
              <div className={styles.godTitle}>PERFECTION</div>
              <div className={styles.godSubtitle}>0.000 SECONDS</div>
              <div className={styles.godDescription}>
                You are a literal timing god
              </div>
            </>
          ) : (
            <>
              <div className={styles.perfectTitle}>INSANE</div>
              <div className={styles.perfectScore}>
                {errorSeconds.toFixed(3)}s error
              </div>
              <div className={styles.perfectSubtitle}>
                That's {targetSeconds} seconds with {(errorSeconds * 1000).toFixed(0)}ms precision
              </div>
              <div className={styles.perfectDescription}>
                Screenshot this immediately
              </div>
            </>
          )}
        </div>
        
        {/* Radial glow */}
        {showGlow && <div className={styles.radialGlow} />}
        
        {/* Corner explosions */}
        <div className={styles.cornerExplosion} style={{ top: 0, left: 0 }} />
        <div className={styles.cornerExplosion} style={{ top: 0, right: 0 }} />
        <div className={styles.cornerExplosion} style={{ bottom: 0, left: 0 }} />
        <div className={styles.cornerExplosion} style={{ bottom: 0, right: 0 }} />
      </div>
    </div>
  );
}
