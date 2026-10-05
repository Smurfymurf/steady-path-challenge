/**
 * Individual distraction event components.
 */

import { useEffect, useState } from 'react';
import styles from './Distractions.module.css';

export function FakeBattery() {
  return (
    <div className={styles.fakeBattery}>
      <div className={styles.batteryIcon}>
        <div className={styles.batteryLevel} style={{ width: '1%' }} />
      </div>
      <span className={styles.batteryText}>BATTERY 1%</span>
    </div>
  );
}

export function Pigeon() {
  return (
    <div className={styles.pigeon}>
      <div className={styles.pigeonWalk}>
        <div className={styles.pigeonEmoji}>🐦</div>
      </div>
      <p className={styles.distractionText}>Do not acknowledge the pigeon.</p>
    </div>
  );
}

export function ScreenShake() {
  return <div className={styles.screenShake} />;
}

export function WrongCountdown() {
  const [count, setCount] = useState(5);
  
  useEffect(() => {
    const numbers = [5, 4, 3, 2, 17, 42];
    let index = 0;
    
    const timer = setInterval(() => {
      index += 1;
      if (index < numbers.length) {
        setCount(numbers[index]!);
      }
    }, 600);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={styles.wrongCountdown}>
      <div className={styles.countdownNumber}>{count}</div>
    </div>
  );
}

export function MotivationalCoach() {
  return (
    <div className={styles.motivationalCoach}>
      <p className={styles.coachText}>
        You are doing incredibly well at touching a screen.
      </p>
    </div>
  );
}

export function FingerInspection() {
  const [phase, setPhase] = useState<'scanning' | 'result'>('scanning');
  
  useEffect(() => {
    const timer = setTimeout(() => setPhase('result'), 1800);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.fingerInspection}>
      {phase === 'scanning' && (
        <>
          <div className={styles.scanningRing} />
          <p className={styles.inspectionText}>Analysing finger...</p>
        </>
      )}
      {phase === 'result' && (
        <p className={styles.inspectionResult}>Finger: acceptable</p>
      )}
    </div>
  );
}

export function FakeAchievement() {
  return (
    <div className={styles.fakeAchievement}>
      <div className={styles.achievementIcon}>🏆</div>
      <div className={styles.achievementText}>
        <div className={styles.achievementTitle}>Achievement unlocked</div>
        <div className={styles.achievementDesc}>Still touching it</div>
      </div>
    </div>
  );
}

export function EmergencyQuestion() {
  return (
    <div className={styles.emergencyQuestion}>
      <div className={styles.questionHeader}>QUICK</div>
      <div className={styles.questionBody}>
        How many giraffes could fit inside a Tesco?
      </div>
      <div className={styles.fakeButtons}>
        <button type="button" className={styles.fakeButton}>12</button>
        <button type="button" className={styles.fakeButton}>147</button>
        <button type="button" className={styles.fakeButton}>WHO KNOWS</button>
      </div>
    </div>
  );
}

export function Mosquito() {
  return (
    <div className={styles.mosquito}>
      <div className={styles.mosquitoFly}>🦟</div>
    </div>
  );
}

export function Spider() {
  return (
    <div className={styles.spider}>
      <div className={styles.spiderWalk}>🕷️</div>
      <p className={styles.distractionText}>Don't mind me</p>
    </div>
  );
}

export function FakeCrack() {
  return (
    <div className={styles.fakeCrack}>
      <svg className={styles.crackSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points="50,0 48,20 52,35 45,50 55,70 50,100"
          className={styles.crackLine}
        />
      </svg>
    </div>
  );
}

export function BouncingEmoji() {
  const emojis = ['😂', '🤔', '👀', '🔥', '✨'];
  
  return (
    <div className={styles.bouncingEmoji}>
      {emojis.map((emoji, i) => (
        <div
          key={i}
          className={styles.emoji}
          style={{
            animationDelay: `${i * 0.2}s`,
            left: `${10 + i * 20}%`,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export function UpsideDown() {
  return <div className={styles.upsideDown} />;
}

export function FakeLoading() {
  const [progress, setProgress] = useState(94);
  
  useEffect(() => {
    const sequence = [94, 96, 97, 97, 97];
    let index = 0;
    
    const timer = setInterval(() => {
      index += 1;
      if (index < sequence.length) {
        setProgress(sequence[index]!);
      }
    }, 600);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={styles.fakeLoading}>
      <p className={styles.loadingText}>Processing your finger...</p>
      <div className={styles.loadingBar}>
        <div className={styles.loadingProgress} style={{ width: `${progress}%` }} />
      </div>
      <p className={styles.loadingPercent}>{progress}%</p>
    </div>
  );
}

export function UnhelpfulAdvice() {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setPhase(1), 1800);
    return () => clearTimeout(timer);
  }, []);
  
  const messages = [
    "Try not to think about seconds.",
    "You're thinking about seconds now, aren't you?",
  ];
  
  return (
    <div className={styles.unhelpfulAdvice}>
      <p className={styles.adviceText}>{messages[phase]}</p>
    </div>
  );
}

export function SuspiciousButton() {
  return (
    <div className={styles.suspiciousButton}>
      <button type="button" className={styles.bigRedButton}>
        DO NOT PRESS
      </button>
    </div>
  );
}

export function TinyHorse() {
  return (
    <div className={styles.tinyHorse}>
      <div className={styles.horseGallop}>🐴</div>
    </div>
  );
}

export function Weather() {
  return (
    <div className={styles.weather}>
      <div className={styles.cloud}>☁️</div>
      <div className={styles.rain}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.raindrop}
            style={{ left: `${i * 5}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <p className={styles.weatherText}>Unexpected weather event.</p>
    </div>
  );
}

export function ScreenShrink() {
  return <div className={styles.screenShrink} />;
}

export function FakeCelebration() {
  const [phase, setPhase] = useState<'confetti' | 'nope'>('confetti');
  
  useEffect(() => {
    const timer = setTimeout(() => setPhase('nope'), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.fakeCelebration}>
      {phase === 'confetti' && (
        <>
          <div className={styles.confetti}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={styles.confettiPiece}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][Math.floor(Math.random() * 4)],
                }}
              />
            ))}
          </div>
          <div className={styles.celebrationText}>YOU DID IT!</div>
        </>
      )}
      {phase === 'nope' && (
        <div className={styles.celebrationText}>No you didn't.</div>
      )}
    </div>
  );
}

export function DayNightCycle() {
  return (
    <div className={styles.dayNightCycle}>
      <div className={styles.skyGradient} />
      <div className={styles.sun}>☀️</div>
      <div className={styles.moon}>🌙</div>
    </div>
  );
}

export function FakeTimer() {
  return (
    <div className={styles.fakeTimer}>
      <div className={styles.fakeTimerDisplay}>00:{Math.floor(Math.random() * 60)}</div>
      <p className={styles.timerDisclaimer}>Just kidding.</p>
    </div>
  );
}

export function AnticipationBuildup() {
  return (
    <div className={styles.anticipation}>
      <div className={styles.darkOverlay} />
      <p className={styles.anticipationText}>Something is about to happen.</p>
    </div>
  );
}

export function FalseSafety() {
  return (
    <div className={styles.falseSafety}>
      <p className={styles.safetyText}>Relax. No jump scares this round.</p>
    </div>
  );
}
