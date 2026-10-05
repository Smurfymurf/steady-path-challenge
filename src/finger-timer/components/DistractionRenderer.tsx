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
    case 'random-numbers':
      return <Distractions.RandomNumbers />;
    case 'youre-counting':
    case 'stop-counting':
      return <Distractions.YoureCounting />;
    case 'wrong-time':
      return <Distractions.WrongTime />;
    case 'distraction-1':
      return <Distractions.Distraction1 />;
    case 'distraction-2':
      return <Distractions.Distraction2 />;
    case 'distraction-3':
      return <Distractions.Distraction3 />;
    case 'distraction-4':
      return <Distractions.Distraction4 />;
    case 'distraction-5':
      return <Distractions.Distraction5 />;
    case 'distraction-6':
      return <Distractions.Distraction6 />;
    case 'distraction-7':
      return <Distractions.Distraction7 />;
    case 'distraction-8':
      return <Distractions.Distraction8 />;
    case 'distraction-9':
      return <Distractions.Distraction9 />;
    case 'distraction-10':
      return <Distractions.Distraction10 />;
    case 'distraction-11':
      return <Distractions.Distraction11 />;
    case 'distraction-12':
      return <Distractions.Distraction12 />;
    case 'release-now':
      return <Distractions.ReleaseNow />;
    case 'almost-there':
      return <Distractions.AlmostThere />;
    case 'fake-finish':
      return <Distractions.TimeUp />;
    case 'fake-battery':
      return <Distractions.FakeBattery />;
    case 'fake-message':
    case 'swipe-notification':
      return <Distractions.FakeMessage />;
    case 'pigeon':
      return <Distractions.Pigeon />;
    case 'tiny-horse':
      return <Distractions.TinyHorse />;
    case 'wrong-countdown':
      return <Distractions.WrongCountdown />;
    
    // Fallback mappings
    case 'way-too-early':
    case 'finger-getting-tired':
    case 'overthinking':
    case 'friend-did-better':
    case 'probably-wrong':
    case 'time-paradox':
    case 'math-problem':
    case 'distracted-yet':
    case 'seconds-feel-longer':
    case 'already-failed':
    case 'motivational-coach':
    case 'finger-inspection':
    case 'emergency-question':
    case 'unhelpful-advice':
    case 'fake-timer':
      return <Distractions.YoureCounting />;
    
    default:
      return null;
  }
}
