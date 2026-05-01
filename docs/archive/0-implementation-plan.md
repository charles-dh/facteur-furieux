# Math Racer - Implementation Plan

## Deployment Platform

**Recommendation: Vercel** ✓

**Why Vercel is ideal for this project:**
- Zero-config deployment for Vite projects (automatic detection)
- Free tier perfect for MVP (unlimited bandwidth for personal projects)
- Instant deployments via Git integration
- Automatic HTTPS
- Preview deployments for each commit
- No server-side logic needed (all client-side)
- Excellent performance with global CDN

**Alternative:** Netlify (also excellent, very similar features)

**Deployment will be as simple as:**
```bash
npm install -g vercel
vercel
```

---

## Implementation Milestones

### Milestone 1: Project Foundation & Track Rendering
**Goal:** Playable foundation with visible car moving on a track

**Deliverable:**
- Vite + Phaser 3 project initialized and running
- Top-down view of a procedurally-generated curved track
- Simple car sprite (geometric shape) rendered on track
- Car automatically moves along the track path at constant speed
- Clean retro arcade visual style (code-generated graphics)

**Success Criteria:**
- `npm run dev` launches the game in browser
- Track is visible as a closed loop with start/finish line
- Car smoothly follows the track path
- Fixed overhead camera shows entire track

---

### Milestone 2: Vehicle Physics & Input-Driven Movement
**Goal:** Car responds to boost mechanics with realistic momentum

**Deliverable:**
- Custom physics system (velocity, acceleration, friction)
- Car starts stationary (velocity = 0)
- Manual boost trigger (keyboard spacebar for testing)
- Car accelerates when boosted, decelerates via friction
- Car can completely stop if no boosts applied
- Visual speed indicator

**Success Criteria:**
- Pressing spacebar applies boost → car accelerates
- Releasing spacebar → car gradually slows down
- Multiple rapid boosts → car reaches max speed
- No input for several seconds → car stops completely
- Visible correlation between speed and car movement

---

### Milestone 3: Math Problem System & Timing Mechanics
**Goal:** Problem generation with timer and answer validation

**Deliverable:**
- Problem generator for selected multiplication tables
- Problem display overlay (centered on screen)
- 6-second countdown timer with visual bar (green → yellow → red)
- Keyboard number input for answer testing
- Answer validation (correct/incorrect feedback)
- Boost strength tied to remaining timer (6s = max, 0s = none)
- Delay mechanics (0.5s after correct, 0.2s after timeout)

**Success Criteria:**
- Problem appears automatically with timer bar
- Typing correct answer → boost applied proportional to remaining time → next problem
- Typing wrong answer → timer keeps running, can retry
- Timer expires → no boost, new problem appears
- Fast answers = strong boosts = faster car
- Slow/no answers = weak/no boosts = car slows or stops

---

### Milestone 4: Lap Tracking & Statistics
**Goal:** Full race progression with time-based performance tracking

**Deliverable:**
- Lap detection system (3 laps to complete)
- Statistics tracker (accuracy, correct/incorrect count)
- Time tracking (total race time, lap times, best lap)
- HUD display (top-left: lap/accuracy, top-right: times)
- Game over condition (3 laps complete)
- Basic GameOver screen with final stats

**Success Criteria:**
- Crossing start/finish line increments lap counter
- Each lap time is recorded and displayed
- Best lap time is tracked
- After 3 laps → game transitions to results screen
- All statistics accurate and clearly visible
- "Play Again" returns to game (temporary: restarts current session)

---

### Milestone 5: Menu System & Configuration
**Goal:** Full game flow with player customization

**Deliverable:**
- Welcome/Menu scene
- Player name input (optional, defaults to "Pilote")
- Multiplication table selector (2-10, multi-select)
- "Select All" quick option
- Start button (disabled until at least one table selected)
- Proper scene transitions (Menu → Game → GameOver → Menu)
- Selected tables passed to problem generator

**Success Criteria:**
- Game launches to menu screen (not directly to game)
- Can select multiple tables
- Start button only works with at least one table selected
- Selected configuration affects problems in game
- "Play Again" returns to menu with clean state reset

---

### Milestone 6: French Speech Recognition
**Goal:** Voice input fully functional for gameplay

**Deliverable:**
- Web Speech API integration (`fr-FR`)
- French number parser (words and digits: "douze", "12")
- Homophone handling ("sang" → "cent", "dis" → "dix")
- Real-time transcript display (show what's being heard)
- Continuous listening during gameplay
- Keyboard fallback remains available

**Success Criteria:**
- Microphone permission requested on game start
- Saying French numbers (2-100) correctly validates answers
- Common homophones recognized correctly
- Visual feedback shows recognized speech in real-time
- Keyboard input still works (for testing/fallback)
- Recognition latency < 1 second

---

### Milestone 7: Audio & Visual Polish
**Goal:** Complete sensory feedback for engaging gameplay

**Deliverable:**
- Engine sound (pitch varies with car speed, silent when stopped)
- Correct answer sound (uplifting chime)
- Incorrect answer sound (brief buzzer)
- Boost particle effects (flames/sparks when accelerating)
- Timer bar color transitions (green → yellow → red)
- Answer feedback animations (correct/incorrect visual flash)
- Retro arcade font (Press Start 2P) for all UI

**Success Criteria:**
- Engine audio dynamically responds to car velocity
- Clear audio distinction between correct/incorrect answers
- Boost particles appear when car accelerates
- Timer bar smoothly changes color as time runs out
- All text uses retro pixel font
- Overall aesthetic feels polished and arcade-like

---

## Post-Milestone: Deployment & Testing

**Final Steps:**
1. Production build optimization (`npm run build`)
2. Vercel deployment configuration
3. Cross-browser testing (Chrome, Edge)
4. Microphone permission handling edge cases
5. Performance validation (60 FPS target)
6. Playtesting session for balance tuning

---

## Milestone Dependencies

```
M1 (Foundation)
  ↓
M2 (Physics) ← Must build on M1's track system
  ↓
M3 (Math Problems) ← Needs M2's boost mechanics
  ↓
M4 (Lap Tracking) ← Needs M3's problem flow
  ↓
M5 (Menu System) ← Needs M4's complete game loop
  ↓
M6 (Speech Recognition) ← Can integrate once M5 flow is stable
  ↓
M7 (Polish) ← Final layer on complete game

M6 and M7 could potentially be developed in parallel once M5 is complete.
```

---

## Notes

- Each milestone produces a runnable game state
- Early milestones focus on core mechanics (track, physics, problems)
- Speech recognition comes later to avoid debugging complexity early on
- Polish is final to ensure we're polishing a solid foundation
- Tuning constants (friction, boost power, timers) will be adjusted throughout
