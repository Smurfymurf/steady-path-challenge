/**
 * Ultra-polished distraction components with genuinely funny content.
 */

import { useEffect, useState } from 'react';
import styles from './Distractions.module.css';

export function RandomNumbers() {
  const [numbers, setNumbers] = useState<Array<{ id: number; value: number; x: number; y: number }>>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newNumber = {
        id: Date.now(),
        value: Math.floor(Math.random() * 60) + 1,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
      };
      setNumbers(prev => [...prev, newNumber].slice(-4));
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={styles.randomNumbers}>
      {numbers.map(num => (
        <div
          key={num.id}
          className={styles.floatingNumber}
          style={{
            left: `${num.x}%`,
            top: `${num.y}%`,
          }}
        >
          {num.value}
        </div>
      ))}
    </div>
  );
}

export function YoureCounting() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Stop counting in your head</p>
        <p className={styles.tauntSecondary}>We can hear you</p>
      </div>
    </div>
  );
}

export function WrongTime() {
  const [time, setTime] = useState(3);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setTime(Math.floor(Math.random() * 30) + 5);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.tauntTop}>
      <div className={styles.fakeTimeCard}>
        <div className={styles.fakeTimeNumber}>{time}</div>
        <div className={styles.fakeTimeLabel}>seconds elapsed</div>
        <div className={styles.fakeTimeDisclaimer}>probably not</div>
      </div>
    </div>
  );
}

export function Distraction1() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your internal clock is broken</p>
      </div>
    </div>
  );
}

export function Distraction2() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>This is taking forever</p>
        <p className={styles.tauntSecondary}>Or is it?</p>
      </div>
    </div>
  );
}

export function Distraction3() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>You're going to be way off</p>
      </div>
    </div>
  );
}

export function Distraction4() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Fun fact: You're bad at this</p>
      </div>
    </div>
  );
}

export function Distraction5() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Time doesn't exist</p>
        <p className={styles.tauntSecondary}>But you're still losing</p>
      </div>
    </div>
  );
}

export function Distraction6() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Everyone else got 0.01</p>
        <p className={styles.tauntSecondary}>Just saying</p>
      </div>
    </div>
  );
}

export function Distraction7() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your finger looks nervous</p>
      </div>
    </div>
  );
}

export function Distraction8() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>What if you already lost?</p>
      </div>
    </div>
  );
}

export function Distraction9() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>One Mississippi...</p>
        <p className={styles.tauntSecondary}>Wait, which number were you on?</p>
      </div>
    </div>
  );
}

export function Distraction10() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Is this 10 seconds?</p>
        <p className={styles.tauntSecondary}>Definitely not</p>
      </div>
    </div>
  );
}

export function Distraction11() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Don't think about elephants</p>
        <p className={styles.tauntSecondary}>Or seconds</p>
      </div>
    </div>
  );
}

export function Distraction12() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>You're overthinking this</p>
        <p className={styles.tauntSecondary}>Or underthinking it</p>
      </div>
    </div>
  );
}

export function ReleaseNow() {
  return (
    <div className={styles.urgentBottom}>
      <div className={styles.urgentCard}>
        <div className={styles.urgentText}>RELEASE NOW</div>
        <div className={styles.urgentSubtext}>jk don't</div>
      </div>
    </div>
  );
}

export function AlmostThere() {
  return (
    <div className={styles.urgentBottom}>
      <div className={styles.urgentCard}>
        <div className={styles.urgentText}>ALMOST THERE</div>
        <div className={styles.urgentSubtext}>probably not though</div>
      </div>
    </div>
  );
}

export function TimeUp() {
  return (
    <div className={styles.fakeFinish}>
      <div className={styles.finishCard}>
        <div className={styles.finishText}>TIME'S UP</div>
        <div className={styles.finishSubtext}>gotcha</div>
      </div>
    </div>
  );
}

export function FakeBattery() {
  return (
    <div className={styles.notificationTop}>
      <div className={styles.notificationCard}>
        <div className={styles.notificationIcon}>🔋</div>
        <div className={styles.notificationText}>
          <div className={styles.notificationTitle}>Battery Low</div>
          <div className={styles.notificationBody}>1% remaining</div>
        </div>
      </div>
    </div>
  );
}

export function FakeMessage() {
  const messages = [
    { title: "Mom", body: "Are you still touching your phone?" },
    { title: "Boss", body: "We need to talk" },
    { title: "Ex", body: "Hey" },
    { title: "Bank", body: "Unusual activity detected" },
  ];
  
  const msg = messages[Math.floor(Math.random() * messages.length)]!;
  
  return (
    <div className={styles.notificationTop}>
      <div className={styles.notificationCard}>
        <div className={styles.notificationIcon}>💬</div>
        <div className={styles.notificationText}>
          <div className={styles.notificationTitle}>{msg.title}</div>
          <div className={styles.notificationBody}>{msg.body}</div>
        </div>
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
      <div className={styles.tauntBottom}>
        <div className={styles.captionCard}>
          <p className={styles.captionText}>ignore the pigeon</p>
        </div>
      </div>
    </>
  );
}

export function TinyHorse() {
  return (
    <div className={styles.tinyHorse}>
      <div className={styles.horseEmoji}>🐴</div>
    </div>
  );
}

export function WrongCountdown() {
  const [count, setCount] = useState(5);
  
  useEffect(() => {
    const numbers = [5, 4, 3, 2, 17, 42, 0];
    let index = 0;
    
    const timer = setInterval(() => {
      index += 1;
      if (index < numbers.length) {
        setCount(numbers[index]!);
      }
    }, 550);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={styles.countdownCenter}>
      <div className={styles.countdownNumber}>{count}</div>
    </div>
  );
}

// Simplified stubs for compatibility
export function StopCounting() { return <YoureCounting />; }
export function WayTooEarly() { return <Distraction3 />; }
export function FingerGettingTired() { return <Distraction7 />; }
export function Overthinking() { return <Distraction12 />; }
export function FriendDidBetter() { return <Distraction6 />; }
export function ProbablyWrong() { return <Distraction3 />; }
export function TimeParadox() { return <Distraction2 />; }
export function SwipeNotification() { return <FakeMessage />; }
export function MathProblem() { return <Distraction9 />; }
export function DistractedYet() { return <Distraction1 />; }
export function SecondsFeelLonger() { return <Distraction5 />; }
export function AlreadyFailed() { return <Distraction8 />; }
export function ScreenDim() { return null; }
export function FakeFinish() { return <TimeUp />; }
export function MotivationalCoach() { return <Distraction4 />; }
export function FingerInspection() { return <Distraction7 />; }
export function FakeAchievement() { return null; }
export function EmergencyQuestion() { return <Distraction11 />; }
export function UnhelpfulAdvice() { return <YoureCounting />; }
export function SuspiciousButton() { return null; }
export function Weather() { return null; }
export function FakeCelebration() { return <AlmostThere />; }
export function DayNightCycle() { return null; }
export function FakeTimer() { return <WrongTime />; }
export function AnticipationBuildup() { return null; }
export function FalseSafety() { return null; }
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
