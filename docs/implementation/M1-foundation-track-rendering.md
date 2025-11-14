# Milestone 1: Project Foundation & Track Rendering

## Summary

This milestone establishes the visual foundation of Math Racer by implementing a playable prototype with a car moving on a procedurally-generated track. The focus is on getting pixels on screen and validating the top-down racing perspective with code-generated graphics.

**Rationale:** Before building complex game mechanics (physics, math problems, speech recognition), we need to prove that:
1. Phaser 3 is properly integrated and rendering
2. The top-down view is visually clear and readable
3. The track path system works smoothly
4. The car follows the path correctly
5. The retro arcade aesthetic is achievable with code-generated graphics

**Success Criteria:**
- Running `npm run dev` shows a complete racing track from bird's eye view
- A car sprite smoothly follows the track path at constant speed
- Visual style is clean, retro, and arcade-like
- Foundation is solid for adding physics in Milestone 2

---

## High-Level Milestones

### 1.1 Create GameScene and Basic Rendering
**Goal:** Get Phaser rendering a basic scene

**Tasks:**
- [ ] Create `src/scenes/GameScene.js` with Phaser scene boilerplate
- [ ] Add GameScene to main.js scene configuration
- [ ] Implement `create()` method with background rendering (grass green)
- [ ] Add simple test text to verify scene is loading
- [ ] Test that scene renders when running dev server

**Deliverable:** Blank green canvas with "Math Racer" text visible

---

### 1.2 Implement Track System
**Goal:** Programmatically generate a curved racing track

**Tasks:**
- [ ] Create `src/systems/Track.js` class
- [ ] Define track path using Phaser.Curves.Path with 6-8 control points
- [ ] Create closed loop using spline curves (non-circular, organic shape)
- [ ] Implement `getPositionAt(t)` method that converts 0-1 progress to {x, y, angle}
- [ ] Calculate total track length
- [ ] Add method to get tangent angle at any position

**Technical Notes:**
- Use `Phaser.Curves.Spline` for smooth curved path
- Ensure path is closed (start point = end point)
- Path should fill most of the canvas but leave margins
- Example control points for reference (can be adjusted):
  ```javascript
  const points = [
    new Phaser.Math.Vector2(400, 100),  // Top center
    new Phaser.Math.Vector2(650, 200),  // Top right
    new Phaser.Math.Vector2(700, 450),  // Right middle
    new Phaser.Math.Vector2(500, 650),  // Bottom middle
    new Phaser.Math.Vector2(200, 600),  // Bottom left
    new Phaser.Math.Vector2(100, 350),  // Left middle
    new Phaser.Math.Vector2(200, 150)   // Top left
  ];
  ```

**Deliverable:** Track class that can provide position/angle at any progress value (0-1)

---

### 1.3 Render Track Graphics
**Goal:** Draw the track visually using code-generated graphics

**Tasks:**
- [ ] Create Phaser.Graphics object in GameScene
- [ ] Draw track outline using thick stroke (60px width, gray color)
- [ ] Add dashed center line (white, 3px width)
- [ ] Draw start/finish line (red rectangle perpendicular to track)
- [ ] Position start/finish at progress = 0

**Visual Style (from constants and colors):**
- Track base: 60px wide, color `0x404040` (gray)
- Center line: 3px dashed white (`0xffffff`)
- Start/finish: 10px wide × 60px tall red bar (`0xff0000`)

**Technical Notes:**
- Use `graphics.strokePath()` to render the track path
- Use `graphics.setLineDash([10, 10])` for dashed center line
- Start/finish line should be perpendicular to track tangent at progress = 0

**Deliverable:** Visible racing track with clear start/finish line

---

### 1.4 Implement Car Rendering
**Goal:** Create a simple geometric car sprite

**Tasks:**
- [ ] Create car graphics in GameScene using Phaser.Graphics
- [ ] Draw simple car shape (triangle or rectangle, 12×20px)
- [ ] Use red color (`0xff0000`) from color palette
- [ ] Position car at track start (progress = 0)
- [ ] Rotate car to match track tangent angle

**Car Design Options:**
```javascript
// Option 1: Triangle (wedge shape, points forward)
graphics.fillTriangle(0, -10, -6, 10, 6, 10);

// Option 2: Rectangle (simple box)
graphics.fillRect(-6, -10, 12, 20);
```

**Technical Notes:**
- Car origin should be at center for proper rotation
- Forward direction is typically up (0 degrees = north in Phaser)
- Car should visibly point in direction of travel

**Deliverable:** Red geometric car positioned and oriented on track

---

### 1.5 Implement Automatic Car Movement
**Goal:** Make car move along track at constant speed

**Tasks:**
- [ ] Add `progress` property to track car position (0 to 1)
- [ ] Implement `update()` loop in GameScene
- [ ] Increment progress each frame based on constant speed
- [ ] Convert progress to world position using Track.getPositionAt()
- [ ] Update car sprite position and rotation each frame
- [ ] Handle loop: when progress >= 1, reset to 0

**Movement Logic:**
```javascript
// In GameScene.update(time, delta)
this.progress += (this.speed * delta) / this.track.length;
if (this.progress >= 1) {
  this.progress = 0; // Loop back to start
}

const position = this.track.getPositionAt(this.progress);
this.car.setPosition(position.x, position.y);
this.car.setRotation(position.angle);
```

**Constants:**
- Initial speed: 2 units per second (will be replaced by physics in M2)
- Update uses delta time for frame-rate independence

**Deliverable:** Car smoothly following the track path in a continuous loop

---

### 1.6 Visual Polish and Testing
**Goal:** Refine appearance and validate smooth gameplay

**Tasks:**
- [ ] Verify car movement is smooth at 60 FPS
- [ ] Ensure car stays centered on track (not offset)
- [ ] Adjust track control points if path looks awkward
- [ ] Verify start/finish line is clearly visible
- [ ] Test that car orientation matches path direction at all points
- [ ] Add any visual improvements (track shadows, better colors)
- [ ] Document any tuning parameters in constants.js

**Testing Checklist:**
- [ ] Track is fully visible on screen (no clipping)
- [ ] Car completes full lap smoothly
- [ ] No visual stuttering or jumps
- [ ] Track shape is interesting (not too simple, not too complex)
- [ ] Colors are readable and match retro arcade aesthetic

**Deliverable:** Polished, playable prototype ready for Milestone 2

---

## Technical Architecture

### File Structure After Milestone 1
```
/src
  /scenes
    GameScene.js          ✅ Main game scene
  /systems
    Track.js              ✅ Track path and positioning
  /config
    colors.js             (existing)
    constants.js          (existing - may add TRACK constants)
    gameConfig.js         (existing)
  main.js                 (updated to include GameScene)
```

### Key Classes

**GameScene** (`src/scenes/GameScene.js`)
```javascript
class GameScene extends Phaser.Scene {
  constructor()
  create()      // Initialize track, car, graphics
  update(time, delta)  // Move car along track
}
```

**Track** (`src/systems/Track.js`)
```javascript
class Track {
  constructor(scene)
  path          // Phaser.Curves.Path
  length        // Total track length

  getPositionAt(t)  // Returns {x, y, angle} for progress 0-1
}
```

### Integration Points

**main.js changes:**
```javascript
import GameScene from './scenes/GameScene.js';
gameConfig.scene = [GameScene];
```

---

## Constants to Add

**In `src/config/constants.js`:**
```javascript
export const TRACK = {
  WIDTH: 60,                     // Track width in pixels
  CENTER_LINE_WIDTH: 3,          // Dashed center line width
  START_FINISH_WIDTH: 10,        // Start/finish line width
  START_FINISH_HEIGHT: 60        // Start/finish line height
};

export const CAR = {
  WIDTH: 12,                     // Car width
  HEIGHT: 20                     // Car height
};
```

(These may already exist - verify and add if missing)

---

## Notes & Considerations

### Code-Generated Graphics
- All visuals are created with Phaser.Graphics API (no sprite assets)
- This allows instant iteration without asset pipeline
- Graphics can be replaced with sprites later without changing logic

### Top-Down Perspective
- Camera is fixed overhead showing entire track
- No camera following or scrolling needed
- Car sprite rotates to match path direction

### Performance
- Target 60 FPS on modern desktop browsers
- Simple graphics should have no performance issues
- Path calculations are done once, not every frame

### Future Milestones
- **Milestone 2** will replace constant speed with physics system
- **Milestone 3** will add the problem/timer overlay
- Track rendering remains unchanged through future milestones

---

## Testing Strategy

### Manual Testing
1. Start dev server: `npm run dev`
2. Verify track renders correctly
3. Watch car complete at least 3 full laps
4. Check for any visual glitches or stuttering
5. Verify car orientation looks natural throughout path

### Visual Validation
- Screenshot the track and verify it looks like a racing game
- Ensure the aesthetic matches retro arcade style
- Confirm colors match the defined palette

### Code Quality
- Follow code style from CLAUDE.md (simple, readable, well-commented)
- Explain any Phaser API usage that might be unfamiliar
- Keep classes focused and methods short

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** Not Started

**Next Steps After Completion:**
1. Commit Milestone 1 work
2. Begin Milestone 2: Vehicle Physics & Input-Driven Movement
