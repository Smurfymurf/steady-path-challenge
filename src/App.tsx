import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminOffers } from './components/AdminOffers';
import { LandingScreen } from './components/LandingScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { SpinWheel } from './components/SpinWheel';
import { gameConfig, type GameState } from './config/game';
import { getLevel, hasNextLevel } from './config/levels';
import { getWheelForGeo, type OfferGeo, type WheelConfig } from './config/offers';
import { detectVisitorGeo } from './game/geo';
import { fetchWheelForGeo } from './game/liveOffers';
import {
  finaleTitle,
  sumLevelScores,
  type LevelScoreResult,
} from './game/scoring';
import {
  advanceLevel,
  createSession,
  recordFailure,
  recordLevelComplete,
  recordProgress,
  resetRunFromLevelOne,
  type SessionState,
} from './game/session';
import { playSfx, setSoundEnabled as setAudioEnabled } from './game/sound';
import type { FailKind } from './components/GameScreen';
import './styles/global.css';
import './styles/game.css';

function isAdminPath(): boolean {
  return window.location.pathname.replace(/\/+$/, '') === '/admin';
}

function tryEnterFullscreen(): void {
  const root = document.documentElement;
  if (!root.requestFullscreen) {
    return;
  }

  root.requestFullscreen().catch(() => {
    // * Fullscreen is optional; continue if the browser rejects it.
  });
}

function readDemoLevelFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('level') ?? params.get('demo');
  if (!raw) {
    return null;
  }
  const level = Number.parseInt(raw, 10);
  if (!Number.isFinite(level)) {
    return null;
  }
  try {
    getLevel(level);
    return level;
  } catch {
    return null;
  }
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(isAdminPath);
  const [gameState, setGameState] = useState<GameState>('landing');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    gameConfig.soundEnabledByDefault,
  );

  useEffect(() => {
    setAudioEnabled(soundEnabled);
  }, [soundEnabled]);

  const [session, setSession] = useState<SessionState | null>(null);
  const [wheel, setWheel] = useState<WheelConfig>(() => getWheelForGeo('FALLBACK'));
  const [offerGeo, setOfferGeo] = useState<OfferGeo>('FALLBACK');
  const [pendingScore, setPendingScore] = useState<LevelScoreResult | null>(null);
  const sessionRef = useRef<SessionState | null>(null);
  const demoBootstrapped = useRef(false);

  const updateSession = useCallback((next: SessionState | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const refreshWheel = useCallback(async (geo: OfferGeo) => {
    const liveWheel = await fetchWheelForGeo(geo);
    setWheel(liveWheel);
    return liveWheel;
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectVisitorGeo().then(async (result) => {
      if (cancelled) {
        return;
      }
      setOfferGeo(result.offerGeo);
      const liveWheel = await fetchWheelForGeo(result.offerGeo);
      if (!cancelled) {
        setWheel(liveWheel);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isAdmin) {
    return (
      <AdminOffers
        onExit={() => {
          window.history.pushState({}, '', '/');
          setIsAdmin(false);
        }}
      />
    );
  }

  const beginAtLevel = useCallback((levelId: number) => {
    const nextSession = createSession(soundEnabled, levelId);
    updateSession(nextSession);
    setPendingScore(null);
    setGameState('playing');
    tryEnterFullscreen();
  }, [soundEnabled, updateSession]);

  useEffect(() => {
    if (demoBootstrapped.current) {
      return;
    }
    const demoLevel = readDemoLevelFromUrl();
    if (!demoLevel) {
      return;
    }
    demoBootstrapped.current = true;
    beginAtLevel(demoLevel);
  }, [beginAtLevel]);

  const handleStart = useCallback(() => {
    playSfx('go');
    beginAtLevel(1);
  }, [beginAtLevel]);

  const handleProgress = useCallback((progress: number) => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }
    updateSession(recordProgress(current, progress));
  }, [updateSession]);

  const handleFailure = useCallback((progress: number, kind: FailKind = 'wall') => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    // * Wall hits already blasted a scream in GameScreen; soft timeout keeps the UI blip.
    if (kind === 'timeout') {
      playSfx('fail');
    }

    const failed = recordFailure(recordProgress(current, progress));
    updateSession(failed);

    // * Overlay hold already finished in GameScreen before this fires.
    if (failed.lives <= 0) {
      setGameState('gameOver');
      return;
    }
    setGameState('playing');
  }, [updateSession]);

  const handleLevelComplete = useCallback((score: LevelScoreResult) => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    const completed = recordLevelComplete(current, score);
    updateSession(completed);
    setPendingScore(score);
    setGameState('levelComplete');
  }, [updateSession]);

  const handleContinueFromScore = useCallback(() => {
    const current = sessionRef.current;
    if (!current) {
      return;
    }

    playSfx('whoosh');
    setPendingScore(null);
    if (hasNextLevel(current.currentLevel)) {
      updateSession(advanceLevel(current));
      setGameState('playing');
      return;
    }
    playSfx('success');
    setGameState('allComplete');
  }, [updateSession]);

  const handleRestartFromGameOver = useCallback(() => {
    playSfx('tap');
    const current = sessionRef.current;
    if (!current) {
      beginAtLevel(1);
      return;
    }
    updateSession(resetRunFromLevelOne(current));
    setPendingScore(null);
    setGameState('playing');
  }, [beginAtLevel, updateSession]);

  const handlePlayAgain = useCallback(() => {
    playSfx('tap');
    updateSession(null);
    setPendingScore(null);
    setGameState('landing');
  }, [updateSession]);

  const grandTotal = session ? sumLevelScores(session.levelScores) : 0;

  return (
    <div className="app-shell">
      <div className="landscape-hint" role="status">
        Turn your phone upright for the best experience.
      </div>

      {gameState === 'landing' && (
        <LandingScreen
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            setSoundEnabled((value) => {
              const next = !value;
              setAudioEnabled(next);
              if (next) {
                playSfx('toggle');
              }
              return next;
            });
          }}
          onStart={handleStart}
        />
      )}

      {(gameState === 'playing'
        || gameState === 'normalFailure'
        || gameState === 'levelComplete')
        && session && (
        <GameScreen
          key={session.currentLevel}
          levelId={session.currentLevel}
          lives={session.lives}
          levelFailures={session.failuresByLevel[session.currentLevel] ?? 0}
          onFailure={handleFailure}
          onLevelComplete={handleLevelComplete}
          onContinueFromScore={handleContinueFromScore}
          onProgress={handleProgress}
          onHome={handlePlayAgain}
          showScoreCard={gameState === 'levelComplete'}
          pendingScore={pendingScore}
        />
      )}

      {gameState === 'gameOver' && session && (
        <GameOverScreen
          furthestLevel={session.furthestLevel}
          onSpin={() => {
            playSfx('tap');
            void refreshWheel(offerGeo).finally(() => {
              setGameState('spinWheel');
            });
          }}
          onRestart={handleRestartFromGameOver}
        />
      )}

      {gameState === 'spinWheel' && (
        <SpinWheel
          wheel={wheel}
          onClose={() => {
            playSfx('tap');
            setGameState('gameOver');
          }}
        />
      )}

      {gameState === 'allComplete' && session && (
        <main className="all-complete">
          <p className="all-complete__eyebrow">Challenge clear</p>
          <h1 className="all-complete__title">{finaleTitle(grandTotal)}</h1>
          <p className="all-complete__total">{grandTotal} total points</p>
          <ul className="all-complete__scores">
            {session.levelScores.map((score) => (
              <li key={score.levelId}>
                <span>
                  Level {score.levelId}
                  <small>{score.title}</small>
                </span>
                <strong>
                  {score.grade} · {score.totalPoints}
                </strong>
              </li>
            ))}
          </ul>
          <p className="all-complete__body">
            Wall hits: {session.totalFailures}. Accuracy avg:{' '}
            {session.levelScores.length
              ? Math.round(
                session.levelScores.reduce((sum, s) => sum + s.accuracyPct, 0)
                  / session.levelScores.length,
              )
              : 0}
            %.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={handlePlayAgain}
          >
            Play again
          </button>
        </main>
      )}
    </div>
  );
}
