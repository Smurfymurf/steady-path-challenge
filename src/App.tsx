import { useCallback, useState } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { GameScreen } from './components/GameScreen';
import { gameConfig, type GameState } from './config/game';
import {
  createSession,
  recordFailure,
  recordLevelComplete,
  recordProgress,
  type SessionState,
} from './game/session';
import './styles/global.css';
import './styles/game.css';

function tryEnterFullscreen(): void {
  const root = document.documentElement;
  if (!root.requestFullscreen) {
    return;
  }

  root.requestFullscreen().catch(() => {
    // * Fullscreen is optional; continue if the browser rejects it.
  });
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    gameConfig.soundEnabledByDefault,
  );
  const [session, setSession] = useState<SessionState | null>(null);

  const handleStart = useCallback(() => {
    const nextSession = createSession(soundEnabled);
    setSession(nextSession);
    setGameState('playing');
    tryEnterFullscreen();
  }, [soundEnabled]);

  const handleProgress = useCallback((progress: number) => {
    setSession((current) => (current ? recordProgress(current, progress) : current));
  }, []);

  const handleFailure = useCallback((progress: number) => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const withProgress = recordProgress(current, progress);
      return recordFailure(withProgress);
    });
    setGameState('normalFailure');
    window.setTimeout(() => {
      setGameState('playing');
    }, gameConfig.normalFailureMessageMs);
  }, []);

  const handleLevelComplete = useCallback(() => {
    setSession((current) => (current ? recordLevelComplete(current) : current));
    setGameState('levelComplete');
  }, []);

  return (
    <div className="app-shell">
      <div className="landscape-hint" role="status">
        Turn your phone upright for the best experience.
      </div>

      {gameState === 'landing' && (
        <LandingScreen
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((value) => !value)}
          onStart={handleStart}
        />
      )}

      {(gameState === 'playing'
        || gameState === 'normalFailure'
        || gameState === 'levelComplete')
        && session && (
        <GameScreen
          levelId={session.currentLevel}
          onFailure={handleFailure}
          onLevelComplete={handleLevelComplete}
          onProgress={handleProgress}
        />
      )}
    </div>
  );
}
