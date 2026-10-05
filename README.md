# Finger Challenge

The first version of FingerChallenge.com — a stupidly simple, addictive time-guessing game.

## The Challenge

**GUESS THE TIME**

1. Choose your target: 10, 20, 30, or 60 seconds
2. Press and hold your finger on the screen
3. The timer disappears
4. Release when you think the time is up
5. See how close you were

While concentrating, increasingly ridiculous things happen on screen designed to interfere with your internal sense of time.

## Play Now

Visit the site and:
- No signup required
- No tutorial screens
- No complicated navigation
- Just press and hold

The ideal reaction:

> "This looks stupidly easy."

followed by:

> "Fuck, I was 2.7 seconds out. Let me try again."

and then:

> "I'm sending this to someone."

## Features

### Core Game
- High-precision timing using `performance.now()`
- 4 challenge durations (10/20/30/60 seconds)
- Personal best tracking
- Performance labels from "ARE YOU A CLOCK?" to "DO YOU KNOW WHAT A SECOND IS?"

### Distraction Engine
- 24+ unique distraction events
- Randomized sequences every game
- Rare jump scares (5-25% chance)
- No two games feel identical
- Scales intensity with duration

### Distractions Include
- Pigeon crossing the screen ("Do not acknowledge the pigeon")
- Wrong countdown (5, 4, 3, 2, 17, 42)
- Fake battery warning (1%)
- Mosquito buzzing around your finger
- Emergency question: "How many giraffes could fit inside a Tesco?"
- Motivational coach: "You are doing incredibly well at touching a screen"
- Fake celebration mid-game
- Tiny horse galloping across bottom
- And many more ridiculous interruptions

### Mobile First
- Touch-optimized
- Prevents accidental scrolling
- Respects reduced-motion preferences
- Portrait + landscape jump scare assets
- Works on desktop with mouse

### Share Your Results
- Web Share API integration
- Copy to clipboard fallback
- Challenge friends (coming soon)
- Daily challenges (coming soon)

## Technical Stack

- React 19
- TypeScript 6
- Vite 8
- CSS Modules
- LocalStorage for personal bests
- Seeded RNG for deterministic challenges

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

```bash
npm run build
npm run preview
```

## Project Structure

```
src/finger-timer/
  types.ts                   # Game type definitions
  timer.ts                   # High-precision timing
  seededRandom.ts           # Deterministic RNG
  distractionCatalogue.ts   # All 24+ distraction events
  distractionEngine.ts      # Event scheduling
  storage.ts                # Personal best tracking
  analytics.ts              # Event tracking
  share.ts                  # Web Share API
  components/               # React components
```

## Configuration

Jump scare probability by duration (configurable in Settings):
- 10 seconds: 7.5%
- 20 seconds: 12.5%
- 30 seconds: 17.5%
- 60 seconds: 25%

Settings accessible via gear icon on landing screen.

## Legacy Games

The original maze and pressure test games remain accessible:
- Maze: `/maze`
- Pressure test: Component preserved in codebase

## Assets

All jump scare assets preserved:
- 14 scare images (portrait + landscape)
- 5 scream audio files
- Integrated into distraction system

## Future Features

Architecture ready for:
- Challenge friend URLs
- Daily challenge mode
- Global leaderboards
- Result card generation
- Chaos mode
- Reward wheel integration

## Philosophy

- Instantly understandable
- No unnecessary text
- Mobile first
- Polished, funny, slightly mischievous
- No signup, no tutorial, no bullshit

## License

Private repository.
