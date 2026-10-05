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

export function YoureCounting() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>You're counting in your head, aren't you?</p>
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
      <p className={styles.urgentText}>Almost there!</p>
      <p className={styles.urgentSubtext}>Or are you?</p>
    </div>
  );
}

export function WayTooEarly() {
  return (
    <div className={styles.urgentTaunt}>
      <p className={styles.urgentText}>Way too early.</p>
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

export function FakeVibration() {
  return (
    <div className={styles.fakeVibration}>
      <div className={styles.vibrationPulse} />
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
    <div className={styles.paradox}>
      <p className={styles.paradoxText}>Did a second just feel longer?</p>
      <p className={styles.paradoxSubtext}>Or shorter?</p>
    </div>
  );
}

export function SwipeNotification() {
  return (
    <div className={styles.fakeNotification}>
      <div className={styles.notification}>
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
    <div className={styles.mathProblem}>
      <p className={styles.mathQuestion}>Quick: What's 17 × 23?</p>
      <p className={styles.mathSubtext}>Just kidding. Keep holding.</p>
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
      <p className={styles.commandText}>RELEASE NOW</p>
      <p className={styles.commandSubtext}>(Don't actually)</p>
    </div>
  );
}

export function SecondsFeelLonger() {
  return (
    <div className={styles.taunt}>
      <p className={styles.tauntText}>Seconds feel longer when you're focused on them.</p>
    </div>
  );
}

export function AlreadyFailed() {
  return (
    <div className={styles.negativeTaunt}>
      <p className={styles.negativeText}>You already failed.</p>
      <p className={styles.negativeSubtext}>Probably.</p>
    </div>
  );
}

export function ScreenDim() {
  return (
    <div className={styles.screenDim}>
      <div className={styles.dimOverlay} />
    </div>
  );
}

export function FakeFinish() {
  return (
    <div className={styles.fakeFinish}>
      <div className={styles.finishText}>TIME'S UP!</div>
      <div className={styles.finishSubtext}>Just kidding.</div>
    </div>
  );
}

export function ZoomIn() {
  return (
    <div className={styles.zoomIn} />
  );
}

export function NotificationSpam() {
  const notifications = [
    'Battery low',
    'New email',
    'Calendar reminder',
    'Update available',
  ];
  
  return (
    <div className={styles.notificationSpam}>
      {notifications.map((text, i) => (
        <div
          key={i}
          className={styles.spamNotification}
          style={{ animationDelay: `${i * 0.8}s` }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
