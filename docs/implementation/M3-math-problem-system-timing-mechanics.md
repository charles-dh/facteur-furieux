# Milestone 3: Math Problem System & Timing Mechanics

## Summary

This milestone implements the core educational gameplay loop: multiplication problems appear with a countdown timer, players answer using keyboard input, and correct answers provide speed boosts proportional to how quickly they answered. This is where Math Racer transforms from a tech demo into an actual game.

**Context:** After M1 (visual foundation) and M2 (physics system), we have a car that can be boosted manually. M3 replaces manual spacebar boosts with the actual game mechanic: solving math problems to earn boosts.

**Rationale:**
1. This is the heart of the educational value - multiplication practice
2. Timer creates urgency and rewards quick mental calculation
3. Boost strength tied to timer creates strategic depth (fast = strong boost)
4. Wrong answers don't penalize velocity but waste timer (elegant design)
5. Validates the complete gameplay loop before adding complexity (menus, speech)

**Success Criteria:**
- Problems appear automatically with 6-second countdown
- Timer bar visually shows remaining time (green → yellow → red)
- Typing correct answer → boost applied, strength = f(remaining timer)
- Typing wrong answer → timer keeps running, can retry
- Timer expires → no boost, new problem appears
- Car behavior matches problem-solving performance (fast answers = fast car)

---

## High-Level Milestones

### 3.1 Create MathProblem Class
**Goal:** Generate and validate multiplication problems

**Tasks:**
- [ ] Create `src/systems/MathProblem.js` class
- [ ] Implement problem generation logic
- [ ] Add configurable multiplication tables (for testing, use tables 2-5)
- [ ] Implement answer validation
- [ ] Add method to check if answer is correct
- [ ] Prevent duplicate problems in same session

**Problem Generation Logic:**
```javascript
class MathProblem {
  constructor(selectedTables) // e.g., [2, 3, 5]

  generate() {
    // Pick random table from selectedTables
    // Pick random second factor (2-10)
    // Calculate correct answer
    // Return {a, b, answer}
  }

  checkAnswer(input) {
    return parseInt(input) === this.currentProblem.answer;
  }
}
```

**Requirements:**
- At least one factor must be from selected tables
- Second factor ranges from 2-10
- No duplicate problems until all combinations exhausted
- Example: Tables [5, 7] → valid: 5×3, 7×8, 4×5, 9×7

**Deliverable:** MathProblem class that generates valid problems

---

### 3.2 Add Timer System
**Goal:** Implement countdown timer with frame-based tracking

**Tasks:**
- [ ] Add timer properties to MathProblem class
- [ ] Implement `updateTimer(delta)` method
- [ ] Timer starts at 6 seconds (360 frames at 60 FPS)
- [ ] Timer counts down each frame
- [ ] Emit event or flag when timer expires
- [ ] Calculate remaining time percentage (0-1)

**Timer Implementation:**
```javascript
class MathProblem {
  timer = 0              // Frames remaining
  timerMax = 360         // 6 seconds at 60 FPS (from TIMING.PROBLEM_TIMER)
  timerActive = false

  startTimer() {
    this.timer = this.timerMax;
    this.timerActive = true;
  }

  updateTimer(delta) {
    if (!this.timerActive) return;

    this.timer -= delta / (1000 / 60); // Convert delta to frames

    if (this.timer <= 0) {
      this.timer = 0;
      this.handleTimeout();
    }
  }

  getRemainingPercent() {
    return this.timer / this.timerMax; // 0-1
  }
}
```

**Deliverable:** Working countdown timer integrated with problem system

---

### 3.3 Implement Boost Calculation
**Goal:** Map remaining timer to boost strength (linear)

**Tasks:**
- [ ] Add `calculateBoost()` method to MathProblem
- [ ] Implement linear mapping: 100% timer = 1.0x boost, 0% timer = 0x boost
- [ ] Use remaining timer percentage for calculation
- [ ] Return boost multiplier to apply to VehiclePhysics

**Boost Formula:**
```javascript
calculateBoost() {
  // Linear mapping: remaining time → boost multiplier
  // 6 seconds remaining (100%) = 1.0x boost (maximum)
  // 3 seconds remaining (50%)  = 0.5x boost
  // 0 seconds remaining (0%)   = 0.0x boost (no boost)

  const remainingPercent = this.getRemainingPercent();
  return remainingPercent * BOOST.SCALE; // BOOST.SCALE = 1.0
}
```

**Example Scenarios:**
- Answer at 6.0s remaining → boost = 1.0 (full strength)
- Answer at 3.0s remaining → boost = 0.5 (half strength)
- Answer at 1.0s remaining → boost = 0.17 (weak)
- Answer at 0.0s (timeout) → boost = 0.0 (none)

**Deliverable:** Boost calculation that rewards speed

---

### 3.4 Create Problem UI Overlay
**Goal:** Display problem and timer on screen

**Tasks:**
- [ ] Create problem text display (centered on screen)
- [ ] Create timer bar (visual countdown)
- [ ] Create answer input display (show what user is typing)
- [ ] Create feedback text (correct/incorrect messages)
- [ ] Style UI with retro arcade aesthetic
- [ ] Position elements for clear readability over track

**UI Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         7 × 8 = ?                   │ ← Problem (large text)
│                                     │
│    [████████░░░░░░░░░░]             │ ← Timer bar (green→yellow→red)
│                                     │
│         56_                         │ ← Current answer (typing)
│                                     │
│         Correct! +0.8 boost         │ ← Feedback (temporary)
│                                     │
└─────────────────────────────────────┘
```

**UI Elements:**
```javascript
// In GameScene.create()

// Problem display
this.problemText = this.add.text(400, 250, '', {
  fontFamily: '"Press Start 2P"',
  fontSize: '32px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 6
}).setOrigin(0.5);

// Timer bar background
this.timerBarBg = this.add.rectangle(400, 320, 400, 20, 0x333333);

// Timer bar fill (changes color)
this.timerBarFill = this.add.rectangle(400, 320, 400, 20, 0x00ff00)
  .setOrigin(0.5);

// Answer display
this.answerText = this.add.text(400, 360, '', {
  fontFamily: '"Press Start 2P"',
  fontSize: '24px',
  color: '#ffff00',
  stroke: '#000000',
  strokeThickness: 4
}).setOrigin(0.5);

// Feedback text
this.feedbackText = this.add.text(400, 410, '', {
  fontFamily: '"Press Start 2P"',
  fontSize: '16px',
  color: '#00ff00',
  stroke: '#000000',
  strokeThickness: 3
}).setOrigin(0.5);
```

**Timer Bar Color Logic:**
```javascript
updateTimerBar() {
  const percent = this.mathProblem.getRemainingPercent();

  // Update width
  this.timerBarFill.width = 400 * percent;

  // Update color (green → yellow → red)
  if (percent > 0.5) {
    this.timerBarFill.setFillStyle(COLORS.TIMER_GREEN);
  } else if (percent > 0.25) {
    this.timerBarFill.setFillStyle(COLORS.TIMER_YELLOW);
  } else {
    this.timerBarFill.setFillStyle(COLORS.TIMER_RED);
  }
}
```

**Deliverable:** Clear, readable problem UI overlay

---

### 3.5 Implement Keyboard Answer Input
**Goal:** Capture numeric input and validation

**Tasks:**
- [ ] Add keyboard listener for numeric keys (0-9)
- [ ] Add backspace handler to delete digits
- [ ] Add enter key to submit answer
- [ ] Display current answer as user types
- [ ] Clear answer input after submission
- [ ] Prevent non-numeric input

**Input Handling:**
```javascript
// In GameScene.create()

this.currentAnswer = '';

// Numeric input (0-9)
this.input.keyboard.on('keydown', (event) => {
  if (event.key >= '0' && event.key <= '9') {
    this.currentAnswer += event.key;
    this.answerText.setText(this.currentAnswer);
  }
});

// Backspace
this.input.keyboard.on('keydown-BACKSPACE', () => {
  this.currentAnswer = this.currentAnswer.slice(0, -1);
  this.answerText.setText(this.currentAnswer || '_');
});

// Enter to submit
this.input.keyboard.on('keydown-ENTER', () => {
  this.submitAnswer();
});
```

**Submit Logic:**
```javascript
submitAnswer() {
  if (!this.currentAnswer) return;

  const isCorrect = this.mathProblem.checkAnswer(this.currentAnswer);

  if (isCorrect) {
    this.handleCorrectAnswer();
  } else {
    this.handleIncorrectAnswer();
  }
}
```

**Deliverable:** Working numeric input with answer submission

---

### 3.6 Integrate Problem System with Physics
**Goal:** Connect correct answers to car boosts

**Tasks:**
- [ ] On correct answer: calculate boost strength from timer
- [ ] Apply boost to VehiclePhysics
- [ ] Stop current problem timer
- [ ] Show feedback message
- [ ] Wait for delay (0.5 seconds)
- [ ] Generate and display next problem
- [ ] On incorrect answer: show feedback, continue timer
- [ ] On timeout: generate next problem with no boost

**Correct Answer Flow:**
```javascript
handleCorrectAnswer() {
  // 1. Calculate boost based on remaining timer
  const boostStrength = this.mathProblem.calculateBoost();

  // 2. Apply boost to physics
  this.vehiclePhysics.applyBoost(boostStrength);

  // 3. Stop timer
  this.mathProblem.timerActive = false;

  // 4. Show feedback
  this.feedbackText.setText(`Correct! +${boostStrength.toFixed(2)} boost`);
  this.feedbackText.setColor('#00ff00');

  // 5. Clear answer
  this.currentAnswer = '';
  this.answerText.setText('');

  // 6. Schedule next problem
  this.time.delayedCall(TIMING.CORRECT_ANSWER_DELAY, () => {
    this.startNewProblem();
  });
}
```

**Incorrect Answer Flow:**
```javascript
handleIncorrectAnswer() {
  // 1. Show feedback (timer keeps running!)
  this.feedbackText.setText('Try again!');
  this.feedbackText.setColor('#ff0000');

  // 2. Clear answer input
  this.currentAnswer = '';
  this.answerText.setText('');

  // 3. Timer continues counting down
  // Player can retry immediately
}
```

**Timeout Flow:**
```javascript
handleTimeout() {
  // 1. No boost applied (critical!)

  // 2. Show timeout message
  this.feedbackText.setText('Time up!');
  this.feedbackText.setColor('#ff6600');

  // 3. Clear answer
  this.currentAnswer = '';
  this.answerText.setText('');

  // 4. Schedule next problem (shorter delay)
  this.time.delayedCall(TIMING.TIMEOUT_DELAY, () => {
    this.startNewProblem();
  });
}
```

**New Problem Setup:**
```javascript
startNewProblem() {
  // 1. Generate new problem
  this.mathProblem.generate();

  // 2. Update problem text
  const p = this.mathProblem.currentProblem;
  this.problemText.setText(`${p.a} × ${p.b} = ?`);

  // 3. Start timer
  this.mathProblem.startTimer();

  // 4. Clear feedback
  this.feedbackText.setText('');

  // 5. Reset answer display
  this.answerText.setText('_');
}
```

**Deliverable:** Complete gameplay loop connecting problems to physics

---

### 3.7 Testing and Tuning
**Goal:** Validate all scenarios and edge cases

**Tasks:**
- [ ] Test correct answer → boost applied, next problem appears
- [ ] Test incorrect answer → can retry, timer continues
- [ ] Test timeout → no boost, next problem appears
- [ ] Test rapid correct answers → car accelerates quickly
- [ ] Test slow answers → weaker boosts, car slower
- [ ] Test all timeouts → car stops completely
- [ ] Verify timer bar color transitions smoothly
- [ ] Verify feedback messages are clear
- [ ] Test numeric input edge cases (leading zeros, empty input)
- [ ] Adjust delay timings for smooth flow

**Testing Scenarios:**

**Scenario 1: Perfect speed run**
- Answer every problem in < 1 second
- Car should reach max speed quickly
- Should maintain high speed throughout

**Scenario 2: Slow but correct**
- Answer problems with 1-2 seconds remaining
- Car should maintain moderate speed
- Should see weaker boosts but still moving

**Scenario 3: Timeouts**
- Let 3-4 problems timeout without answering
- Car should slow significantly
- Car should stop if too many consecutive timeouts

**Scenario 4: Wrong answers**
- Answer incorrectly multiple times before correct
- Timer should continue running during retries
- Should get weaker boost due to wasted time

**Scenario 5: Mixed performance**
- Alternate between fast answers and timeouts
- Car should speed up and slow down accordingly
- Should create realistic "struggling student" scenario

**Edge Cases:**
- [ ] Empty answer + Enter → should do nothing
- [ ] Leading zeros (e.g., "007") → should parse as 7
- [ ] Very large numbers → should reject if > 100
- [ ] Backspace on empty answer → should not error
- [ ] Rapid key presses → should not break input

**Deliverable:** Thoroughly tested and validated gameplay loop

---

## Technical Architecture

### Updated File Structure
```
/src
  /scenes
    GameScene.js          ✅ Updated with problem UI and input
  /systems
    Track.js              (unchanged from M1)
    VehiclePhysics.js     (unchanged from M2)
    MathProblem.js        ✅ NEW: Problem generation and validation
  /config
    colors.js             (may add UI colors)
    constants.js          (verify TIMING and BOOST constants)
    gameConfig.js         (unchanged)
  main.js                 (unchanged)
```

### Key Classes

**MathProblem** (`src/systems/MathProblem.js`)
```javascript
class MathProblem {
  constructor(selectedTables)

  currentProblem        // {a, b, answer}
  timer                 // Frames remaining
  timerMax              // Total frames (360 for 6 seconds)
  timerActive           // Boolean
  usedProblems          // Set to prevent duplicates

  generate()            // Create new problem
  checkAnswer(input)    // Validate answer
  updateTimer(delta)    // Decrement timer
  getRemainingPercent() // 0-1 for UI
  calculateBoost()      // Convert timer to boost multiplier
  startTimer()          // Begin countdown
  handleTimeout()       // Called when timer expires
}
```

**GameScene Updates** (`src/scenes/GameScene.js`)
```javascript
// New properties
this.mathProblem       // Problem system
this.currentAnswer     // User input string

// New UI elements
this.problemText       // Problem display
this.timerBarBg        // Timer background
this.timerBarFill      // Timer fill (animated)
this.answerText        // Current answer
this.feedbackText      // Correct/incorrect message

// New methods
startNewProblem()      // Initialize new problem
submitAnswer()         // Check answer
handleCorrectAnswer()  // Boost and next problem
handleIncorrectAnswer()// Feedback and retry
handleTimeout()        // Next problem without boost
updateTimerBar()       // Visual timer update
```

---

## Constants Verification

Ensure these exist in `src/config/constants.js`:

```javascript
export const TIMING = {
  PROBLEM_TIMER: 6 * 60,         // 6 seconds at 60fps = 360 frames
  CORRECT_ANSWER_DELAY: 30,      // 0.5 seconds (30 frames)
  TIMEOUT_DELAY: 10,             // 0.16 seconds (10 frames)
  FEEDBACK_DURATION: 60          // 1 second (60 frames)
};

export const BOOST = {
  // Linear mapping: remainingTime/totalTime → boost multiplier
  SCALE: 1.0  // 6 seconds = 1.0x, 0 seconds = 0.0x
};
```

Add to `src/config/colors.js` if missing:

```javascript
export const COLORS = {
  // ... existing colors ...

  // Timer colors
  TIMER_GREEN: 0x00ff00,
  TIMER_YELLOW: 0xffff00,
  TIMER_RED: 0xff0000,

  // Feedback colors
  CORRECT_GREEN: 0x00ff00,
  INCORRECT_RED: 0xff0000,

  // UI colors
  UI_TEXT: 0xffffff,
  UI_ACCENT: 0xffff00,
  UI_BACKGROUND: 0x333333
};
```

---

## Game Flow After M3

**Complete Gameplay Loop:**

1. Game starts → car stationary, problem appears with timer
2. Timer counts down (6 seconds)
3. Player types answer and presses Enter
4. **If correct:**
   - Boost applied (strength based on remaining timer)
   - Car accelerates
   - Feedback: "Correct! +0.8 boost"
   - 0.5 second delay
   - New problem appears
5. **If incorrect:**
   - Timer continues
   - Feedback: "Try again!"
   - Player can retry immediately
6. **If timeout:**
   - No boost applied
   - Car loses momentum
   - Feedback: "Time up!"
   - 0.2 second delay
   - New problem appears
7. Repeat until car completes laps (no end condition yet - M4 will add this)

---

## Integration with Future Milestones

**Milestone 4** will add:
- Lap detection and counting
- Game over after 3 laps
- Statistics tracking (accuracy, correct/incorrect)

**Milestone 5** will add:
- Menu to select multiplication tables
- Currently hardcoded to tables 2-5 for testing

**Milestone 6** will replace keyboard input with:
- French voice recognition
- Same validation logic, different input source

**MathProblem class will remain largely unchanged** - just the input method changes.

---

## Testing Strategy

### Manual Testing Procedure

1. **Basic Flow:**
   - Start game
   - Verify problem appears with timer
   - Type correct answer
   - Press Enter
   - Verify boost applied and car moves
   - Verify new problem appears

2. **Timer Test:**
   - Start problem
   - Watch timer bar count down
   - Verify color changes: green → yellow → red
   - Let timer expire
   - Verify no boost applied

3. **Wrong Answer Test:**
   - Type incorrect answer
   - Press Enter
   - Verify "Try again!" message
   - Verify timer still running
   - Type correct answer
   - Verify boost applied

4. **Speed Correlation Test:**
   - Answer 5 problems very fast (< 1 sec each)
   - Verify car reaches high speed
   - Answer 5 problems very slow (4-5 sec each)
   - Verify car maintains lower speed

5. **Input Edge Cases:**
   - Try empty answer + Enter
   - Try backspace on empty input
   - Try typing very long number
   - Verify no crashes or errors

### Visual Validation

- Timer bar smoothly decreases
- Color transitions are clear
- Problem text is readable over track
- Feedback messages are visible
- Answer display updates as you type

### Code Quality

- Follow CLAUDE.md guidelines
- Comment the boost calculation formula
- Explain why timer doesn't pause on wrong answers
- Document delay timings and their purpose

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** Not Started

**Next Steps After Completion:**
1. Commit Milestone 3 work
2. Begin Milestone 4: Lap Tracking & Statistics

---

## Notes & Considerations

### Why Linear Boost Mapping?

Simple and predictable:
- Easy to understand: faster answer = bigger boost
- No complex curves or formulas
- Can be tuned by adjusting BOOST.SCALE
- Alternative (exponential) can be added later if needed

### Why Timer Continues on Wrong Answers?

Creates pressure without harsh penalty:
- Wrong answers waste precious time (soft penalty)
- Player can keep trying (not punishing)
- Time pressure increases as timer runs down
- Rewards both speed AND accuracy

### Delay Timings

**Correct answer delay (0.5s):**
- Gives time to read feedback
- Prevents overwhelming problem spam
- Creates rhythm to gameplay

**Timeout delay (0.2s):**
- Shorter because no boost (player already lost time)
- Keeps momentum from dying completely
- Just enough to register what happened

### Problem Difficulty

For MVP, using tables 2-10 is appropriate:
- Covers standard elementary curriculum
- Answers range from 4 to 100
- Most students know these by heart (speed matters)
- Menu in M5 will allow selection

### Input Method Progression

M3: Keyboard → M6: Voice

This allows us to:
1. Validate game mechanics with simple input (M3)
2. Tune problem difficulty and timing (M3-M4)
3. Add voice as enhancement (M6), not dependency

If voice fails, keyboard fallback exists.
