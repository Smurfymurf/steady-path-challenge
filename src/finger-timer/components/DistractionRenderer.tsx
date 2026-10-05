/**
 * Distraction renderer that displays the appropriate component based on event ID.
 */

import { useEffect, useState } from 'react';
import type { ScheduledDistraction, JumpScareEvent } from '../types';
import { getJumpScareImage } from '../distractionEngine';
import { JumpScare } from '../../components/JumpScare';
import { playScream, stopScream } from '../../game/sound';
import * as Distractions from './DistractionComponents';

interface DistractionRendererProps {
  distraction: ScheduledDistraction | null;
  soundEnabled: boolean;
}

export function DistractionRenderer({ distraction, soundEnabled }: DistractionRendererProps) {
  const [jumpScareActive, setJumpScareActive] = useState(false);
  const [jumpScareSrc, setJumpScareSrc] = useState<string | null>(null);
  
  useEffect(() => {
    if (!distraction) {
      setJumpScareActive(false);
      setJumpScareSrc(null);
      stopScream();
      return;
    }
    
    const event = distraction.event;
    
    // * Handle jump scares.
    if ('type' in event && event.type === 'jumpscare') {
      const jumpScareEvent = event as JumpScareEvent;
      const imageSrc = getJumpScareImage(jumpScareEvent);
      
      setJumpScareSrc(imageSrc);
      setJumpScareActive(true);
      
      if (soundEnabled) {
        playScream(jumpScareEvent.audio);
      }
      
      const timer = setTimeout(() => {
        setJumpScareActive(false);
        stopScream();
      }, event.durationMs);
      
      return () => {
        clearTimeout(timer);
        stopScream();
      };
    }
  }, [distraction, soundEnabled]);
  
  if (!distraction) {
    return null;
  }
  
  const event = distraction.event;
  
  // * Render jump scare.
  if ('type' in event && event.type === 'jumpscare') {
    return <JumpScare visible={jumpScareActive} imageSrc={jumpScareSrc} />;
  }
  
  // * Render standard distractions.
  switch (event.id) {
    case 'fake-battery':
      return <Distractions.FakeBattery />;
    case 'pigeon':
      return <Distractions.Pigeon />;
    case 'screen-shake':
      return <Distractions.ScreenShake />;
    case 'wrong-countdown':
      return <Distractions.WrongCountdown />;
    case 'motivational-coach':
      return <Distractions.MotivationalCoach />;
    case 'finger-inspection':
      return <Distractions.FingerInspection />;
    case 'fake-achievement':
      return <Distractions.FakeAchievement />;
    case 'emergency-question':
      return <Distractions.EmergencyQuestion />;
    case 'mosquito':
      return <Distractions.Mosquito />;
    case 'spider':
      return <Distractions.Spider />;
    case 'fake-crack':
      return <Distractions.FakeCrack />;
    case 'bouncing-emoji':
      return <Distractions.BouncingEmoji />;
    case 'upside-down':
      return <Distractions.UpsideDown />;
    case 'fake-loading':
      return <Distractions.FakeLoading />;
    case 'unhelpful-advice':
      return <Distractions.UnhelpfulAdvice />;
    case 'suspicious-button':
      return <Distractions.SuspiciousButton />;
    case 'tiny-horse':
      return <Distractions.TinyHorse />;
    case 'weather':
      return <Distractions.Weather />;
    case 'screen-shrink':
      return <Distractions.ScreenShrink />;
    case 'fake-celebration':
      return <Distractions.FakeCelebration />;
    case 'day-night-cycle':
      return <Distractions.DayNightCycle />;
    case 'fake-timer':
      return <Distractions.FakeTimer />;
    case 'anticipation-buildup':
      return <Distractions.AnticipationBuildup />;
    case 'false-safety':
      return <Distractions.FalseSafety />;
    default:
      return null;
  }
}
