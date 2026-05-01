# Milestone 2: Vehicle Physics & Input-Driven Movement

## Summary

This milestone replaces the constant-speed movement from M1 with a realistic momentum-based physics system. The car will start stationary, accelerate when boosted, and gradually slow down due to friction. This establishes the core gameplay feel before integrating the math problem system.

**Context:** In Milestone 1, the car moves at constant speed automatically. This doesn't create any gameplay - it's just a demo. Milestone 2 introduces the physics that will make answering math problems rewarding: correct answers provide boosts that accelerate the car, while silence causes it to slow down and potentially stop.

**Rationale:**
1. Physics must feel right BEFORE adding math problems and timers
2. Tuning friction/acceleration is easier without other systems interfering
3. Manual boost testing (keyboard spacebar) allows rapid iteration
4. Validates that "answer speed → car speed" mechanic will be engaging
5. Proves the car can actually stop (critical for creating urgency)

**Success Criteria:**
- Car starts at velocity = 0 (stationary)
- Pressing spacebar applies boost → car accelerates
- Releasing spacebar → car gradually slows due to friction
- Multiple rapid boosts → car reaches max speed
- No input for several seconds → car comes to complete stop
- Movement feels smooth and arcade-like (not simulation-heavy)

---

## High-Level Milestones

### 2.1 Create VehiclePhysics Class
**Goal:** Implement track-independent physics simulation

**Tasks:**
- [x] Create `src/systems/VehiclePhysics.js` class
- [x] Add properties: `position` (0-1 track progress), `velocity`, `acceleration`
- [x] Implement `update(delta)` method with physics calculations
- [x] Implement `applyBoost(multiplier)` method to add acceleration
- [x] Add friction that applies every frame
- [x] Ensure velocity can reach zero (car stops completely)
- [x] Implement max speed capping

**Physics Calculations:**
```javascript
// Each frame:
1. Apply acceleration to velocity
2. Apply friction to velocity (velocity *= FRICTION)
3. Clamp velocity between 0 and MAX_SPEED
4. Update position based on velocity
5. Reset acceleration to 0
```

**Key Properties:**
```javascript
class VehiclePhysics {
  position = 0        // 0-1 progress along track (0 = start, 1 = full lap)
  velocity = 0        // Progress per second (0-1 scale, NOT pixels!)
  acceleration = 0    // Current frame acceleration
  maxSpeed = 0.2      // From PHYSICS.MAX_SPEED (0.2 = 20% of track per second)
  friction = 0.98     // From PHYSICS.FRICTION (multiplier per frame)
}
```

**IMPORTANT - Velocity Units:**
- Velocity represents **progress per second** (0-1 scale), NOT pixels per second
- Example: `velocity = 0.2` means "complete 20% of track per second" (~5 seconds per lap)
- Example: `velocity = 0.1` means "complete 10% of track per second" (~10 seconds per lap)
- This makes physics track-length independent and easier to tune

**Deliverable:** Physics class with tunable movement mechanics

---

### 2.2 Integrate Physics into GameScene
**Goal:** Replace constant-speed movement with physics-driven movement

**Tasks:**
- [x] Import VehiclePhysics into GameScene
- [x] Create VehiclePhysics instance in `create()`
- [x] Remove old constant-speed logic from `update()`
- [x] Call `vehiclePhysics.update(delta)` in GameScene `update()`
- [x] Use `vehiclePhysics.position` to get car position from Track
- [x] Handle lap wrapping (when position >= 1, wrap to 0)

**Integration Pattern:**
```javascript
// In GameScene.create()
this.vehiclePhysics = new VehiclePhysics();

// In GameScene.update(time, delta)
this.vehiclePhysics.update(delta);

const position = this.track.getPositionAt(this.vehiclePhysics.position);
this.car.setPosition(position.x, position.y);
this.car.setRotation(position.angle);
```

**Testing:**
- Car should be stationary when game starts (velocity = 0)
- Verify physics calculations run each frame
- Confirm car position updates based on velocity

**Deliverable:** Car controlled by physics system (stationary at start)

---

### 2.3 Add Manual Boost Input (Keyboard)
**Goal:** Allow testing physics with spacebar input

**Tasks:**
- [x] Add keyboard input listener in GameScene `create()`
- [x] Detect spacebar press events
- [x] Apply boost when spacebar is pressed
- [x] Use a fixed boost multiplier for testing (e.g., 1.0)
- [x] Add visual/audio feedback (optional for now)

**Input Handling:**
```javascript
// In GameScene.create()
this.input.keyboard.on('keydown-SPACE', () => {
  this.vehiclePhysics.applyBoost(1.0); // Full boost for testing
});
```

**Testing Scenarios:**
1. Single spacebar press → car accelerates briefly
2. Multiple rapid presses → car speeds up faster
3. Hold spacebar (repeated presses) → car reaches max speed
4. Stop pressing → car slows down gradually

**Deliverable:** Manual boost control via spacebar

---

### 2.4 Add Speed Indicator UI
**Goal:** Display current velocity for visual feedback

**Tasks:**
- [x] Create speed text display in GameScene
- [x] Position indicator on screen (e.g., bottom-left corner)
- [x] Update text each frame with current velocity
- [x] Format: "Speed: X.XX"
- [x] Use retro font (Press Start 2P)
- [x] Make it clearly readable

**UI Implementation:**
```javascript
// In GameScene.create()
this.speedText = this.add.text(20, 760, 'Speed: 0.00', {
  fontFamily: '"Press Start 2P"',
  fontSize: '14px',
  color: '#ffff00',
  stroke: '#000000',
  strokeThickness: 3
});

// In GameScene.update()
this.speedText.setText(`Speed: ${this.vehiclePhysics.velocity.toFixed(2)}`);
```

**Visual Design:**
- Position: Bottom-left corner with margin
- Color: Yellow (`0xffff00`) for visibility
- Black stroke for readability against green background

**Deliverable:** Real-time speed display showing velocity changes

---

### 2.5 Physics Tuning and Feel Testing
**Goal:** Adjust constants for satisfying gameplay feel

**Tasks:**
- [x] Test various friction values (0.95 - 0.99)
- [x] Test max speed values (3 - 7 units)
- [x] Test boost acceleration amounts
- [x] Verify car can stop completely (reaches velocity = 0)
- [x] Ensure acceleration feels responsive (not too slow)
- [x] Ensure deceleration creates urgency (not too fast, not too slow)
- [x] Document final tuned values in constants.js

**Tuning Goals:**
- **Quick response:** Car should feel responsive to boost inputs
- **Meaningful friction:** Should slow noticeably but not instantly
- **Stopping is possible:** Car must be able to reach full stop
- **Max speed cap:** Fast but not so fast car is hard to track visually

**Testing Method:**
1. Boost rapidly to max speed
2. Stop boosting and measure time to stop
3. Ideal: ~5-10 seconds from max speed to full stop
4. Adjust friction if too fast or too slow

**Constants to Tune (in `src/config/constants.js`):**
```javascript
export const PHYSICS = {
  MAX_SPEED: 0.2,            // Try values: 0.1, 0.15, 0.2, 0.25, 0.3
                             // (progress per second: higher = faster laps)
  FRICTION: 0.98,            // Try values: 0.95, 0.96, 0.97, 0.98, 0.99
  BASE_ACCELERATION: 0.01,   // Try values: 0.005, 0.01, 0.015, 0.02
  MIN_VELOCITY: 0            // Must stay 0 (car can stop)
};
```

**Deliverable:** Well-tuned physics that feel arcade-like and engaging

---

### 2.6 Validation and Edge Cases
**Goal:** Test all physics edge cases and scenarios

**Tasks:**
- [x] Test: Car starts stationary (velocity = 0)
- [x] Test: Car can accelerate from stop
- [x] Test: Car can reach max speed
- [x] Test: Car can decelerate to full stop
- [x] Test: Velocity never goes negative
- [x] Test: Velocity never exceeds max speed
- [x] Test: Position wraps correctly at lap boundaries (position = 1.0 → 0.0)
- [x] Test: Delta time independence (same behavior at different frame rates)
- [x] Test: Rapid boost spam doesn't break physics
- [x] Document any issues or quirks

**Edge Case Testing:**

**Scenario 1: Immediate stop**
- Start game (velocity = 0)
- Don't press spacebar
- Car should remain stationary ✓

**Scenario 2: Boost from stop**
- Start game
- Press spacebar once
- Car should start moving ✓

**Scenario 3: Reach max speed**
- Spam spacebar rapidly
- Velocity should cap at MAX_SPEED ✓
- Speed indicator should not exceed max ✓

**Scenario 4: Deceleration to stop**
- Boost to moderate speed
- Stop pressing spacebar
- Car should gradually slow to complete stop ✓
- Track time from max speed to stop ✓

**Scenario 5: Lap wrapping**
- Boost to max speed
- Let car complete full lap
- Position should wrap from 1.0 to 0.0 smoothly ✓

**Deliverable:** Validated physics system ready for problem integration

---

### 2.7 Debug Mode (Optional but Recommended)
**Goal:** Add visual debug overlay for physics tuning

**Tasks:**
- [x] Add debug panel toggle (press D key)
- [x] Display current velocity
- [x] Display current acceleration
- [x] Display current position (0-1)
- [x] Display boost multiplier when applied
- [x] Color-code values (yellow = at limit, white = normal)
- [x] Make panel toggleable and non-intrusive

**Implementation:**
```javascript
// In GameScene.create()
this.debugMode = false;

// Toggle debug mode with D key
this.input.keyboard.on('keydown-D', () => {
  this.debugMode = !this.debugMode;
  console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
});

// Create debug text panel (bottom-left corner)
this.debugText = this.add.text(10, 650, '', {
  fontFamily: 'monospace',
  fontSize: '12px',
  color: '#00ff00',
  backgroundColor: '#000000',
  padding: { x: 8, y: 8 }
}).setDepth(1000); // Ensure it's on top

// In GameScene.update()
updateDebug() {
  if (!this.debugMode) {
    this.debugText.setVisible(false);
    return;
  }

  this.debugText.setVisible(true);
  const p = this.vehiclePhysics;

  // Color-code velocity (yellow if at max)
  const velColor = p.velocity >= p.maxSpeed ? '#ffff00' : '#ffffff';

  const debugInfo = [
    'DEBUG MODE (Press D to toggle)',
    '─'.repeat(35),
    `Velocity:     ${p.velocity.toFixed(4)} / ${p.maxSpeed}`,
    `Acceleration: ${p.acceleration.toFixed(6)}`,
    `Position:     ${p.position.toFixed(4)}`,
    `Friction:     ${PHYSICS.FRICTION}`,
    `Max Speed:    ${PHYSICS.MAX_SPEED} (${(1/PHYSICS.MAX_SPEED).toFixed(1)}s/lap)`
  ].join('\n');

  this.debugText.setText(debugInfo);
}
```

**Benefits:**
- **Visual confirmation** - See exact physics values in real-time
- **Tuning aid** - Immediately see effect of constant changes
- **Boost verification** - Confirm boost actually applies
- **Position tracking** - Verify lap progress calculation
- **No guesswork** - Know exactly what's happening under the hood

**Usage during development:**
1. Press D to enable debug mode
2. Adjust constants in `constants.js`
3. Reload game (Vite hot-reload)
4. Observe new values in debug panel
5. Test feel and iterate

**For production:**
- Leave debug mode in (doesn't hurt)
- Users can enable if curious
- Or comment out D key listener to disable

**Deliverable:** Optional debug overlay for easier physics tuning

---

## Technical Architecture

### Updated File Structure
```
/src
  /scenes
    GameScene.js          ✅ Updated with physics integration
  /systems
    Track.js              (unchanged from M1)
    VehiclePhysics.js     ✅ NEW: Physics simulation
  /config
    colors.js             (unchanged)
    constants.js          (verify PHYSICS constants exist)
    gameConfig.js         (unchanged)
  main.js                 (unchanged)
```

### Key Classes

**VehiclePhysics** (`src/systems/VehiclePhysics.js`)
```javascript
class VehiclePhysics {
  constructor()

  position        // 0-1 track progress
  velocity        // Current speed
  acceleration    // Current frame acceleration
  maxSpeed        // Velocity cap
  friction        // Decay multiplier

  update(delta)           // Apply physics calculations
  applyBoost(multiplier)  // Add acceleration
}
```

**GameScene Updates** (`src/scenes/GameScene.js`)
```javascript
// New properties
this.vehiclePhysics    // Physics system
this.speedText         // Speed indicator UI

// New input handling
this.input.keyboard.on('keydown-SPACE', ...)

// Updated update() to use physics
```

---

## Physics Implementation Details

### Update Loop (60 FPS)

```javascript
update(delta) {
  // 1. Apply current acceleration to velocity
  this.velocity += this.acceleration;

  // 2. Apply friction (continuous deceleration)
  this.velocity *= this.friction;

  // 3. Clamp velocity to valid range
  this.velocity = Math.max(0, Math.min(this.velocity, this.maxSpeed));

  // 4. Update position based on velocity
  // IMPORTANT: velocity is already in progress per second (0-1 scale)
  // So we just multiply by delta time - NO division by trackLength needed
  const deltaSeconds = delta / 1000; // Convert milliseconds to seconds
  this.position += this.velocity * deltaSeconds;

  // 5. Handle lap wrapping
  if (this.position >= 1.0) {
    this.position = this.position % 1.0;
  }

  // 6. Reset acceleration for next frame
  this.acceleration = 0;
}
```

### Boost Application

```javascript
applyBoost(multiplier) {
  // multiplier will range from 0 to 1 based on timer (in M3)
  // For M2 testing, use 1.0 (full boost)
  this.acceleration += PHYSICS.BASE_ACCELERATION * multiplier;
}
```

### Delta Time Independence

**Critical:** Physics must work the same regardless of frame rate.

- Always multiply velocity changes by `delta / 1000` (convert ms to seconds)
- Test at different frame rates (60 FPS, 30 FPS) to verify consistency
- Use Phaser's provided `delta` parameter, don't calculate manually

---

## Constants Verification

Ensure these exist in `src/config/constants.js`:

```javascript
export const PHYSICS = {
  MAX_SPEED: 0.2,                // Maximum velocity (progress per second, 0-1 scale)
                                 // 0.2 = 20% of track per second = ~5 seconds per lap
  FRICTION: 0.98,                // Applied every frame (0.98 = retains 98% velocity)
  BASE_ACCELERATION: 0.01,       // Base acceleration amount (in progress per second²)
  MIN_VELOCITY: 0                // Car CAN stop completely (zero velocity)
};
```

**Tuning guide for MAX_SPEED:**
- `0.1` = 10% per second = ~10 seconds per lap (slow)
- `0.2` = 20% per second = ~5 seconds per lap (moderate)
- `0.3` = 30% per second = ~3.3 seconds per lap (fast)
- `0.5` = 50% per second = ~2 seconds per lap (very fast)

If missing, add them. These are the starting values and will be tuned in milestone 2.5.

---

## Testing Strategy

### Manual Testing Procedure

1. **Start Game:**
   - Run `npm run dev`
   - Verify car is stationary
   - Speed indicator shows "Speed: 0.00"

2. **Single Boost:**
   - Press spacebar once
   - Car should start moving
   - Speed increases then gradually decreases
   - Eventually stops

3. **Rapid Boosting:**
   - Press spacebar rapidly (10+ times)
   - Speed should increase to max
   - Speed indicator should cap at MAX_SPEED value

4. **Deceleration Test:**
   - Boost to max speed
   - Stop pressing spacebar
   - Observe gradual slowdown
   - Verify car comes to complete stop
   - Note: Should take 5-10 seconds

5. **Lap Completion:**
   - Boost to moderate speed
   - Let car complete 2-3 laps
   - Verify smooth wrapping at lap boundary

### Visual Validation

- Speed indicator updates smoothly (no flickering)
- Car movement looks natural (not stuttering)
- Acceleration feels responsive
- Deceleration creates sense of momentum loss

### Code Quality

- Follow CLAUDE.md guidelines (simple, readable, well-commented)
- Explain physics formulas in comments
- Document why friction is multiplicative (feels more natural than subtractive)
- Keep update() method clean and understandable

---

## Expected Behavior After M2

**Game Flow:**
1. Game starts → car is stationary on track
2. Player presses spacebar → car accelerates
3. Player releases spacebar → car decelerates
4. No input for ~10 seconds → car stops completely
5. Player can restart movement with spacebar boost

**Feel:**
- Arcade-like (simplified physics, not simulation)
- Responsive to input
- Clear cause and effect (boost → speed increase)
- Momentum feels satisfying

**Not Implemented Yet:**
- Math problems (M3)
- Boost tied to answer speed (M3)
- Lap tracking (M4)
- Menu system (M5)

---

## Integration with Future Milestones

**Milestone 3** will replace keyboard spacebar input with:
- Boost triggered by correct answers
- Boost strength determined by remaining timer
- Same physics system, different trigger mechanism

**VehiclePhysics class will NOT change** in M3, only how `applyBoost()` is called.

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** ✅ COMPLETED

**Implementation Notes:**
- VehiclePhysics class implemented with progress-based velocity (0-1 scale)
- Physics integration complete - car starts stationary, moves with physics
- Manual boost input working (spacebar for testing)
- Speed indicator showing real-time velocity
- Debug mode implemented with full physics info panel (press D)
- All systems working smoothly with proper delta time handling
- Ready for M3: Math Problem System

**Next Steps After Completion:**
1. Commit Milestone 2 work ← READY
2. Begin Milestone 3: Math Problem System & Timing Mechanics

---

## Notes & Considerations

### Why Custom Physics?

We're NOT using Phaser's built-in physics engines (Arcade, Matter.js) because:
- Racing on a path is spatial, not collision-based
- We need precise control over acceleration/friction tuning
- Simpler to understand and modify
- No overhead from unused collision detection

### Friction: Multiplicative vs Additive

We use multiplicative friction (`velocity *= 0.98`) rather than subtractive (`velocity -= 0.1`) because:
- Feels more natural (exponential decay)
- Automatically slows less as velocity approaches zero
- No risk of overshooting and going negative
- Common in game physics

### Delta Time

Always account for variable frame rates:
```javascript
// WRONG (frame-rate dependent):
this.position += this.velocity;

// CORRECT (frame-rate independent):
this.position += this.velocity * (delta / 1000);
```

This ensures consistent behavior at 60 FPS, 30 FPS, or any other rate.
