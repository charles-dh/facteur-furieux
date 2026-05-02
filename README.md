# Math Racer

Educational racing game for learning multiplication tables through voice-controlled gameplay.

## Tech Stack

- **Phaser 3** - 2D game framework
- **Vite** - Build tool and dev server
- **TypeScript** (strict) - pure systems and configs are `.ts`; scenes are still `.js` and converted opportunistically
- **Vitest** - unit tests for pure logic
- **Web Speech API** - French voice recognition

## Architecture Notes

### Core Architectural Principles

**Separation of Concerns** - The game is structured into distinct layers:

1. **Physics Layer** (track-agnostic)

   - Vehicle physics simulation independent of track shape
   - Velocity, acceleration, friction calculations
   - Car can stop completely (zero velocity)
   - Per-frame perspective scaling (slower when far on the tilted track, faster when near)
   - Located in: `src/systems/VehiclePhysics.ts`

2. **Track Layer** (visual representation)

   - Path traced over a 3/4-perspective background image (SVG path → `Phaser.Curves.Path`)
   - Converts progress (0-1) to canvas-space `{x, y, angle}`
   - Located in: `src/systems/Track.ts`

3. **Game Logic Layer**

   - Problem generation from selected multiplication tables
   - Answer validation
   - Time-based performance tracking (no point scoring)
   - Located in: `src/systems/MathProblem.ts`, `src/systems/StatisticsTracker.ts`

4. **Input Layer**

   - Speech recognition service (Web Speech API)
   - Keyboard fallback
   - Located in: `src/systems/FrenchSpeechRecognition.js`

5. **Presentation Layer**
   - Phaser scenes (Menu, Game, GameOver)
   - UI overlays (problem display, timer, stats)
   - Visual effects (boost particles, timer bar)
   - Located in: `src/scenes/`

### Key Design Decisions

- **No Phaser Physics Engines** - Custom physics for precise control and simpler tuning
- **Pre-rendered art** - 3/4-perspective track background and a 32-frame car spritesheet (one PNG per heading angle, 11.25° apart). HUD/UI still uses the Phaser Graphics API.
- **Client-Side Speech Recognition** - No server required, zero latency, free
- **3/4 Perspective View** - Fixed camera looking down at a tilted track. The car sprite scales and slows with depth so it reads correctly at every position.
- **Bicycle-model car placement** - The sprite's center sits at the midpoint between two path samples (rear/front axle), so the front wheel traces a smooth arc on tight curves instead of pivoting on the center.
- **Time-Based Scoring** - Race time is the only metric; no points system

### Critical Game Mechanics

- **Boost = f(remaining timer)** - Linear mapping: 6s remaining = max boost, 0s = no boost
- **Continuous friction** - Car always decelerates between problems
- **Timer doesn't pause on wrong answers** - Creates pressure to answer quickly even after mistakes
- **Car can stop** - If no boosts applied for extended time, velocity reaches zero

### Tuning Parameters

All game balance constants are centralized in `src/config/constants.ts`:

- Physics (max speed, friction, acceleration, perspective speed factors)
- Timing (problem timer, delays, feedback duration)
- Boost scaling
- Game rules (laps to complete, canvas size)
- Car (display size, number of angle frames, perspective size factors)

Track-specific constants (background image, SVG path, viewBox) live in `src/config/trackConfig.ts`.

**Always adjust the config files rather than hardcoding values.**

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the game at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

Recommended platform: **Vercel**

```bash
npm install -g vercel
vercel
```

## Project Structure

```
/src
  /scenes              # Phaser scenes (Menu, Game, GameOver, Leaderboard, RaceHUD)
  /systems             # Game systems (Physics, Track, Math, Speech, Audio, …)
  /config              # Configuration files
    gameConfig.ts      # Phaser configuration
    constants.ts       # Tuning parameters (physics, timing, car, game)
    trackConfig.ts     # Active track image + traced SVG path
    colors.ts          # Retro color palette
    audioConfig.ts     # SFX keys and audio settings
  main.ts              # Entry point

/assets                # Pre-rendered art (track image, 32-frame car spritesheet, audio)
/tests                 # Vitest unit tests for pure systems
/docs                  # Documentation and specifications
```

## Documentation

- [Game Specifications](./docs/game-specifications.md)
- [Technical Architecture](./docs/technical-architecture.md)
- [Enhancement Ideas](./docs/enhancement-ideas.md)

## Browser Requirements

- Chrome or Edge (for Web Speech API support)
- Microphone access required for voice input
- Keyboard fallback available
