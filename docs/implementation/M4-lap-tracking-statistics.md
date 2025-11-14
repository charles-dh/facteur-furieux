# Milestone 4: Lap Tracking & Statistics

## Summary

This milestone transforms Math Racer from an endless practice session into a complete racing game with goals, progress tracking, and performance metrics. Players will complete 3 laps while the game tracks lap times, accuracy, and overall performance, culminating in a results screen.

**Context:** After M3, we have a fully functional gameplay loop (problems → answers → boosts → car movement), but there's no end condition or performance feedback beyond the immediate "correct/incorrect" messages. The game runs indefinitely without any sense of accomplishment or progress.

**Rationale:**
1. **Goal-oriented gameplay** - 3 laps provides a clear objective and end state
2. **Performance metrics** - Tracking accuracy and times gives educational feedback
3. **Motivation** - Personal best lap times encourage replay and improvement
4. **Preparation for menu** - Statistics need to exist before GameOver screen (M5)
5. **Time-based scoring** - Validates that "faster answers = faster completion" works

**Success Criteria:**
- Car position tracked along track path (0-1 progress)
- Lap counter increments when crossing start/finish line
- After 3 laps, game transitions to GameOver scene
- Statistics displayed during gameplay (lap count, accuracy, times)
- GameOver screen shows final results
- "Play Again" button restarts the game

---

## High-Level Milestones

### 4.1 Implement Lap Detection System
**Goal:** Detect when car crosses start/finish line

**Tasks:**
- [x] Track previous position to detect boundary crossing
- [x] Implement lap completion detection (position wraps from ~1.0 to ~0.0)
- [x] Increment lap counter when crossing detected
- [x] Prevent false positives (crossing in wrong direction)
- [x] Emit event or callback on lap completion

**Lap Detection Logic:**
```javascript
// In GameScene.update()
detectLapCompletion() {
  const currentPos = this.vehiclePhysics.position;
  const previousPos = this.previousPosition || 0;

  // Detect wrap-around from ~1.0 to ~0.0 (forward direction)
  if (previousPos > 0.9 && currentPos < 0.1) {
    this.onLapComplete();
  }

  // Prevent backwards lap counting
  // (If implementing reverse detection: previousPos < 0.1 && currentPos > 0.9)

  this.previousPosition = currentPos;
}
```

**Edge Cases:**
- Car moving very slowly near start/finish (multiple frames at boundary)
- Car stationary exactly at start/finish
- Very fast car crossing multiple times per frame (shouldn't happen at max speed)

**Deliverable:** Reliable lap detection that increments counter correctly

---

### 4.2 Create StatisticsTracker Class
**Goal:** Centralize all game statistics tracking

**Tasks:**
- [x] Create `src/systems/StatisticsTracker.js` class
- [x] Track current lap number
- [x] Track correct answer count
- [x] Track total answer attempts (correct + incorrect)
- [x] Track lap times (current, last, best)
- [x] Track total race time
- [x] Calculate accuracy percentage
- [x] Provide formatted time strings (MM:SS.mmm)

**StatisticsTracker Structure:**
```javascript
class StatisticsTracker {
  constructor()

  // Lap tracking
  currentLap = 1           // 1, 2, 3
  lapStartTime = 0         // Timestamp when lap started
  lapTimes = []            // Array of completed lap times (ms)
  bestLapTime = Infinity   // Personal record

  // Answer tracking
  correctAnswers = 0
  totalAnswers = 0         // Includes incorrect attempts

  // Time tracking
  raceStartTime = 0        // When race began
  totalTime = 0            // Total race duration (ms)

  // Methods
  recordCorrectAnswer()
  recordIncorrectAnswer()
  onLapComplete(currentTime)
  updateTotalTime(currentTime)
  getAccuracy()            // Returns percentage (0-100)
  formatTime(ms)           // Returns "MM:SS.mmm"
  getCurrentLapTime(currentTime)
  getStats()               // Returns all stats for display
}
```

**Time Formatting:**
```javascript
formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
  // Example: "2:34.56"
}
```

**Deliverable:** Complete statistics tracking system

---

### 4.3 Integrate Statistics with Gameplay
**Goal:** Connect statistics to game events

**Tasks:**
- [x] Create StatisticsTracker instance in GameScene
- [x] Update statistics on correct answer
- [x] Update statistics on incorrect answer
- [x] Update statistics on lap completion
- [x] Update total race time every frame
- [x] Reset statistics when starting new game

**Integration Points:**

**In GameScene.create():**
```javascript
this.statistics = new StatisticsTracker();
this.statistics.raceStartTime = this.time.now;
this.statistics.lapStartTime = this.time.now;
```

**In handleCorrectAnswer():**
```javascript
handleCorrectAnswer() {
  // Existing boost logic...

  // Add statistics tracking
  this.statistics.recordCorrectAnswer();

  // Continue with feedback and next problem...
}
```

**In handleIncorrectAnswer():**
```javascript
handleIncorrectAnswer() {
  // Existing feedback logic...

  // Add statistics tracking
  this.statistics.recordIncorrectAnswer();

  // Continue with retry logic...
}
```

**In detectLapCompletion():**
```javascript
onLapComplete() {
  const currentTime = this.time.now;

  // Record lap time
  this.statistics.onLapComplete(currentTime);

  // Increment lap
  this.statistics.currentLap++;

  // Check for game over (3 laps completed)
  if (this.statistics.currentLap > 3) {
    this.endGame();
  }
}
```

**In GameScene.update():**
```javascript
update(time, delta) {
  // Existing update logic...

  // Update total time
  this.statistics.updateTotalTime(time);

  // Detect lap completion
  this.detectLapCompletion();
}
```

**Deliverable:** Statistics tracking integrated with all game events

---

### 4.4 Create HUD Display
**Goal:** Show real-time statistics during gameplay

**Tasks:**
- [x] Create top-left HUD (lap count, accuracy, correct/incorrect)
- [x] Create top-right HUD (lap times, total time)
- [x] Update HUD every frame
- [x] Use retro font and styling
- [x] Ensure readability over track background
- [x] Position to not overlap with problem UI

**HUD Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Lap: 2/3          Last: 1:23.45  Total: 3:45.67     │
│ Accuracy: 87%     Best: 1:18.92                     │
│ ✓ 15  ✗ 3                                           │
│                                                      │
│                   7 × 8 = ?                         │ ← Problem UI
│               [████████░░░░]                        │
│                     56                              │
└─────────────────────────────────────────────────────┘
```

**UI Elements:**
```javascript
// In GameScene.create()

// Top-left HUD
this.hudLeftText = this.add.text(10, 10, '', {
  fontFamily: '"Press Start 2P"',
  fontSize: '12px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
  lineSpacing: 8
}).setOrigin(0, 0);

// Top-right HUD
this.hudRightText = this.add.text(790, 10, '', {
  fontFamily: '"Press Start 2P"',
  fontSize: '12px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
  lineSpacing: 8,
  align: 'right'
}).setOrigin(1, 0);
```

**Update Logic:**
```javascript
updateHUD() {
  const stats = this.statistics.getStats();

  // Left HUD
  const leftText = [
    `Lap: ${stats.currentLap}/3`,
    `Accuracy: ${stats.accuracy}%`,
    `✓ ${stats.correctAnswers}  ✗ ${stats.incorrectAnswers}`
  ].join('\n');
  this.hudLeftText.setText(leftText);

  // Right HUD
  const currentLapTime = this.statistics.getCurrentLapTime(this.time.now);
  const rightText = [
    `Current: ${this.statistics.formatTime(currentLapTime)}`,
    stats.lastLapTime ? `Last: ${this.statistics.formatTime(stats.lastLapTime)}` : '',
    stats.bestLapTime !== Infinity ? `Best: ${this.statistics.formatTime(stats.bestLapTime)}` : ''
  ].filter(line => line).join('\n');
  this.hudRightText.setText(rightText);
}
```

**Deliverable:** Clear, readable HUD with live statistics

---

### 4.5 Create GameOverScene
**Goal:** Display final results and allow replay

**Tasks:**
- [x] Create `src/scenes/GameOverScene.js`
- [x] Design results screen layout
- [x] Display final statistics (total time, best lap, accuracy)
- [x] Add "Play Again" button
- [x] Transition back to GameScene on button click
- [x] Pass statistics data from GameScene to GameOverScene

**GameOverScene Structure:**
```javascript
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    // Receive statistics from GameScene
    this.finalStats = data.stats;
  }

  create() {
    // Display title
    // Display statistics
    // Create "Play Again" button
  }
}
```

**Results Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│        COURSE TERMINÉE!             │
│                                     │
│     Total Time: 5:43.21             │
│     Best Lap:   1:18.92             │
│     Accuracy:   87%                 │
│                                     │
│     Correct:    24                  │
│     Incorrect:  4                   │
│                                     │
│     [ REJOUER ]                     │
│                                     │
└─────────────────────────────────────┘
```

**UI Implementation:**
```javascript
create() {
  // Background (darker overlay)
  this.add.rectangle(400, 400, 800, 800, 0x000000, 0.7);

  // Title
  this.add.text(400, 150, 'COURSE TERMINÉE!', {
    fontFamily: '"Press Start 2P"',
    fontSize: '32px',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5);

  // Statistics
  const stats = this.finalStats;
  const statsText = [
    `Total Time: ${this.formatTime(stats.totalTime)}`,
    `Best Lap:   ${this.formatTime(stats.bestLapTime)}`,
    `Accuracy:   ${stats.accuracy}%`,
    '',
    `Correct:    ${stats.correctAnswers}`,
    `Incorrect:  ${stats.incorrectAnswers}`
  ].join('\n');

  this.add.text(400, 320, statsText, {
    fontFamily: '"Press Start 2P"',
    fontSize: '16px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
    lineSpacing: 12
  }).setOrigin(0.5);

  // Play Again button
  const button = this.add.text(400, 550, '[ REJOUER ]', {
    fontFamily: '"Press Start 2P"',
    fontSize: '20px',
    color: '#00ff00',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => button.setColor('#ffff00'))
    .on('pointerout', () => button.setColor('#00ff00'))
    .on('pointerdown', () => this.restartGame());
}

restartGame() {
  this.scene.start('GameScene');
}
```

**Scene Transition:**
```javascript
// In GameScene
endGame() {
  // Stop physics/timers
  this.mathProblem.timerActive = false;

  // Transition to GameOver with stats
  this.scene.start('GameOverScene', {
    stats: this.statistics.getStats()
  });
}
```

**Deliverable:** Complete GameOver screen with replay functionality

---

### 4.6 Add Restart Button to GameScene
**Goal:** Allow mid-game restart

**Tasks:**
- [x] Add restart button to top-right corner of GameScene
- [x] Make it small and unobtrusive
- [x] Clicking button restarts game immediately
- [x] Confirm dialog optional (can add later)

**Implementation:**
```javascript
// In GameScene.create()
this.restartButton = this.add.text(770, 760, '⟲', {
  fontFamily: '"Press Start 2P"',
  fontSize: '20px',
  color: '#888888',
  stroke: '#000000',
  strokeThickness: 3
}).setOrigin(1, 1)
  .setInteractive({ useHandCursor: true })
  .on('pointerover', () => this.restartButton.setColor('#ffffff'))
  .on('pointerout', () => this.restartButton.setColor('#888888'))
  .on('pointerdown', () => this.restartGame());

restartGame() {
  this.scene.restart();
}
```

**Deliverable:** Functional restart button for quick retry

---

### 4.7 Testing and Validation
**Goal:** Verify all tracking and transitions work correctly

**Tasks:**
- [x] Test lap detection accuracy (no false positives/negatives)
- [x] Test statistics accuracy (correct/incorrect counting)
- [x] Test lap time recording
- [x] Test best lap tracking (updates when beaten)
- [x] Test game over trigger (exactly at lap 3 completion)
- [x] Test scene transition to GameOver
- [x] Test "Play Again" functionality
- [x] Test restart button
- [x] Verify HUD updates correctly
- [x] Test edge cases

**Testing Scenarios:**

**Scenario 1: Complete normal race**
- Play through 3 laps
- Answer mix of correct/incorrect
- Verify lap times recorded
- Verify best lap identified correctly
- Verify game ends after lap 3
- Verify GameOver shows correct stats
- Click "Play Again"
- Verify game restarts with clean state

**Scenario 2: Fast perfect run**
- Answer all questions correctly and quickly
- Complete 3 laps as fast as possible
- Verify accuracy shows 100%
- Verify total time is minimal
- Verify all lap times recorded

**Scenario 3: Slow/timeout run**
- Let many questions timeout
- Complete 3 laps very slowly
- Verify accuracy reflects poor performance
- Verify lap times are slow
- Verify game still completes normally

**Scenario 4: Mid-race restart**
- Start race, complete 1 lap
- Click restart button
- Verify game resets to lap 1
- Verify statistics reset

**Scenario 5: Lap boundary edge case**
- Position car near start/finish (position ~0.95)
- Answer questions slowly so car barely moves
- Verify lap detection works even with slow crossing

**Edge Cases:**
- [x] Car stationary at start (doesn't count false lap)
- [x] First lap detection (crossing from lap 0 to lap 1)
- [x] Lap 3 completion (triggers game over, not lap 4)
- [x] Zero incorrect answers (100% accuracy)
- [x] Zero correct answers (0% accuracy, shouldn't crash)
- [x] Division by zero in accuracy calculation

**Deliverable:** Fully validated lap tracking and statistics system

---

## Technical Architecture

### Updated File Structure
```
/src
  /scenes
    GameScene.js          ✅ Updated with lap detection, HUD, game over trigger
    GameOverScene.js      ✅ NEW: Results screen
  /systems
    Track.js              (unchanged)
    VehiclePhysics.js     (unchanged)
    MathProblem.js        (unchanged)
    StatisticsTracker.js  ✅ NEW: Statistics tracking
  /config
    colors.js             (unchanged)
    constants.js          (verify GAME.LAPS_TO_COMPLETE = 3)
    gameConfig.js         ✅ Updated with GameOverScene
  main.js                 ✅ Updated to include GameOverScene
```

### Key Classes

**StatisticsTracker** (`src/systems/StatisticsTracker.js`)
```javascript
class StatisticsTracker {
  constructor()

  // Properties
  currentLap
  lapStartTime
  lapTimes
  bestLapTime
  correctAnswers
  totalAnswers
  raceStartTime
  totalTime

  // Methods
  recordCorrectAnswer()
  recordIncorrectAnswer()
  onLapComplete(currentTime)
  updateTotalTime(currentTime)
  getAccuracy()
  formatTime(ms)
  getCurrentLapTime(currentTime)
  getStats()
}
```

**GameOverScene** (`src/scenes/GameOverScene.js`)
```javascript
class GameOverScene extends Phaser.Scene {
  constructor()
  init(data)          // Receive stats from GameScene
  create()            // Display results and button
  restartGame()       // Transition back to GameScene
  formatTime(ms)      // Helper for time formatting
}
```

**GameScene Updates**
```javascript
// New properties
this.statistics
this.previousPosition
this.hudLeftText
this.hudRightText
this.restartButton

// New methods
detectLapCompletion()
onLapComplete()
updateHUD()
endGame()
restartGame()
```

---

## Scene Configuration

Update `src/main.js`:
```javascript
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

gameConfig.scene = [GameScene, GameOverScene];
```

---

## Constants Verification

Ensure this exists in `src/config/constants.js`:

```javascript
export const GAME = {
  LAPS_TO_COMPLETE: 3,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800
};
```

---

## Game Flow After M4

**Complete Race Flow:**

1. Game starts → Lap 1, timer = 0:00.00
2. Answer problems, car moves
3. Cross start/finish → Lap 2, record lap 1 time
4. Continue answering problems
5. Cross start/finish → Lap 3, record lap 2 time
6. Continue answering problems
7. Cross start/finish → Lap 3 complete → Game Over
8. GameOverScene displays results
9. Click "Play Again" → Return to GameScene with reset state

**HUD continuously shows:**
- Current lap (1/3, 2/3, 3/3)
- Current lap time (live)
- Last lap time (after lap 1+)
- Best lap time (personal record)
- Accuracy percentage
- Correct/incorrect counts

---

## Statistics Calculations

**Accuracy:**
```javascript
getAccuracy() {
  if (this.totalAnswers === 0) return 0;
  return Math.round((this.correctAnswers / this.totalAnswers) * 100);
}
```

**Incorrect Count:**
```javascript
getIncorrectAnswers() {
  return this.totalAnswers - this.correctAnswers;
}
```

**Current Lap Time:**
```javascript
getCurrentLapTime(currentTime) {
  return currentTime - this.lapStartTime;
}
```

**Lap Completion:**
```javascript
onLapComplete(currentTime) {
  const lapTime = currentTime - this.lapStartTime;

  // Record lap time
  this.lapTimes.push(lapTime);

  // Update best lap
  if (lapTime < this.bestLapTime) {
    this.bestLapTime = lapTime;
  }

  // Reset lap timer
  this.lapStartTime = currentTime;
}
```

---

## Integration with Future Milestones

**Milestone 5** will add:
- MenuScene before GameScene
- Table selection passes to MathProblem
- Player name input (displayed in results)
- "Play Again" returns to MenuScene (not GameScene)

**Milestone 6** will add:
- Voice input (statistics unchanged)

**Milestone 7** will add:
- Audio feedback on lap completion
- Visual effects for lap crossing

**StatisticsTracker remains unchanged** through all future milestones.

---

## Testing Strategy

### Manual Testing Procedure

1. **Basic Lap Detection:**
   - Start game
   - Answer problems until lap 1 complete
   - Verify lap counter shows "2/3"
   - Verify lap 1 time recorded in HUD
   - Complete lap 2
   - Verify lap counter shows "3/3"
   - Complete lap 3
   - Verify transition to GameOver

2. **Statistics Accuracy:**
   - Track answers manually (paper/pen)
   - Compare with game's displayed counts
   - Verify accuracy percentage is correct
   - Test edge case: 0 incorrect (100%)
   - Test edge case: 0 correct (0%)

3. **Best Lap Tracking:**
   - Complete lap 1 slowly (e.g., 2:00)
   - Complete lap 2 faster (e.g., 1:30)
   - Verify "Best" updates to 1:30
   - Complete lap 3 slower (e.g., 1:45)
   - Verify "Best" stays at 1:30

4. **Scene Transitions:**
   - Complete full race
   - Verify smooth transition to GameOver
   - Verify all stats shown correctly
   - Click "Play Again"
   - Verify return to game
   - Verify stats reset to 0

5. **Restart Button:**
   - Start race, complete 1 lap
   - Click restart button
   - Verify immediate restart
   - Verify stats reset

### Visual Validation

- HUD text is readable over all track areas
- HUD doesn't overlap problem UI
- GameOver screen is centered and clear
- Button hover states work correctly
- Time formatting is consistent

### Code Quality

- Follow CLAUDE.md guidelines
- Comment lap detection logic (boundary crossing)
- Explain accuracy calculation edge case (division by zero)
- Document scene transition data passing

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** ✅ COMPLETED

**Implementation Notes:**
- StatisticsTracker class implemented with lap times, accuracy, and answer tracking
- Lap detection working via boundary crossing (0.9 → 0.1)
- GameOverScene created with results display and Play Again button
- HUD showing lap counter, accuracy, lap times in real-time
- GameScene properly passes configuration data to/from other scenes
- All statistics properly recorded during gameplay
- Race ends correctly after 3 laps

**Next Steps After Completion:**
1. Commit Milestone 4 work ← READY
2. Begin Milestone 5: Menu System & Configuration

---

## Notes & Considerations

### Lap Detection Method

**Why boundary crossing detection?**
- Position wraps from ~1.0 to ~0.0 naturally
- Simple to detect: `previousPos > 0.9 && currentPos < 0.1`
- Works regardless of car speed
- No need for collision detection

**Why 0.9/0.1 threshold?**
- Gives buffer zone to prevent false detection
- Even at max speed, car won't skip the detection zone
- Prevents micro-oscillations near 1.0 from triggering

### Time Display Format

**MM:SS.mmm format chosen because:**
- Clear for lap times (typically 30s - 3min)
- Centiseconds (2 digits) sufficient precision
- Familiar format from racing games
- Easy to compare times visually

### Best Lap Tracking

**Always tracks best lap during race:**
- Doesn't persist between sessions (MVP)
- Could add localStorage persistence later
- Motivates players to improve within session

### Game Over Condition

**Exactly 3 laps:**
- Game ends when lap 4 would start
- Not after 3 complete laps + partial lap
- Clean, clear end condition
- Counter shows "3/3" on final lap

### Statistics Reset

**When "Play Again" clicked:**
- All stats reset to 0
- Lap counter reset to 1
- Best lap reset to Infinity
- Clean slate for new race

In M5, this will change to return to MenuScene instead.
