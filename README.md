# Math Racer

Educational racing game for learning multiplication tables through voice-controlled gameplay.

## Tech Stack

- **Phaser 3** - 2D game framework
- **Vite** - Build tool and dev server
- **JavaScript (ES6+)** - No TypeScript for MVP
- **Web Speech API** - French voice recognition

## Architecture Notes

### Core Architectural Principles

**Separation of Concerns** - The game is structured into distinct layers:

1. **Physics Layer** (track-agnostic)

   - Vehicle physics simulation independent of track shape
   - Velocity, acceleration, friction calculations
   - Car can stop completely (zero velocity)
   - Located in: `src/systems/VehiclePhysics.js`

2. **Track Layer** (visual representation)

   - Path definition using Phaser curves
   - Converts progress (0-1) to world position {x, y, angle}
   - Top-down rendering only
   - Located in: `src/systems/Track.js`

3. **Game Logic Layer**

   - Problem generation from selected multiplication tables
   - Answer validation
   - Time-based performance tracking (no point scoring)
   - Located in: `src/systems/MathProblem.js`, `src/systems/StatisticsTracker.js`

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
- **Code-Generated Graphics** - No sprite assets for MVP; retro arcade aesthetic using Phaser Graphics API
- **Client-Side Speech Recognition** - No server required, zero latency, free
- **Top-Down View** - Fixed overhead camera showing entire track (bird's eye perspective)
- **Time-Based Scoring** - Race time is the only metric; no points system

### Critical Game Mechanics

- **Boost = f(remaining timer)** - Linear mapping: 6s remaining = max boost, 0s = no boost
- **Continuous friction** - Car always decelerates between problems
- **Timer doesn't pause on wrong answers** - Creates pressure to answer quickly even after mistakes
- **Car can stop** - If no boosts applied for extended time, velocity reaches zero

### Tuning Parameters

All game balance constants are centralized in `src/config/constants.js`:

- Physics (max speed, friction, acceleration)
- Timing (problem timer, delays, feedback duration)
- Boost scaling
- Game rules (laps to complete, canvas size)

**Always adjust constants.js rather than hardcoding values.**

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
  /scenes          # Phaser scenes (Menu, Game, GameOver)
  /systems         # Game systems (Physics, Track, Math, Speech)
  /config          # Configuration files
    gameConfig.js  # Phaser configuration
    constants.js   # Tuning parameters
    colors.js      # Retro color palette
  main.js          # Entry point

/docs              # Documentation and specifications
/public            # Static assets
```

## Documentation

- [Game Specifications](./docs/game-specifications.md)
- [Technical Architecture](./docs/technical-architecture.md)
- [Implementation Plan](./docs/implementation-plan.md)

## Browser Requirements

- Chrome or Edge (for Web Speech API support)
- Microphone access required for voice input
- Keyboard fallback available
