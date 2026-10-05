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
    
    // Thumb jokes
    case 'thumb-joke-1':
      return <Distractions.ThumbJoke1 />;
    case 'thumb-joke-2':
      return <Distractions.ThumbJoke2 />;
    case 'thumb-joke-3':
      return <Distractions.ThumbJoke3 />;
    case 'thumb-joke-4':
      return <Distractions.ThumbJoke4 />;
    case 'thumb-joke-5':
      return <Distractions.ThumbJoke5 />;
    
    // Counting taunts
    case 'counting-taunt-1':
      return <Distractions.CountingTaunt1 />;
    case 'counting-taunt-2':
      return <Distractions.CountingTaunt2 />;
    case 'counting-taunt-3':
      return <Distractions.CountingTaunt3 />;
    case 'counting-taunt-4':
      return <Distractions.CountingTaunt4 />;
    
    // General taunts (20 variations)
    case 'taunt-1':
      return <Distractions.Taunt1 />;
    case 'taunt-2':
      return <Distractions.Taunt2 />;
    case 'taunt-3':
      return <Distractions.Taunt3 />;
    case 'taunt-4':
      return <Distractions.Taunt4 />;
    case 'taunt-5':
      return <Distractions.Taunt5 />;
    case 'taunt-6':
      return <Distractions.Taunt6 />;
    case 'taunt-7':
      return <Distractions.Taunt7 />;
    case 'taunt-8':
      return <Distractions.Taunt8 />;
    case 'taunt-9':
      return <Distractions.Taunt9 />;
    case 'taunt-10':
      return <Distractions.Taunt10 />;
    case 'taunt-11':
      return <Distractions.Taunt11 />;
    case 'taunt-12':
      return <Distractions.Taunt12 />;
    case 'taunt-13':
      return <Distractions.Taunt13 />;
    case 'taunt-14':
      return <Distractions.Taunt14 />;
    case 'taunt-15':
      return <Distractions.Taunt15 />;
    case 'taunt-16':
      return <Distractions.Taunt16 />;
    case 'taunt-17':
      return <Distractions.Taunt17 />;
    case 'taunt-18':
      return <Distractions.Taunt18 />;
    case 'taunt-19':
      return <Distractions.Taunt19 />;
    case 'taunt-20':
      return <Distractions.Taunt20 />;
    
    // Other distractions
    case 'wrong-time':
      return <Distractions.WrongTime />;
    case 'release-now':
      return <Distractions.ReleaseNow />;
    case 'almost-there':
      return <Distractions.AlmostThere />;
    case 'fake-finish':
      return <Distractions.TimeUp />;
    case 'fake-battery':
      return <Distractions.FakeBattery />;
    case 'fake-message':
      return <Distractions.FakeMessage />;
    case 'pigeon':
      return <Distractions.Pigeon />;
    case 'tiny-horse':
      return <Distractions.TinyHorse />;
    case 'wrong-countdown':
      return <Distractions.WrongCountdown />;
    
    default:
      return null;
  }
}
