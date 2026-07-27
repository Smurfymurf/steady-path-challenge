import { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelConfig } from '../config/offers';
import { playSfx } from '../game/sound';
import { MenuBackdrop } from './MenuBackdrop';
import styles from './SpinWheel.module.css';

interface SpinWheelProps {
  wheel: WheelConfig;
  onClose: () => void;
}

export function SpinWheel({ wheel, onClose }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const tickTimer = useRef<number | null>(null);

  const segmentAngle = 360 / Math.max(1, wheel.offers.length);

  const gradient = useMemo(() => {
    if (wheel.offers.length === 0) {
      return 'conic-gradient(#ff3d7f, #ffc107)';
    }
    // * 0deg = top (under the pointer). Angles increase clockwise.
    const stops = wheel.offers.map((offer, index) => {
      const start = index * segmentAngle;
      const end = start + segmentAngle;
      return `${offer.colour} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from 0deg, ${stops.join(', ')})`;
  }, [segmentAngle, wheel.offers]);

  useEffect(() => () => {
    if (tickTimer.current != null) {
      window.clearInterval(tickTimer.current);
    }
  }, []);

  const handleSpin = () => {
    if (spinning || wheel.offers.length === 0) {
      return;
    }

    playSfx('spinStart');
    const index = Math.floor(Math.random() * wheel.offers.length);
    const spins = 5 + Math.floor(Math.random() * 3);
    const target = spins * 360 + (360 - (index * segmentAngle + segmentAngle / 2));
    setSpinning(true);
    setResultIndex(null);
    setRotation((current) => current + target);

    if (tickTimer.current != null) {
      window.clearInterval(tickTimer.current);
    }
    let ticks = 0;
    tickTimer.current = window.setInterval(() => {
      playSfx('tick');
      ticks += 1;
      if (ticks > 28) {
        if (tickTimer.current != null) {
          window.clearInterval(tickTimer.current);
          tickTimer.current = null;
        }
      }
    }, 120);

    window.setTimeout(() => {
      if (tickTimer.current != null) {
        window.clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
      setSpinning(false);
      setResultIndex(index);
      playSfx('win');
    }, 4200);
  };

  const selected = resultIndex === null ? null : wheel.offers[resultIndex];

  return (
    <main className={styles.screen}>
      <MenuBackdrop />

      <div className={styles.content}>
        <p className={styles.eyebrow}>Bonus round</p>
        <h1 className={styles.title}>Spin to Win!</h1>
        <p className={styles.subtitle}>
          One spin. One mystery prize. Don’t leave empty-handed.
        </p>

        <div className={styles.stage}>
          <div className={styles.pointer} aria-hidden="true" />
          <div
            className={`${styles.wheel} ${spinning ? styles.wheelSpinning : ''}`}
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {wheel.offers.map((offer, index) => {
              // * Arm points to segment center; badge counter-spins with the wheel so text stays upright.
              const midAngle = index * segmentAngle + segmentAngle / 2;
              return (
                <span
                  key={offer.id}
                  className={styles.labelArm}
                  style={{
                    transform: `rotate(${midAngle}deg)`,
                  }}
                >
                  <span
                    className={styles.labelBadge}
                    style={{
                      transform: `rotate(${-(rotation + midAngle)}deg)`,
                    }}
                  >
                    {offer.label}
                  </span>
                </span>
              );
            })}
          </div>
          <div className={styles.hub} aria-hidden="true">★</div>
        </div>

        {selected ? (
          <div className={styles.result}>
            <p className={styles.resultEyebrow}>You won</p>
            <p className={styles.resultTitle}>{selected.label}</p>
            <a
              className={styles.claimButton}
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => playSfx('claim')}
            >
              <span className={styles.claimShine} aria-hidden="true" />
              <span className={styles.claimLabel}>Claim Your Prize!</span>
            </a>
            <p className={styles.resultHint}>Tap now before this spin resets</p>
          </div>
        ) : (
          <button
            type="button"
            className={styles.spinButton}
            onClick={handleSpin}
            disabled={spinning || wheel.offers.length === 0}
          >
            <span className={styles.spinShine} aria-hidden="true" />
            {spinning ? 'Spinning…' : 'SPIN NOW'}
          </button>
        )}

        <button
          type="button"
          className={styles.backButton}
          onClick={() => {
            playSfx('tap');
            onClose();
          }}
        >
          Back
        </button>
      </div>
    </main>
  );
}
