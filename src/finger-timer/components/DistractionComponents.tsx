/**
 * Premium distraction components - positioned away from center circle.
 */

import { useEffect, useState } from 'react';
import styles from './Distractions.module.css';

export function FakeBattery() {
  return (
    <div className={styles.fakeBattery}>
      <div className={styles.batteryCard}>
        <div className={styles.batteryIcon}>
          <div className={styles.batteryLevel} />
        </div>
        <span className={styles.batteryText}>BATTERY 1%</span>
      </div>
    </div>
  );
}

export function Pigeon() {
  return (
    <>
      <div className={styles.pigeon}>
        <div className={styles.pigeonEmoji}>🐦</div>
      </div>
      <div className={styles.pigeonCaption}>
        <p className={styles.pigeonText}>Do not acknowledge the pigeon.</p>
      </div>
    </>
  );
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

export function YoureCounting() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>You're counting in your head,</p>
      <p className={styles.tauntSubtext}>aren't you?</p>
    </div>
  );
}

export function StopCounting() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Stop counting.</p>
    </div>
  );
}

export function AlmostThere() {
  return (
    <div className={styles.urgentTaunt}>
      <p className={styles.urgentTextMessage}>ALMOST THERE!</p>
      <p className={styles.urgentSubtext}>...or are you?</p>
    </div>
  );
}

export function WayTooEarly() {
  return (
    <div className={styles.urgentTaunt}>
      <p className={styles.urgentTextMessage}>WAY TOO EARLY</p>
    </div>
  );
}

export function FingerGettingTired() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Your finger is getting tired.</p>
    </div>
  );
}

export function Overthinking() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>You're overthinking this.</p>
    </div>
  );
}

export function FriendDidBetter() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Your friend got 0.032 seconds.</p>
      <p className={styles.tauntSubtext}>Just saying.</p>
    </div>
  );
}

export function ProbablyWrong() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>You're probably way off by now.</p>
    </div>
  );
}

export function TimeParadox() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Did a second just feel longer?</p>
      <p className={styles.tauntSubtext}>Or shorter?</p>
    </div>
  );
}

export function SwipeNotification() {
  return (
    <div className={styles.fakeNotification}>
      <div className={styles.notificationCard}>
        <div className={styles.notificationIcon}>📱</div>
        <div className={styles.notificationContent}>
          <div className={styles.notificationTitle}>New Message</div>
          <div className={styles.notificationBody}>Why are you touching your screen?</div>
        </div>
      </div>
    </div>
  );
}

export function MathProblem() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Quick: What's 17 × 23?</p>
      <p className={styles.tauntSubtext}>Just kidding. Keep holding.</p>
    </div>
  );
}

export function DistractedYet() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Distracted yet?</p>
    </div>
  );
}

export function ReleaseNow() {
  return (
    <div className={styles.urgentCommand}>
      <p className={styles.commandTextMessage}>RELEASE NOW</p>
      <p className={styles.commandSubtext}>(Don't actually)</p>
    </div>
  );
}

export function SecondsFeelLonger() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Seconds feel longer when you're</p>
      <p className={styles.tauntSubtext}>focused on them.</p>
    </div>
  );
}

export function AlreadyFailed() {
  return (
    <div className={styles.urgentTaunt}>
      <p className={styles.urgentTextMessage}>YOU ALREADY FAILED</p>
      <p className={styles.urgentSubtext}>Probably.</p>
    </div>
  );
}

export function ScreenDim() {
  return <div className={styles.screenDim} />;
}

export function FakeFinish() {
  return (
    <div className={styles.fakeFinish}>
      <div className={styles.finishText}>TIME'S UP!</div>
      <div className={styles.finishSubtext}>Just kidding.</div>
    </div>
  );
}

export function TinyHorse() {
  return (
    <div className={styles.tinyHorse}>
      <div className={styles.horseEmoji}>🐴</div>
    </div>
  );
}

export function MotivationalCoach() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>You're doing incredibly well</p>
      <p className={styles.tauntSubtext}>at touching a screen.</p>
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
    <div className={styles.taunt}>
      {phase === 'scanning' ? (
        <p className={styles.tauntText}>Analysing finger...</p>
      ) : (
        <>
          <p className={styles.tauntText}>Finger: acceptable</p>
          <p className={styles.tauntSubtext}>Barely.</p>
        </>
      )}
    </div>
  );
}

export function FakeAchievement() {
  return (
    <div className={styles.fakeNotification}>
      <div className={styles.notificationCard}>
        <div className={styles.notificationIcon}>🏆</div>
        <div className={styles.notificationContent}>
          <div className={styles.notificationTitle}>Achievement Unlocked</div>
          <div className={styles.notificationBody}>Still Touching It</div>
        </div>
      </div>
    </div>
  );
}

export function EmergencyQuestion() {
  return (
    <div className={styles.taunt}>
      <p className={styles.urgentTextMessage}>QUICK</p>
      <p className={styles.tauntText}>How many giraffes could fit</p>
      <p className={styles.tauntSubtext}>inside a Tesco?</p>
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
    { text: "Try not to think about seconds.", sub: "" },
    { text: "You're thinking about seconds now,", sub: "aren't you?" },
  ];
  
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>{messages[phase]!.text}</p>
      {messages[phase]!.sub && <p className={styles.tauntSubtext}>{messages[phase]!.sub}</p>}
    </div>
  );
}

export function SuspiciousButton() {
  return (
    <div className={styles.taunt}>
      <p className={styles.urgentTextMessage}>DO NOT PRESS</p>
      <p className={styles.tauntSubtext}>(Your finger is busy anyway)</p>
    </div>
  );
}

export function Weather() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Unexpected weather event.</p>
      <p className={styles.tauntSubtext}>☁️ 🌧️</p>
    </div>
  );
}

export function FakeCelebration() {
  const [phase, setPhase] = useState<'yes' | 'nope'>('yes');
  
  useEffect(() => {
    const timer = setTimeout(() => setPhase('nope'), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.urgentTaunt}>
      {phase === 'yes' ? (
        <p className={styles.urgentTextMessage}>YOU DID IT!</p>
      ) : (
        <>
          <p className={styles.tauntText}>No you didn't.</p>
          <p className={styles.tauntSubtext}>Keep holding.</p>
        </>
      )}
    </div>
  );
}

export function DayNightCycle() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>☀️ ... 🌙 ... ☀️</p>
      <p className={styles.tauntSubtext}>Time flies.</p>
    </div>
  );
}

export function FakeTimer() {
  const fakeTime = Math.floor(Math.random() * 60);
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>00:{String(fakeTime).padStart(2, '0')}</p>
      <p className={styles.tauntSubtext}>Just kidding.</p>
    </div>
  );
}

export function AnticipationBuildup() {
  return (
    <>
      <div className={styles.screenDim} />
      <div className={styles.taunt}>
        <p className={styles.tauntText}>Something is about to happen.</p>
      </div>
    </>
  );
}

export function FalseSafety() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Relax. No jump scares this round.</p>
    </div>
  );
}

// * Simplified/removed distractions (keeping for compatibility)
export function ScreenShake() { return null; }
export function Mosquito() { return null; }
export function Spider() { return null; }
export function FakeCrack() { return null; }
export function BouncingEmoji() { return null; }
export function UpsideDown() { return null; }
export function FakeLoading() { return null; }
export function ScreenShrink() { return null; }
export function FakeVibration() { return null; }
export function ZoomIn() { return null; }
export function NotificationSpam() { return null; }
