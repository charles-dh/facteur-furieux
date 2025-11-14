# Math Racer - Technical Architecture

## Technology Stack

### Core Framework
- **Phaser 3** (v3.80+): 2D game framework
  - Scene management
  - Asset loading with progress tracking
  - Path system for track definition
  - Animation and particle effects
  - Input handling

### Build System
- **Vite**: Modern build tool
  - Fast development server with HMR
  - ES6 module support
  - Asset optimization
  - Simple configuration

### Language
- **JavaScript (ES6+)**: No TypeScript for MVP (can add later)
  - Class-based architecture
  - Modules for clean separation

### Audio
- **Web Audio API** (via Phaser): Sound effects and engine audio

### Speech Recognition
- **Web Speech API**: Client-side voice recognition
  - Chrome/Edge recommended (best French support)
  - Custom French number parser
  - Multi-strategy recognition for homophones

## Architecture Overview

**Game perspective**: Top-down (bird's eye view) racing game. The camera is fixed overhead, showing the entire track. The car sprite moves along the track path in 2D space.

### Separation of Concerns

**Physics Layer** (track-agnostic)
- Vehicle physics simulation
- Independent of track shape
- Velocity, acceleration, friction calculations
- Car can stop completely (zero velocity)

**Track Layer** (visual representation)
- Path definition (coordinates, curves)
- Converts progress (0-1) to world position
- Visual rendering only (top-down graphics)

**Game Logic Layer**
- Problem generation
- Answer validation
- Time-based performance tracking (no point scoring)
- Game state management

**Input Layer**
- Speech recognition service
- Keyboard input handling
- Event dispatching to game logic

**Presentation Layer**
- Top-down rendering of track and car
- UI overlay (problem, timer, stats)
- Visual effects (boost particles, timer bar)

## Core Systems

### 1. Scene Architecture

**MenuScene**
- Player configuration
- Multiplication table selection
- Transition to GameScene with selected options

**GameScene**
- Main gameplay loop
- Renders track, car, UI
- Coordinates all game systems
- Handles game over condition (3 laps)

**GameOverScene**
- Results display
- Statistics summary
- Restart functionality

### 2. Vehicle Physics System

**Design principle**: Track-independent physics

```
VehiclePhysics class:
- position: 0-1 (progress along track)
- velocity: units per second
- acceleration: current frame acceleration
- maxSpeed: velocity cap
- friction: decay rate per frame

Methods:
- update(deltaTime): Apply physics calculations
- applyBoost(multiplier): Add acceleration based on timer
```

**Key characteristics**:
- Arcade-style (simplified, tunable)
- **CAN stop completely** (velocity = 0) when no boosts applied
- Smooth momentum between problems
- Responsive to quick answer sequences
- Friction always applies (continuous deceleration)

**Critical tuning parameters**:
- Base friction: ~0.98 (retains 98% velocity per frame)
- Max speed: ~5 units/second
- Boost power: Linear scale based on remaining timer
- **No minimum velocity** (car can stop entirely)

### 3. Track System

**MVP approach**: Programmatic path definition

```
Track class:
- path: Phaser.Curves.Path object
- length: Total track length
- laps: Number of laps to complete

Methods:
- getPositionAt(t): Convert 0-1 progress → {x, y, angle}
- checkLapComplete(position): Detect lap boundary crossing
```

**Initial track shape**:
- Random curved path (not circular)
- Closed loop
- Defined with 6-8 control points
- Uses Phaser spline curves for smoothness

**Rendering**: Top-down view
- Track rendered as thick path/stroke
- Car sprite rotates to match path tangent
- Fixed camera showing entire track

**Future**: Load from JSON/SVG for visual editor support

### 4. Problem Generation System

```
MathProblem class:
- selectedTables: Array of chosen multiplication tables
- currentProblem: {a, b, answer}
- timer: Frames remaining (6 seconds = 360 frames at 60fps)
- timerActive: Boolean

Methods:
- generate(): Create new problem from selected tables
- updateTimer(delta): Decrement timer
- checkAnswer(input): Validate player answer
- calculateBoost(): Map timer → boost multiplier (linear: 6s→1.0, 0s→0.0)
- handleTimeout(): Auto-advance to next problem (NO boost)
```

**Timing flow**:
1. New problem appears, timer starts (360 frames)
2. Player answers correctly → boost applied (strength = remaining timer), 30-frame delay
3. New problem appears
4. Player answers incorrectly → no boost, timer keeps running, can retry
5. OR timer expires → **NO boost**, 10-frame delay, new problem

**Critical mechanics**:
- Wrong answers don't stop the timer (pressure to answer quickly even after mistakes)
- Timer expiring = no boost = car loses momentum
- Delays must be short enough to maintain flow between problems

### 5. Speech Recognition System

**Multi-strategy French number parser**

```
FrenchSpeechRecognition class:
- recognition: Web Speech API instance
- expectedAnswer: Current correct answer
- strategies: Array of parsing methods

Methods:
- start(): Begin listening
- stop(): Stop listening
- parseNumber(transcript):
  - Strategy 1: Direct digit match ("12")
  - Strategy 2: French words ("douze")
  - Strategy 3: Phonetic homophones ("sang" → "cent")
  - Strategy 4: Spelled digits ("un deux" → "12")
- setExpectedAnswer(number): Update context for recognition
```

**Configuration**:
- Language: `fr-FR`
- Continuous: `true`
- InterimResults: `true` (for real-time feedback)
- MaxAlternatives: `5` (check multiple interpretations)

**Homophone handling**:
- Map common misrecognitions to correct numbers
- Examples: "dis"→10, "sang"→100, "sis"→6
- Accept close matches for expected answer

**Visual feedback**:
- Display what's being heard in real-time
- Show suggested answer format (e.g., "Dites: douze")
- Confidence indicator

### 6. Statistics Tracker

**No point-based scoring** - performance measured by time only.

```
StatisticsTracker class:
- lap: Current lap number
- correctAnswers, totalAnswers: For accuracy calculation
- lapTimes: Array of completed lap times
- bestLapTime: Personal record
- totalTime: Race duration

Methods:
- recordCorrectAnswer(): Increment correct counter
- recordIncorrectAnswer(): Increment total counter
- updateLap(carPosition): Detect lap completion, record lap time
- updateTotalTime(delta): Increment race clock
- getAccuracy(): Calculate correctAnswers / totalAnswers
- formatTime(seconds): Convert to MM:SS display
```

**Display elements**:
- Top-left: Lap count, accuracy %, correct/incorrect count
- Top-right: Lap times (current, last, best), total time
- Always visible during gameplay

## Data Flow

### Game Loop (60 FPS)

```
GameScene.update(time, delta):
1. VehiclePhysics.update(delta)
   → Updates position based on velocity/acceleration

2. Track.getPositionAt(position)
   → Converts position to screen coordinates

3. CarSprite.setPosition(x, y, angle)
   → Updates visual representation

4. MathProblem.updateTimer(delta)
   → Decrements timer, handles timeout (no boost on expire)

5. StatisticsTracker.updateLap(position)
   → Checks for lap completion

6. StatisticsTracker.updateTotalTime(delta)
   → Increments race clock

7. Check game over (lap >= 3)
   → Transition to GameOverScene
```

### Answer Flow

```
Player speaks → Web Speech API transcription
                ↓
FrenchSpeechRecognition.parseNumber()
                ↓
MathProblem.checkAnswer()
                ↓
If correct:
  - Calculate boost = f(remaining timer) [linear: 6s→1.0x, 0s→0x]
  - VehiclePhysics.applyBoost(boost)
  - StatisticsTracker.recordCorrectAnswer()
  - MathProblem.delayBeforeNext = 30 frames
  - Audio: correctSound
  - Generate next problem after delay

If incorrect:
  - StatisticsTracker.recordIncorrectAnswer()
  - Audio: wrongSound
  - Timer keeps running (no pause)
  - Player can retry immediately
  - NO velocity penalty (timer waste is penalty enough)

If timer expires:
  - NO boost applied (critical: car loses momentum)
  - MathProblem.delayBeforeNext = 10 frames
  - Generate next problem after delay
  - Car continues moving only from existing velocity (decaying via friction)
```

## Visual Design & Assets

### MVP Approach: Code-Generated Graphics

**Philosophy**: Start with procedural graphics to focus on gameplay, add assets later.

**Benefits**:
- Zero asset loading/management
- Instant iteration on visuals
- Authentic retro arcade aesthetic
- Easy prototyping

### Top-Down Rendering

**Track**:
```javascript
// Simple stroke-based track
graphics.lineStyle(60, 0x404040); // 60px wide gray track
graphics.strokePath(trackPath);

// Center line (dashed)
graphics.lineStyle(3, 0xffffff, 1);
graphics.setLineDash([10, 10]);
graphics.strokePath(trackPath);

// Start/finish line
graphics.fillRect(startX - 5, startY - 30, 10, 60, 0xff0000);
```

**Car**:
```javascript
// Simple geometric car (triangle or rectangle)
graphics.fillStyle(0xff0000, 1); // Red
graphics.fillTriangle(0, -10, -8, 10, 8, 10); // Wedge shape

// Or even simpler: rectangle
graphics.fillRect(-6, -10, 12, 20, 0xff0000);
```

**Background**:
```javascript
// Solid grass color
this.add.rectangle(400, 400, 800, 800, 0x00aa00);
```

### Retro Arcade Visual Style

**Color palette**:
```javascript
export const COLORS = {
  CAR_RED: 0xff0000,
  TRACK_GRAY: 0x404040,
  GRASS_GREEN: 0x00aa00,
  UI_TEXT: 0xffffff,
  UI_ACCENT: 0xffff00,
  TIMER_GREEN: 0x00ff00,
  TIMER_YELLOW: 0xffff00,
  TIMER_RED: 0xff0000
};
```

**Typography**:
```html
<!-- In index.html -->
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

```javascript
// In Phaser
this.add.text(x, y, "MATH RACER", {
  fontFamily: '"Press Start 2P"',
  fontSize: '24px',
  color: '#ffff00',
  stroke: '#000000',
  strokeThickness: 4
});
```

**Effects**:
- Boost particles: Simple colored squares with additive blending
- Timer bar: Color-coded rectangle (green → yellow → red)
- Speed lines: Procedural lines stretching from car

### Asset Upgrade Path (Post-MVP)

**When ready to add sprites**:

1. **Download free assets**:
   - Kenney.nl racing pack (top-down cars)
   - OpenGameArt.org track tiles

2. **Replace graphics with sprites**:
```javascript
// Before (MVP):
this.car = this.add.graphics();
this.car.fillTriangle(...);

// After (one line change):
this.car = this.add.sprite(x, y, 'carSprite');
```

3. **Physics/logic unchanged** - only visual representation swapped

### No Assets Required for MVP

**Everything code-generated**:
- Track: Phaser path + stroke
- Car: Graphics primitives (triangle/rect)
- UI: Web fonts + rectangles
- Effects: Particle system with colored squares
- Sounds: Web Audio oscillators

**Assets folder**: Empty for MVP (or single pixel for particle system)

## File Structure

```
/src
  /scenes
    MenuScene.js          # Welcome screen
    GameScene.js          # Main gameplay
    GameOverScene.js      # Results screen

  /systems
    VehiclePhysics.js     # Physics calculations
    Track.js              # Path and positioning
    MathProblem.js        # Problem generation
    StatisticsTracker.js  # Time and accuracy tracking
    FrenchSpeechRecognition.js  # Voice input

  /config
    gameConfig.js         # Phaser configuration
    constants.js          # Game parameters (tuning values)
    colors.js             # Retro color palette

  main.js                 # Entry point, game initialization

/assets
  (empty for MVP - all graphics code-generated)

/public
  index.html              # HTML shell

package.json              # Dependencies
vite.config.js            # Build configuration
```

## Key Design Decisions

### Why Phaser 3?
- Mature game framework with complete feature set
- Built-in scene management (no manual DOM manipulation)
- Excellent path/curve system for track definition
- Active community and documentation
- Performance optimized for 2D games

### Why Custom Physics (Not Phaser's Built-in)?
**We're NOT using Phaser's physics engines** (Arcade, Matter.js)
- Racing games need custom physics tuning
- Track-following is spatial, not physical collision-based
- Simpler to tune custom velocity/friction model
- More predictable behavior for educational game

### Why Client-Side Speech Recognition?
- No server infrastructure required
- No latency (recognition happens locally in Chrome)
- No privacy concerns (audio not sent to server)
- Free (no API costs)
- Trade-off: Lower accuracy, but acceptable with multi-strategy parser

### Why Not TypeScript?
- Faster MVP development
- Less boilerplate for small project
- Can add later if project grows
- Team familiarity with vanilla JS

### Why Code-Generated Graphics?
- Fastest path to playable prototype
- No asset pipeline setup needed
- Authentic retro arcade look
- Easy to swap for sprites later
- Forces focus on gameplay mechanics

## Performance Targets

- **60 FPS** gameplay on modern desktop browsers
- **<1 second** speech recognition response time
- **<100ms** delay between correct answer and boost application
- **Smooth momentum** with no visible stuttering between problems

## Browser Compatibility

**Primary target**: Chrome/Edge (desktop)
- Best Web Speech API support
- Most reliable French recognition

**Fallback**: Keyboard input always available

**Not supported**: Firefox (no Web Speech API), Safari (limited support)

## Configuration & Tuning

All game parameters centralized in `constants.js`:

```javascript
export const PHYSICS = {
  MAX_SPEED: 5,
  FRICTION: 0.98,              // Applies every frame (continuous slowdown)
  BASE_ACCELERATION: 0.005,
  MIN_VELOCITY: 0              // Car CAN stop completely
};

export const TIMING = {
  PROBLEM_TIMER: 6 * 60,        // 6 seconds at 60fps
  CORRECT_ANSWER_DELAY: 30,     // 0.5 seconds
  TIMEOUT_DELAY: 10,            // 0.16 seconds
  FEEDBACK_DURATION: 60         // 1 second
};

export const BOOST = {
  // Linear mapping: remainingTime/totalTime → boost multiplier
  // 6 seconds remaining = 1.0x boost
  // 0 seconds remaining = 0.0x boost (no boost on timeout)
  SCALE: 1.0
};

export const GAME = {
  LAPS_TO_COMPLETE: 3,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800
};
```

This allows rapid iteration on feel/balance without code changes.

## Testing Strategy

**MVP focus**: Manual playtesting for feel/balance

**Key test scenarios**:
1. Quick consecutive correct answers → car should accelerate smoothly
2. Slow answers (timer running low) → weaker boosts, car slows down
3. **Timer expires** → no boost, car should visibly lose momentum and potentially stop
4. Wrong answers → timer keeps running, can retry, no velocity penalty
5. Complete stop scenario → car velocity reaches zero, must get boost to move again
6. Speech recognition → test all numbers 2-100 in French
7. Lap detection → accurate crossing detection without false positives

**Tools**:
- Debug mode: Display physics values on screen (velocity, position, timer)
- Keyboard shortcuts: Manual boost testing (bypass speech)
- Timer override: Test different answer speeds
- Friction tuning UI: Real-time parameter adjustment

