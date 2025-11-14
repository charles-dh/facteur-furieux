# Milestone 7: Audio & Visual Polish

## Summary

This milestone adds the final layer of audio feedback and visual polish to complete the Math Racer experience. The focus is on creating an engaging, arcade-style atmosphere through sound effects, music, and visual enhancements that provide clear feedback for player actions.

**Rationale:** With all core mechanics complete (M1-M6), we now enhance the player experience through:
1. Audio feedback for actions (acceleration, correct/incorrect answers, lap completion)
2. Background music to create atmosphere
3. Visual effects for events (speed boosts, problem transitions)
4. UI polish (animations, transitions, visual consistency)
5. Game feel improvements (screen shake, particles, etc.)

**Success Criteria:**
- Game has satisfying audio feedback for all major player actions
- Background music plays without becoming repetitive or annoying
- Visual effects clearly communicate game state changes
- UI feels polished and professional
- Overall experience feels cohesive and arcade-like

---

## High-Level Milestones

### 7.1 Audio System Foundation
**Goal:** Create a flexible audio management system

**Tasks:**
- [ ] Create `src/systems/AudioManager.js` class
- [ ] Implement sound effect playing with volume control
- [ ] Add background music loop functionality
- [ ] Create audio preloading in GameScene
- [ ] Add mute/unmute toggle functionality
- [ ] Implement volume controls (master, SFX, music)
- [ ] Add audio settings persistence (localStorage)

**Audio Manager API:**
```javascript
class AudioManager {
  constructor(scene)

  // Sound effects
  playSFX(key, volume = 1.0)
  stopSFX(key)

  // Music
  playMusic(key, loop = true, volume = 0.5)
  stopMusic()
  pauseMusic()
  resumeMusic()

  // Controls
  setMasterVolume(volume)  // 0-1
  setSFXVolume(volume)
  setMusicVolume(volume)
  toggleMute()

  // State
  isMuted()
  getVolumes()  // Returns {master, sfx, music}
}
```

**Technical Notes:**
- Use Phaser's sound system (`this.sound`)
- All sounds loaded in preload() phase
- Volumes are multiplicative (master × category × individual)
- Settings persist across sessions using localStorage

**Deliverable:** AudioManager class with volume controls and persistence ⏸️

---

### 7.2 Sound Effect Generation and Integration
**Goal:** Add audio feedback for all major game events

**Tasks:**
- [ ] Generate/source sound effects for:
  - [ ] Engine acceleration (speed increase)
  - [ ] Correct answer chime
  - [ ] Incorrect answer buzz
  - [ ] Lap completion fanfare
  - [ ] Problem appearance/countdown tick
  - [ ] Menu navigation (button hover/click)
  - [ ] Game start countdown (3-2-1-GO!)
- [ ] Integrate SFX into existing systems:
  - [ ] Vehicle physics (speed changes)
  - [ ] Problem system (correct/incorrect)
  - [ ] Lap tracking (lap complete)
  - [ ] Menu scenes (navigation)
- [ ] Test audio timing and volume balance
- [ ] Add audio credits if using licensed sounds

**Sound Effect Strategy:**
We have two options:
1. **Generate with Web Audio API** - Synthesize simple retro sounds programmatically
2. **Use open-source SFX libraries** - Sites like freesound.org, OpenGameArt.org

**Recommended Approach:** Use Web Audio API for simple effects (beeps, boops) and source a few key sounds (correct answer chime, lap fanfare) for better quality.

**Sound Design Guidelines:**
- **Short duration** - Most SFX < 1 second
- **Retro/arcade style** - Match visual aesthetic
- **Clear frequency separation** - Distinct sounds for different events
- **Not annoying** - Can be heard repeatedly without irritation

**Deliverable:** Complete set of sound effects integrated into gameplay ⏸️

---

### 7.3 Background Music System
**Goal:** Add atmospheric music without being repetitive

**Tasks:**
- [ ] Create/source background music tracks:
  - [ ] Menu music (calm, inviting)
  - [ ] Gameplay music (upbeat, energetic)
  - [ ] (Optional) Victory/results music
- [ ] Implement music playback in scenes
- [ ] Add crossfade between tracks when changing scenes
- [ ] Ensure music loops smoothly without gaps
- [ ] Add music on/off toggle in settings
- [ ] Test music doesn't conflict with speech recognition

**Music Strategy:**
Options:
1. **Procedural music** - Generate simple chip-tune loops with Tone.js
2. **Creative Commons music** - Sites like ccMixter, Incompetech
3. **No music** - Focus on SFX only (valid choice)

**Recommended Approach:** Start with one simple looping track for gameplay. Music is optional but adds polish.

**Music Requirements:**
- **Loopable** - Seamless restart
- **Non-intrusive** - Shouldn't interfere with concentration
- **Genre** - Retro chip-tune, synthwave, or upbeat electronic
- **Duration** - 1-2 minutes minimum to avoid quick repetition
- **Licensing** - CC0 or compatible with open source

**Deliverable:** Background music system with scene-based tracks ⏸️

---

### 7.4 Visual Effects for Game Events
**Goal:** Add visual feedback that enhances game feel

**Tasks:**
- [ ] Create particle effects system
- [ ] Add effects for:
  - [ ] Speed boost (particles from car)
  - [ ] Correct answer (green flash/sparkle)
  - [ ] Incorrect answer (red screen shake)
  - [ ] Lap completion (confetti/celebration)
  - [ ] Problem countdown (pulsing timer)
- [ ] Implement screen shake for impacts/errors
- [ ] Add smooth transitions between game states
- [ ] Create visual feedback for speech recognition status
- [ ] Polish problem overlay animations

**Visual Effects Examples:**
```javascript
// Speed boost particles
class SpeedBoostEffect {
  // Emit particles from rear of car
  // Color: yellow/orange
  // Duration: while boost active
}

// Correct answer flash
class CorrectAnswerEffect {
  // Brief green overlay fade
  // Optional: star particles
  // Duration: 300ms
}

// Screen shake
function screenShake(intensity, duration) {
  // Offset camera position
  // Decay over duration
}
```

**Technical Notes:**
- Use Phaser's particle emitter system
- Keep effects brief to avoid visual clutter
- Effects should enhance, not distract from core gameplay

**Deliverable:** Visual effects for all major game events ⏸️

---

### 7.5 UI Polish and Animations
**Goal:** Make all UI elements feel smooth and professional

**Tasks:**
- [ ] Add button hover/press animations
- [ ] Implement smooth transitions between menu screens
- [ ] Add animated countdown for game start (3-2-1-GO!)
- [ ] Polish problem display (fade in/out, scale animation)
- [ ] Add HUD animations (speed bar fill, lap counter pulse)
- [ ] Create loading screen with progress bar
- [ ] Add visual feedback for settings changes
- [ ] Ensure consistent spacing and alignment across all UI

**UI Animation Guidelines:**
- **Subtle** - Don't overdo it
- **Quick** - Most animations < 300ms
- **Consistent** - Same timing/easing across similar elements
- **Purpose** - Every animation should communicate something

**Key Animations:**
```javascript
// Button press (scale down)
button.on('pointerdown', () => {
  this.scene.tweens.add({
    targets: button,
    scaleX: 0.95,
    scaleY: 0.95,
    duration: 100,
    yoyo: true
  });
});

// Problem fade in
this.tweens.add({
  targets: problemText,
  alpha: { from: 0, to: 1 },
  scale: { from: 0.8, to: 1 },
  duration: 300,
  ease: 'Back.easeOut'
});
```

**Deliverable:** Polished UI with smooth animations throughout ⏸️

---

### 7.6 Game Feel Improvements
**Goal:** Add subtle touches that make the game feel great

**Tasks:**
- [ ] Fine-tune car acceleration curves (ease in/out)
- [ ] Add slight camera zoom based on speed
- [ ] Implement speed lines or motion blur effect
- [ ] Add visual indication of car direction (tire tracks?)
- [ ] Polish timer countdown (color changes, urgency)
- [ ] Add celebration sequence for perfect laps
- [ ] Implement smooth camera transitions
- [ ] Add "juiciness" to all interactions

**Game Feel Principles:**
- **Immediate feedback** - Every action has a response
- **Weight and momentum** - Things don't start/stop instantly
- **Anticipation** - Telegraph upcoming events
- **Exaggeration** - Slightly over-emphasize important moments

**Examples:**
- Car starts with slight wheelspin effect
- Timer changes color as time runs out (green → yellow → red)
- Perfect answer gives extra-satisfying feedback
- Lap records flash and celebrate

**Deliverable:** Game feels satisfying and responsive to play ⏸️

---

### 7.7 Performance Optimization and Final Polish
**Goal:** Ensure smooth performance and fix any rough edges

**Tasks:**
- [ ] Profile game performance (use Chrome DevTools)
- [ ] Optimize particle effects if causing frame drops
- [ ] Reduce audio file sizes if needed
- [ ] Test on different screen sizes/resolutions
- [ ] Verify all assets are properly preloaded
- [ ] Add loading states for async operations
- [ ] Fix any visual glitches or timing issues
- [ ] Final playtesting session with all features
- [ ] Update documentation with audio/visual features

**Performance Targets:**
- Maintain 60 FPS during gameplay
- Load time < 3 seconds on decent connection
- Audio latency < 100ms
- No visible stuttering or frame drops

**Final Polish Checklist:**
- [ ] All sounds play at appropriate volumes
- [ ] No audio clipping or distortion
- [ ] Visual effects don't obscure gameplay
- [ ] UI is readable in all states
- [ ] No console errors or warnings
- [ ] Smooth experience from start to finish

**Deliverable:** Fully polished game ready for release ⏸️

---

## Technical Architecture

### File Structure After Milestone 7
```
/src
  /scenes
    GameScene.js          (updated - add effects)
    MenuScene.js          (updated - add music/SFX)
    SettingsScene.js      (updated - add audio controls)
  /systems
    AudioManager.js       ✨ NEW - Audio system
    ParticleEffects.js    ✨ NEW - Visual effects
    Track.js              (existing)
    Vehicle.js            (existing)
    ProblemManager.js     (existing)
    LapTracker.js         (existing)
    SpeechRecognition.js  (existing)
  /effects
    ScreenShake.js        ✨ NEW - Camera shake utility
    Transitions.js        ✨ NEW - Scene transitions
  /config
    audioConfig.js        ✨ NEW - Audio settings
    colors.js             (existing)
    constants.js          (existing)
  /assets
    /audio
      /sfx                ✨ NEW - Sound effects
      /music              ✨ NEW - Background music
  main.js                 (existing)
```

### Key Classes

**AudioManager** (`src/systems/AudioManager.js`)
```javascript
class AudioManager {
  constructor(scene)

  // Core methods
  playSFX(key, volume)
  playMusic(key, loop, volume)
  setVolume(type, value)
  toggleMute()

  // State
  volumes = { master: 1, sfx: 1, music: 0.5 }
  muted = false
}
```

**ParticleEffects** (`src/systems/ParticleEffects.js`)
```javascript
class ParticleEffects {
  constructor(scene)

  // Effect methods
  createSpeedBoost(x, y)
  createCorrectFlash()
  createIncorrectShake()
  createLapCelebration(x, y)

  // Cleanup
  destroyEffect(effect)
}
```

### Integration Points

**GameScene Updates:**
- Add AudioManager initialization in `create()`
- Integrate effects in existing systems (Vehicle, ProblemManager, LapTracker)
- Add particle emitters for visual effects

**SettingsScene Updates:**
- Add volume sliders (master, SFX, music)
- Add mute toggle button
- Persist settings to localStorage

---

## Constants to Add

**In `src/config/audioConfig.js`:**
```javascript
export const AUDIO = {
  // Volume defaults
  DEFAULT_MASTER_VOLUME: 0.7,
  DEFAULT_SFX_VOLUME: 1.0,
  DEFAULT_MUSIC_VOLUME: 0.5,

  // Sound effect keys
  SFX: {
    ACCELERATE: 'sfx_accelerate',
    CORRECT: 'sfx_correct',
    INCORRECT: 'sfx_incorrect',
    LAP_COMPLETE: 'sfx_lap_complete',
    PROBLEM_APPEAR: 'sfx_problem_appear',
    COUNTDOWN_TICK: 'sfx_countdown_tick',
    MENU_CLICK: 'sfx_menu_click',
    MENU_HOVER: 'sfx_menu_hover'
  },

  // Music keys
  MUSIC: {
    MENU: 'music_menu',
    GAMEPLAY: 'music_gameplay'
  },

  // Effect settings
  FADE_DURATION: 500,  // ms for crossfade
  MAX_SIMULTANEOUS_SFX: 8
};

export const EFFECTS = {
  SCREEN_SHAKE: {
    INTENSITY: 10,      // pixels
    DURATION: 200       // ms
  },

  PARTICLES: {
    SPEED_BOOST: {
      QUANTITY: 2,
      LIFESPAN: 300,
      SPEED: { min: 50, max: 100 },
      SCALE: { start: 1, end: 0 }
    },
    CELEBRATION: {
      QUANTITY: 50,
      LIFESPAN: 1000,
      SPEED: { min: 100, max: 200 }
    }
  }
};
```

---

## Notes & Considerations

### Audio Files
**Options for acquiring audio:**
1. **Generate with code** - Web Audio API, Tone.js
2. **Open source libraries** - Freesound.org, OpenGameArt.org
3. **Commission** - Hire a sound designer (out of scope)

**Recommended:** Mix of generated sounds (simple beeps) and sourced sounds (key events).

### Asset Licensing
- All audio must be CC0 or compatible license
- Document sources in credits
- Include license files in repo

### Performance Considerations
- Audio files should be compressed (OGG/MP3)
- Limit simultaneous sound effects
- Preload all audio in scene preload()
- Use audio sprites for small SFX (optional optimization)

### Accessibility
- Allow full muting of audio
- Don't rely solely on audio cues for important feedback
- Visual alternatives for all audio feedback

### Mobile Considerations
- Mobile browsers require user interaction before playing audio
- Add "tap to start" screen if needed
- Test audio on iOS Safari specifically

### Browser Compatibility
- Chrome: Full Web Audio API support
- Firefox: Good support
- Safari: Some quirks with audio playback
- Edge: Generally good support

**Primary target:** Chrome (matches speech recognition requirement)

---

## Testing Strategy

### Audio Testing
1. **Volume balance**
   - All sounds audible at default settings
   - No clipping or distortion
   - SFX don't overpower music

2. **Timing**
   - Sounds trigger immediately on events
   - No delay between action and audio
   - Music loops seamlessly

3. **Settings persistence**
   - Volume changes persist across sessions
   - Mute state remembered
   - Settings apply immediately

### Visual Effects Testing
1. **Performance**
   - Maintain 60 FPS with all effects active
   - No stuttering during particle effects
   - Smooth animations throughout

2. **Clarity**
   - Effects don't obscure gameplay
   - Important information always visible
   - Effects clearly communicate their purpose

### User Experience Testing
1. **Game feel**
   - Controls feel responsive
   - Feedback is immediate
   - Game feels polished and complete

2. **Accessibility**
   - Works with audio disabled
   - Visual feedback sufficient on its own
   - Settings are discoverable

### Cross-browser Testing
- Test in Chrome (primary target)
- Verify in Firefox
- Check Safari if possible
- Note any browser-specific issues

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** ⏸️ NOT STARTED

**Implementation Notes:**
(Notes will be added as work progresses)

**Next Steps After Completion:**
1. Final playtesting session
2. Update all documentation
3. Create release build
4. Prepare for deployment

---

## Optional Enhancements

These are nice-to-have features that can be added if time permits:

- [ ] Dynamic music that changes tempo based on game state
- [ ] Announcer voice ("Ready... Set... Go!")
- [ ] More elaborate particle systems (rain, sparkles)
- [ ] Animated background elements
- [ ] Replay system with cinematic camera
- [ ] Achievement unlocks with special effects
- [ ] Custom sound packs (let users choose audio themes)

**Note:** Focus on core polish first. Optional enhancements should only be added after all primary tasks are complete and tested.
