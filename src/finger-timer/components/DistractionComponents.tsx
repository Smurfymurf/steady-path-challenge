/**
 * Massive library of ultra-polished distraction components.
 * Longer duration, more variations, thumb jokes included.
 */

import { useEffect, useState } from 'react';
import styles from './Distractions.module.css';

// * Matches the numberFloat animation duration so numbers unmount once they
// * have finished fading instead of lingering invisibly or being cut off.
const FLOAT_LIFETIME_MS = 2800;

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  bornAt: number;
}

export function RandomNumbers() {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

  useEffect(() => {
    let sequence = 0;

    const interval = setInterval(() => {
      sequence += 1;
      const next: FloatingNumber = {
        id: sequence,
        value: Math.floor(Math.random() * 60) + 1,
        x: Math.random() * 70 + 15,
        y: Math.random() * 55 + 22,
        bornAt: Date.now(),
      };

      setNumbers(prev => {
        const cutoff = Date.now() - FLOAT_LIFETIME_MS;
        return [...prev.filter(n => n.bornAt > cutoff), next];
      });
    }, 900);

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

// THUMB JOKES
export function ThumbJoke1() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Using your thumb?</p>
        <p className={styles.tauntSecondary}>We said FINGER challenge</p>
      </div>
    </div>
  );
}

export function ThumbJoke2() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>That's a thumb, mate</p>
        <p className={styles.tauntSecondary}>Not your finest finger</p>
      </div>
    </div>
  );
}

export function ThumbJoke3() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Thumbs don't count</p>
        <p className={styles.tauntSecondary}>But we'll allow it</p>
      </div>
    </div>
  );
}

export function ThumbJoke4() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your thumb is sweating</p>
      </div>
    </div>
  );
}

export function ThumbJoke5() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Technically a thumb</p>
        <p className={styles.tauntSecondary}>Technically cheating</p>
      </div>
    </div>
  );
}

// COUNTING TAUNTS
export function CountingTaunt1() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Stop counting in your head</p>
        <p className={styles.tauntSecondary}>We can hear you</p>
      </div>
    </div>
  );
}

export function CountingTaunt2() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>One Mississippi...</p>
        <p className={styles.tauntSecondary}>Wait, which number were you on?</p>
      </div>
    </div>
  );
}

export function CountingTaunt3() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Lost count yet?</p>
      </div>
    </div>
  );
}

export function CountingTaunt4() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Counting makes it worse</p>
        <p className={styles.tauntSecondary}>But you're doing it anyway</p>
      </div>
    </div>
  );
}

// GENERAL TAUNTS
export function Taunt1() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your internal clock is broken</p>
      </div>
    </div>
  );
}

export function Taunt2() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>This is taking forever</p>
        <p className={styles.tauntSecondary}>Or is it?</p>
      </div>
    </div>
  );
}

export function Taunt3() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>You're going to be way off</p>
      </div>
    </div>
  );
}

export function Taunt4() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Fun fact: You're bad at this</p>
      </div>
    </div>
  );
}

export function Taunt5() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Time doesn't exist</p>
        <p className={styles.tauntSecondary}>But you're still losing</p>
      </div>
    </div>
  );
}

export function Taunt6() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Everyone else got 0.01</p>
        <p className={styles.tauntSecondary}>Just saying</p>
      </div>
    </div>
  );
}

export function Taunt7() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your thumb looks nervous</p>
      </div>
    </div>
  );
}

export function Taunt8() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>What if you already lost?</p>
      </div>
    </div>
  );
}

export function Taunt9() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Is this 10 seconds?</p>
        <p className={styles.tauntSecondary}>Definitely not</p>
      </div>
    </div>
  );
}

export function Taunt10() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Don't think about elephants</p>
        <p className={styles.tauntSecondary}>Or seconds</p>
      </div>
    </div>
  );
}

export function Taunt11() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>You're overthinking this</p>
        <p className={styles.tauntSecondary}>Or underthinking it</p>
      </div>
    </div>
  );
}

export function Taunt12() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Probably should've released by now</p>
      </div>
    </div>
  );
}

export function Taunt13() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Time moves differently when you're</p>
        <p className={styles.tauntSecondary}>desperately failing</p>
      </div>
    </div>
  );
}

export function Taunt14() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your brain is guessing</p>
        <p className={styles.tauntSecondary}>And it's wrong</p>
      </div>
    </div>
  );
}

export function Taunt15() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Seconds feel longer when you focus</p>
        <p className={styles.tauntSecondary}>You're welcome</p>
      </div>
    </div>
  );
}

export function Taunt16() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Still holding?</p>
        <p className={styles.tauntSecondary}>Impressive. Or sad.</p>
      </div>
    </div>
  );
}

export function Taunt17() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Your record: terrible</p>
      </div>
    </div>
  );
}

export function Taunt18() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>This is definitely not it</p>
      </div>
    </div>
  );
}

export function Taunt19() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Are you breathing?</p>
        <p className={styles.tauntSecondary}>Probably forgot</p>
      </div>
    </div>
  );
}

export function Taunt20() {
  return (
    <div className={styles.tauntTop}>
      <div className={styles.tauntCard}>
        <p className={styles.tauntPrimary}>Nope. Still wrong.</p>
      </div>
    </div>
  );
}

// FAKE TIME DISPLAYS
export function WrongTime() {
  const [time, setTime] = useState(3);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTime(Math.floor(Math.random() * 30) + 5);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.tauntTop}>
      <div className={styles.fakeTimeCard}>
        {/* ! Keyed so each value cross-fades instead of snapping to new text. */}
        <div key={time} className={styles.fakeTimeNumber}>
          {time}
        </div>
        <div className={styles.fakeTimeLabel}>seconds elapsed</div>
        <div className={styles.fakeTimeDisclaimer}>probably not</div>
      </div>
    </div>
  );
}

// URGENT MESSAGES
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

// NOTIFICATIONS
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
    { title: "Friend", body: "You're taking forever" },
    { title: "Timer", body: "You missed it by a lot" },
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

// ANIMATED ELEMENTS
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
  const [step, setStep] = useState(0);
  const numbers = [5, 4, 3, 2, 17, 42, 0];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => Math.min(prev + 1, numbers.length - 1));
    }, 750);

    return () => clearInterval(timer);
  }, [numbers.length]);

  return (
    <div className={styles.countdownCenter}>
      {/* ! Keyed on the step so every digit replays its settle animation. */}
      <div key={step} className={styles.countdownNumber}>
        {numbers[step]}
      </div>
    </div>
  );
}
