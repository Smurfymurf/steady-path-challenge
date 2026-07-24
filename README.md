# Steady Path Challenge — Phase 1 Prototype

Mobile-first finger-control maze prototype (React + TypeScript + Vite).

## Phase 1 scope

- Landing screen
- One SVG test maze
- Pointer / touch / mouse input
- Start-zone validation
- Path collision detection with forgiveness margin
- Finish-zone detection
- Normal red failure state
- Dev-only collision debug overlay

Not included yet: jump scare, sharing, analytics, final branding, levels 2–3.

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) on desktop or your phone on the same network.

```bash
npm run build
npm run preview
```

## Configuration

- `src/config/game.ts` — game name, tagline, forgiveness widths
- `src/config/brand.ts` — colours / asset paths
- `src/config/levels.ts` — maze geometry
