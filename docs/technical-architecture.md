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
    VehiclePhysics.ts     # velocity / friction / boost
    MathProblem.ts        # Problem generation, timer, boost calculation
    StatisticsTracker.ts  # Lap times, accuracy, race timer
    LeaderboardManager.ts # Top-10 persistence
    StorageManager.ts     # localStorage helpers (player name, input mode)
    frenchNumberParser.ts # Pure parser for spoken French numbers (homophones included)
    FrenchSpeechRecognition.js  # Web Speech API wrapper
    AudioManager.js       # SFX + engine sound coordination
    SoundGenerator.js     # Procedural Web Audio synthesis
    ParticleEffects.js    # Boost/celebration/flash particles
    Track.js              # Phaser Curves.Path + lap detection

  config/
    constants.ts          # PHYSICS, TIMING, BOOST, GAME, TRACK, CAR
    colors.ts             # Palette
    audioConfig.ts        # AUDIO + EFFECTS
    gameConfig.ts         # Phaser game config

  main.ts                 # Entry point

tests/                    # Vitest, ~70 tests on pure systems
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
  → VehiclePhysics.update(delta)         # integrate velocity/friction
  → Track.getPositionAt(progress)        # progress → {x, y, angle}
  → carSprite.setPosition(...)
  → RaceState.tick(delta)                # decrement timer, fire timeout
  → StatisticsTracker.update(...)        # lap detection, race clock
  → RaceHUD.update({ stats, elapsedTime, velocity })
  → check finished → GameOverScene
```

## Testing

Pure systems have Vitest coverage (~70 tests): `MathProblem`, `VehiclePhysics`, `StatisticsTracker`, `StorageManager`, `LeaderboardManager`, `frenchNumberParser`, `RaceState`. Scenes and Phaser-coupled code are validated by playtesting. Goal is "catch major breaks", not coverage targets.

## Browser support

Chrome / Edge desktop only. Firefox lacks Web Speech API; Safari is unreliable for French. Keyboard input is always available as fallback.

## Tuning

All balance constants in `src/config/constants.ts` (`as const`). Adjust there, never hardcode in scenes.
