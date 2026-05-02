# Math Racer - Technical Architecture

## Stack

- **Phaser 3** (v3.80+) — 2D game framework, scene management, particles, paths
- **TypeScript** (strict mode) — incremental migration; pure systems and configs are `.ts`, scenes still `.js` (converted opportunistically as features touch them)
- **Vite** — dev server + build
- **Vitest** — unit tests for pure logic (no Phaser mocking)
- **Web Speech API** — French recognition (Chrome/Edge only)
- **Web Audio API** — engine sound + procedural SFX via `SoundGenerator`

## Layout

```
src/
  scenes/
    MenuScene.js          # Welcome screen, table picker, input toggle
    GameScene.js          # Race orchestrator (physics tick, lap detection, event wiring)
    GameOverScene.js      # Results + leaderboard entry
    LeaderboardScene.js   # Top 10 scores
    RaceHUD.ts            # All HUD display objects + animations (extracted from GameScene)
    UIKit.ts              # Button factories (text/rect/icon), audio decoupled via scene events

  systems/
    RaceState.ts          # State machine: idle → countdown → awaitingProblem → answering → correct/timeout → finished
    InputController.ts    # Unified keyboard + voice input emitter
    VehiclePhysics.ts     # velocity / friction / boost (with perspective scaling on the position step)
    MathProblem.ts        # Problem generation, timer, boost calculation
    StatisticsTracker.ts  # Lap times, accuracy, race timer
    LeaderboardManager.ts # Top-10 persistence
    StorageManager.ts     # localStorage helpers (player name, input mode)
    frenchNumberParser.ts # Pure parser for spoken French numbers (homophones included)
    Track.ts              # SVG-traced path → canvas-space {x, y, angle}
    carSprite.ts          # heading → spritesheet frame index + asset path (banker's rounding to match the asset filenames)
    svgPathParser.ts      # Pure parser: SVG `d` string → Phaser.Curves.Path
    FrenchSpeechRecognition.js  # Web Speech API wrapper
    AudioManager.js       # SFX + engine sound coordination
    SoundGenerator.js     # Procedural Web Audio synthesis
    ParticleEffects.js    # Boost/celebration/flash particles

  config/
    constants.ts          # PHYSICS, TIMING, BOOST, GAME, TRACK, CAR
    trackConfig.ts        # Active track image + traced SVG path + viewBox
    colors.ts             # Palette
    audioConfig.ts        # AUDIO + EFFECTS
    gameConfig.ts         # Phaser game config

  main.ts                 # Entry point

tests/                    # Vitest, ~90 tests on pure systems
```

## Architecture

### Scene flow

`MenuScene → GameScene → GameOverScene → MenuScene`. `LeaderboardScene` reachable from Menu and GameOver.

### GameScene as orchestrator

GameScene used to be a 1000-line monolith. After the refactor it owns the per-frame physics tick, lap detection, audio cues, and event wiring — actual UI and state live elsewhere:

- **`RaceState`** owns phase transitions (idle/countdown/awaitingProblem/answering/correct/timeout/finished), the digit buffer, elapsed time, previous track position. `acceptCorrect()` and `markTimeout()` return `false` if already transitioned, guarding race conditions.
- **`RaceHUD`** owns every HUD display object and its animations. Emits `'hud:button-hover'` / `'hud:button-click'` scene events instead of importing `AudioManager` directly.
- **`InputController`** unifies keyboard and voice into one emitter (`digit`, `backspace`, `submit`, `voiceMatch`, `voiceInterim`). Voice-match logic (only emit when recognized number == expected answer) lives here.
- **`UIKit`** provides three button factories (`makeTextButton`, `makeRectButton`, `makeIconButton`). Audio decoupled via `'uikit:hover'` / `'uikit:click'` scene events.

### Why custom physics

Phaser's Arcade/Matter engines aren't used. Racing along a path is a 1D progress integration, not collision-based — much simpler to model `position`/`velocity`/`friction` directly and tune by feel. See `VehiclePhysics.ts`.

### Perspective rendering

The track is a 3/4-perspective background image with the road centerline traced as an SVG path. `Track.ts` parses that path and applies the same image transform the renderer uses, so the path and the painted road are guaranteed to align (single source of truth — change the image and the path scales with it).

Two scales are derived from the car's Y position on the canvas each frame:

- **Sprite size** — `GameScene.computeSizeScale(y)` lerps between `CAR.PERSPECTIVE_FAR_SCALE` (top) and `CAR.PERSPECTIVE_NEAR_SCALE` (bottom). Applied in both `createCar()` and `update()` so the car doesn't pop when the countdown ends.
- **Speed** — `GameScene.computePerspectiveFactor(y)` lerps between `PHYSICS.PERSPECTIVE_FAR_FACTOR` and `PHYSICS.PERSPECTIVE_NEAR_FACTOR`, and is passed to `VehiclePhysics.update(delta, factor)` to scale only the position step. Velocity, friction, and acceleration are unaffected so boosts feel the same regardless of depth.

### Car placement (bicycle model)

The car sprite isn't placed at `Track.getPositionAt(t)` directly. Instead `update()` samples two points on the path — half a wheelbase behind and ahead — and places the sprite at their midpoint, with heading along the rear→front line. This makes the front wheel trace a smooth arc on tight curves; using the raw path point made the sprite look like it pivoted on its center. Effective wheelbase = `0.6 * CAR.WIDTH` in canvas pixels, converted to path-progress units via `track.length`.

### Car spritesheet

The car uses 32 pre-rendered angle frames at 11.25° steps (`CAR.NUM_ANGLE_FRAMES`). Filenames are `car_NNN.png` where `NNN` is the rounded angle in degrees. The asset generator uses Python's banker's rounding (round half-to-even), which differs from JS's `Math.round` (round half toward +∞) on the 0.5 ties: `2 × 11.25 = 22.5` becomes `22` not `23`. `carSprite.ts` uses a `bankersRound` helper to match — without it, the four tie-frames (22, 112, 202, 292) silently 404 and Phaser renders the magenta-on-black missing-texture placeholder.

### Speech recognition

`FrenchSpeechRecognition` wraps the Web Speech API (`fr-FR`, continuous, interim results, 5 alternatives). Transcripts go through `frenchNumberParser` (pure, well-tested), which handles digit forms, French number words, and homophones (`sis→6`, `dis→10`, `sang→100`). `InputController` only emits a `voiceMatch` if the parsed number equals the expected answer — wrong-but-recognized numbers are silently ignored to avoid penalizing misrecognition. Known parser gap: `quatre-vingt-un` and similar parse incorrectly because the dict only has the hyphenated `quatre-vingt: 80` (documented in tests).

### Boost mechanic

Linear mapping: `boost = remainingTime / totalTime`. 6s left = full boost, 0s left = no boost. Wrong answers don't pause the timer — pressure persists.

### Persistence

`localStorage` only, via `StorageManager`:
- Player name
- Input mode (`voice` | `keyboard`)
- Top-10 leaderboard (`LeaderboardManager`)

No server, no analytics.

## Data flow per frame

```
GameScene.update(time, delta)
  → computePerspectiveFactor(car.y)              # depth → speed multiplier
  → VehiclePhysics.update(delta, factor)         # integrate velocity/friction
  → Track.getPositionAt(t ± halfWheelbase)       # rear + front samples → midpoint, heading
  → carSprite.setTexture(frameIndexForHeading(heading))
  → carSprite.setDisplaySize(CAR * computeSizeScale(car.y))   # depth → size
  → MathProblem.updateTimer(delta) + RaceState.markTimeout()  # if timer expired
  → StatisticsTracker.recordLap(...)             # via lap-wrap detection
  → RaceHUD.update({ stats, elapsedTime, velocity })
  → check finished → GameOverScene
```

## Testing

Pure systems have Vitest coverage (~90 tests): `MathProblem`, `VehiclePhysics`, `StatisticsTracker`, `StorageManager`, `LeaderboardManager`, `frenchNumberParser`, `RaceState`, `carSprite`, `svgPathParser`. Scenes and Phaser-coupled code are validated by playtesting. Goal is "catch major breaks", not coverage targets.

## Browser support

Chrome / Edge desktop only. Firefox lacks Web Speech API; Safari is unreliable for French. Keyboard input is always available as fallback.

## Tuning

All balance constants in `src/config/constants.ts` (`as const`). Adjust there, never hardcode in scenes.
