/**
 * Immersive background effects while holding the circle.
 * Creates visual connection between user and screen.
 */

import { useEffect, useState } from 'react';
import styles from './HoldingEffects.module.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export function HoldingEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    // * Generate particles that emanate from center
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      angle: (i * 360) / 12,
      speed: 0.5 + Math.random() * 0.5,
    }));
    
    setParticles(newParticles);
  }, []);
  
  return (
    <div className={styles.container}>
      {/* Radial pulses */}
      <div className={styles.radialPulse1} />
      <div className={styles.radialPulse2} />
      <div className={styles.radialPulse3} />
      
      {/* Gradient overlay */}
      <div className={styles.gradientShift} />
      
      {/* Connection particles */}
      <div className={styles.particles}>
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              '--angle': `${p.angle}deg`,
              '--speed': `${p.speed}`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Connection lines */}
      <svg className={styles.connectionLines} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(102, 126, 234, 0)" />
            <stop offset="50%" stopColor="rgba(102, 126, 234, 0.4)" />
            <stop offset="100%" stopColor="rgba(102, 126, 234, 0)" />
          </linearGradient>
        </defs>
        
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 360) / 8;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 40;
          const y = 50 + Math.sin(rad) * 40;
          
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="url(#lineGradient)"
              strokeWidth="0.5"
              className={styles.connectionLine}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          );
        })}
      </svg>
      
      {/* Vignette */}
      <div className={styles.vignette} />
    </div>
  );
}
