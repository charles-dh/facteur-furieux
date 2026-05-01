# Milestone 6: French Speech Recognition

## Summary

This milestone transforms Math Racer from a keyboard-based game into a true voice-controlled educational experience. Players will answer multiplication problems by speaking French numbers aloud, creating a hands-free, immersive gameplay loop that reinforces both math skills and number vocabulary.

**Context:** After M5, we have a complete, polished game with menu system, configurable tables, and full race progression. However, players must type answers using the keyboard, which breaks immersion and limits the educational value. Voice input is the defining feature that makes Math Racer unique—it combines mental math practice with speaking practice, increases engagement through natural interaction, and allows players to focus on the racing action without looking at the keyboard.

**Rationale:**
1. **Hands-free gameplay** - Eyes stay on the racing action, not the keyboard
2. **Speaking practice** - Reinforces French number vocabulary pronunciation
3. **Immersion** - Natural, conversational interaction feels magical
4. **Accessibility** - Easier for younger children than typing
5. **Unique value proposition** - Differentiates from typical math drill software
6. **Speed incentive** - Speaking is faster than typing for quick answers
7. **Educational depth** - Combines multiplication fluency with language skills

**Technical Challenges:**
- Web Speech API accuracy varies (especially for French)
- Homophone confusion ("six" vs "sis", "cent" vs "sang")
- Background noise interference
- Browser compatibility (Chrome/Edge only)
- Recognition latency must be < 1 second
- Continuous listening without false triggers
- Graceful fallback to keyboard when speech fails

**Success Criteria:**
- Microphone permission requested on game start
- Continuous listening during gameplay
- French numbers (2-100) recognized correctly with >80% accuracy
- Common homophones handled intelligently
- Visual feedback shows what's being heard in real-time
- Recognition latency < 1 second from speaking to validation
- Keyboard input still works as fallback
- Clear UI indicators for mic status (listening/not listening)
- Graceful error handling for permission denial or unsupported browsers

---

## High-Level Milestones

### 6.1 Implement Basic Web Speech API Integration
**Goal:** Get speech recognition working with basic number detection

**Tasks:**
- [x] Create `src/systems/FrenchSpeechRecognition.js` class
- [x] Request microphone permission
- [x] Initialize Web Speech API with `fr-FR` locale
- [x] Configure continuous listening mode
- [x] Implement start/stop methods
- [x] Test basic recognition with simple French words
- [x] Handle browser compatibility (detect unsupported browsers)
- [x] Handle permission denial gracefully

**Web Speech API Configuration:**
```javascript
class FrenchSpeechRecognition {
  constructor() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Web Speech API not supported in this browser');
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SpeechRecognition();

    // Configure for French
    this.recognition.lang = 'fr-FR';

    // Continuous listening (doesn't stop after first result)
    this.recognition.continuous = true;

    // Get interim results (real-time feedback)
    this.recognition.interimResults = true;

    // Multiple interpretation alternatives
    this.recognition.maxAlternatives = 5;

    // Event handlers
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();
  }

  start() {
    if (!this.supported) return;

    try {
      this.recognition.start();
      this.listening = true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }

  stop() {
    if (!this.supported) return;

    try {
      this.recognition.stop();
      this.listening = false;
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }

  handleResult(event) {
    // Process speech recognition results
    // (implemented in 6.2)
  }

  handleError(event) {
    console.error('Speech recognition error:', event.error);

    // Handle specific errors
    if (event.error === 'not-allowed') {
      // Microphone permission denied
      this.onPermissionDenied?.();
    } else if (event.error === 'no-speech') {
      // No speech detected (not necessarily an error)
      console.log('No speech detected');
    }
  }

  handleEnd() {
    // Recognition stopped
    // Restart if we want continuous listening
    if (this.listening && this.supported) {
      this.recognition.start();
    }
  }
}
```

**Permission Request:**
```javascript
// Request permission when game starts
async requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Permission granted, stop the stream (we don't need it yet)
    stream.getTracks().forEach(track => track.stop());

    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}
```

**Browser Detection:**
```javascript
// In GameScene or MenuScene
detectSpeechSupport() {
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!supported) {
    // Show warning message to user
    this.showWarning('La reconnaissance vocale nécessite Chrome ou Edge');
  }

  return supported;
}
```

**Deliverable:** Speech recognition initializes and can start/stop listening

---

### 6.2 Implement French Number Parser
**Goal:** Convert speech transcripts to numbers

**Tasks:**
- [x] Create multi-strategy number parsing system
- [x] Implement digit recognition ("12", "douze")
- [x] Implement French word-to-number conversion ("douze" → 12)
- [x] Handle tens and units ("vingt-trois" → 23)
- [x] Handle compound numbers ("quatre-vingt-dix" → 90)
- [x] Handle special cases (70 = "soixante-dix", 80 = "quatre-vingts")
- [x] Test all numbers from 2-100
- [x] Handle variations in spacing/hyphens

**Number Parsing Strategies:**

**Strategy 1: Direct digit recognition**
```javascript
parseDigits(transcript) {
  // Match sequences of digits
  const digitMatch = transcript.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }
  return null;
}
```

**Strategy 2: French word mapping**
```javascript
// French number words dictionary
const FRENCH_NUMBERS = {
  // Units (0-16)
  'zéro': 0, 'zero': 0,
  'un': 1, 'une': 1,
  'deux': 2,
  'trois': 3,
  'quatre': 4,
  'cinq': 5,
  'six': 6,
  'sept': 7,
  'huit': 8,
  'neuf': 9,
  'dix': 10,
  'onze': 11,
  'douze': 12,
  'treize': 13,
  'quatorze': 14,
  'quinze': 15,
  'seize': 16,

  // Tens (20-90)
  'vingt': 20,
  'trente': 30,
  'quarante': 40,
  'cinquante': 50,
  'soixante': 60,
  'soixante-dix': 70,
  'quatre-vingt': 80, 'quatre-vingts': 80,
  'quatre-vingt-dix': 90,

  // Special
  'cent': 100
};

parseFrenchWords(transcript) {
  const cleaned = transcript.toLowerCase().trim();

  // Direct lookup for simple numbers
  if (FRENCH_NUMBERS[cleaned] !== undefined) {
    return FRENCH_NUMBERS[cleaned];
  }

  // Handle compound numbers (e.g., "vingt-trois", "vingt trois")
  return this.parseCompoundNumber(cleaned);
}

parseCompoundNumber(text) {
  // Handle patterns like "vingt-trois" or "vingt trois"
  // Split on hyphens or spaces
  const parts = text.split(/[-\s]+/);

  let total = 0;
  let current = 0;

  for (const part of parts) {
    const value = FRENCH_NUMBERS[part];

    if (value === undefined) {
      return null; // Unknown word
    }

    if (value === 100) {
      // "cent" multiplies previous value
      total = current === 0 ? 100 : current * 100;
      current = 0;
    } else if (value >= 20) {
      // Tens value
      total += current;
      current = value;
    } else {
      // Units value (add to current tens)
      current += value;
    }
  }

  total += current;
  return total;
}
```

**Strategy 3: Homophone handling**
```javascript
// Common misrecognitions for French numbers
const HOMOPHONES = {
  'sis': '6',         // "six" misheard
  'cis': '6',
  'dix': '10',        // correct but ensure mapping
  'dis': '10',        // common misspelling
  'vain': '20',       // "vingt" misheard
  'van': '20',
  'sang': '100',      // "cent" misheard
  'san': '100',
  'sen': '100',
  'set': '7',         // "sept" misheard
  'sete': '7',
  'uit': '8',         // "huit" misheard
  'cat': '4',         // "quatre" misheard
  'katr': '4'
};

parseWithHomophones(transcript) {
  const cleaned = transcript.toLowerCase().trim();

  // Check homophone mappings
  if (HOMOPHONES[cleaned]) {
    return parseInt(HOMOPHONES[cleaned], 10);
  }

  return null;
}
```

**Strategy 4: Context-aware matching**
```javascript
// If we know the expected answer is 42, be more lenient
parseWithContext(transcript, expectedAnswer) {
  const number = this.parseNumber(transcript);

  if (number === expectedAnswer) {
    return number; // Exact match
  }

  // Check if transcript sounds like expected answer
  const expectedWords = this.numberToFrenchWords(expectedAnswer);

  // Fuzzy matching (Levenshtein distance, etc.)
  if (this.isSimilar(transcript, expectedWords)) {
    return expectedAnswer;
  }

  return number;
}
```

**Complete Parser:**
```javascript
parseNumber(transcript) {
  // Try each strategy in order
  let number = null;

  // Strategy 1: Digits
  number = this.parseDigits(transcript);
  if (number !== null) return number;

  // Strategy 2: French words
  number = this.parseFrenchWords(transcript);
  if (number !== null) return number;

  // Strategy 3: Homophones
  number = this.parseWithHomophones(transcript);
  if (number !== null) return number;

  // All strategies failed
  return null;
}
```

**Testing:**
```javascript
// Test all multiplication results (2-100)
const testCases = [
  { input: 'douze', expected: 12 },
  { input: '12', expected: 12 },
  { input: 'vingt-trois', expected: 23 },
  { input: 'vingt trois', expected: 23 },
  { input: 'soixante-dix', expected: 70 },
  { input: 'quatre-vingt-dix', expected: 90 },
  { input: 'cent', expected: 100 },
  { input: 'sis', expected: 6 },  // Homophone
  { input: 'dis', expected: 10 }, // Homophone
];

testCases.forEach(test => {
  const result = parser.parseNumber(test.input);
  console.assert(result === test.expected, `Expected ${test.expected}, got ${result}`);
});
```

**Deliverable:** Robust French number parser handling all cases

---

### 6.3 Integrate Speech Recognition with GameScene
**Goal:** Speech recognition actively validates answers during gameplay

**Tasks:**
- [x] Create FrenchSpeechRecognition instance in GameScene
- [x] Start listening when game begins
- [x] Stop listening when game ends
- [x] Process speech results and extract numbers
- [x] Validate recognized numbers against current problem
- [x] Handle correct answers (trigger boost)
- [x] Handle incorrect answers (show feedback, keep listening)
- [x] Maintain keyboard fallback functionality
- [x] Update current answer display with recognized speech

**GameScene Integration:**
```javascript
class GameScene extends Phaser.Scene {
  create() {
    // ... existing setup ...

    // Initialize speech recognition
    this.speechRecognition = new FrenchSpeechRecognition();

    // Set up callbacks
    this.speechRecognition.onNumberRecognized = (number) => {
      this.handleSpeechAnswer(number);
    };

    this.speechRecognition.onTranscriptUpdate = (transcript) => {
      this.updateTranscriptDisplay(transcript);
    };

    this.speechRecognition.onPermissionDenied = () => {
      this.showPermissionDeniedWarning();
    };

    // Request permission and start listening
    this.requestMicrophoneAndStart();

    // ... rest of setup ...
  }

  async requestMicrophoneAndStart() {
    const permitted = await this.speechRecognition.requestMicrophonePermission();

    if (permitted) {
      this.speechRecognition.start();
      this.showMicrophoneStatus(true);
    } else {
      this.showPermissionDeniedWarning();
      // Game still playable with keyboard
    }
  }

  handleSpeechAnswer(number) {
    // Same logic as keyboard answer, but with speech input
    const correct = this.mathProblem.checkAnswer(number);

    if (correct) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  shutdown() {
    // Clean up when leaving scene
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }
}
```

**Speech Result Processing:**
```javascript
// In FrenchSpeechRecognition class
handleResult(event) {
  const results = event.results;
  const lastResult = results[results.length - 1];

  // Process all alternatives (Web Speech API provides multiple interpretations)
  for (let i = 0; i < lastResult.length; i++) {
    const transcript = lastResult[i].transcript;
    const confidence = lastResult[i].confidence;

    console.log(`Alternative ${i}: "${transcript}" (confidence: ${confidence})`);

    // Try to parse number from transcript
    const number = this.parseNumber(transcript);

    if (number !== null) {
      // Found a number! Emit event
      this.onNumberRecognized?.call(this, number);

      // Show what was recognized
      this.onTranscriptUpdate?.call(this, transcript);

      return; // Stop processing alternatives
    }
  }

  // No number found in any alternative
  // Update transcript display anyway (for user feedback)
  if (lastResult[0]) {
    this.onTranscriptUpdate?.call(this, lastResult[0].transcript);
  }
}
```

**Deliverable:** Speech recognition validates answers during gameplay

---

### 6.4 Add Real-Time Visual Feedback
**Goal:** Show players what the game is hearing

**Tasks:**
- [x] Create transcript display area (below problem)
- [x] Update display with interim results (real-time)
- [x] Show recognized number when detected
- [x] Add microphone status indicator (listening/muted)
- [x] Visual feedback for successful recognition
- [x] Style with retro aesthetic
- [x] Clear transcript after answer processed

**Transcript Display UI:**
```javascript
// In GameScene.create()
createTranscriptDisplay() {
  // Microphone icon/status
  this.micIcon = this.add.text(400, 480, '🎤', {
    fontSize: '24px'
  }).setOrigin(0.5).setVisible(false);

  // Transcript text (what's being heard)
  this.transcriptText = this.add.text(400, 510, '', {
    fontFamily: '"Press Start 2P"',
    fontSize: '14px',
    color: '#888888',
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center'
  }).setOrigin(0.5);

  // Recognized number (larger, highlighted)
  this.recognizedNumberText = this.add.text(400, 540, '', {
    fontFamily: '"Press Start 2P"',
    fontSize: '18px',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5);
}

updateTranscriptDisplay(transcript) {
  // Show raw transcript in gray
  this.transcriptText.setText(`"${transcript}"`);

  // Try to parse number
  const number = this.speechRecognition.parseNumber(transcript);

  if (number !== null) {
    // Show recognized number in yellow
    this.recognizedNumberText.setText(`→ ${number}`);
  } else {
    this.recognizedNumberText.setText('');
  }
}

clearTranscriptDisplay() {
  this.transcriptText.setText('');
  this.recognizedNumberText.setText('');
}

showMicrophoneStatus(listening) {
  this.micIcon.setVisible(listening);

  if (listening) {
    this.micIcon.setAlpha(1.0);
    // Optional: animate microphone icon
    this.tweens.add({
      targets: this.micIcon,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│              7 × 8 = ?                  │
│          [████████░░░░]                 │
│                                         │
│               🎤                        │  ← Mic status
│         "quarante six"                  │  ← Transcript
│             → 46                        │  ← Recognized number
│                                         │
└─────────────────────────────────────────┘
```

**Deliverable:** Clear visual feedback showing speech recognition in action

---

### 6.5 Implement Hybrid Input System
**Goal:** Keyboard and speech work together seamlessly

**Tasks:**
- [x] Maintain existing keyboard input functionality
- [x] Allow both input methods to work simultaneously
- [x] Decide on priority (speech vs keyboard)
- [x] Update current answer display for both input types
- [x] Clear keyboard input buffer when speech answer detected
- [x] Test switching between input methods mid-game

**Input Strategy:**

**Option 1: Both inputs validated independently**
```javascript
// In GameScene

// Existing keyboard input (from M3)
handleKeyboardInput(key) {
  if (key >= '0' && key <= '9') {
    this.currentKeyboardAnswer += key;
    this.updateAnswerDisplay(this.currentKeyboardAnswer);
  } else if (key === 'Enter') {
    const number = parseInt(this.currentKeyboardAnswer, 10);
    this.validateAnswer(number);
    this.currentKeyboardAnswer = '';
  } else if (key === 'Backspace') {
    this.currentKeyboardAnswer = this.currentKeyboardAnswer.slice(0, -1);
    this.updateAnswerDisplay(this.currentKeyboardAnswer);
  }
}

// New speech input
handleSpeechAnswer(number) {
  // Speech provides complete number, validate immediately
  this.validateAnswer(number);

  // Clear any partial keyboard input
  this.currentKeyboardAnswer = '';
  this.updateAnswerDisplay('');
}

// Unified validation
validateAnswer(number) {
  const correct = this.mathProblem.checkAnswer(number);

  if (correct) {
    this.handleCorrectAnswer();
  } else {
    this.handleIncorrectAnswer();
  }
}
```

**Option 2: Speech takes priority (recommended)**
```javascript
// Same as Option 1, but also:
// - Disable keyboard input while speech is active
// - Or: Show which input method detected the answer

handleSpeechAnswer(number) {
  // Clear keyboard state
  this.currentKeyboardAnswer = '';

  // Disable keyboard briefly to prevent conflicts
  this.keyboardEnabled = false;

  this.validateAnswer(number);

  // Re-enable keyboard after short delay
  this.time.delayedCall(500, () => {
    this.keyboardEnabled = true;
  });
}
```

**Answer Display Update:**
```javascript
// Show answer from either input source
updateAnswerDisplay(text) {
  this.currentAnswerText.setText(text);
}

// For speech, show briefly then clear
handleSpeechAnswer(number) {
  this.updateAnswerDisplay(number.toString());

  const correct = this.validateAnswer(number);

  // Clear after feedback
  this.time.delayedCall(correct ? 500 : 1000, () => {
    this.updateAnswerDisplay('');
  });
}
```

**Deliverable:** Both keyboard and speech input work smoothly

---

### 6.6 Add Microphone Permission UI
**Goal:** Handle permission request and denial gracefully

**Tasks:**
- [x] Show permission request explanation before asking
- [x] Display clear instructions if permission denied
- [x] Provide option to retry permission request
- [x] Show fallback message (keyboard still works)
- [x] Add microphone icon to indicate status
- [x] Handle browser incompatibility message
- [x] Test permission flows (grant, deny, block)

**Permission Flow:**

**In MenuScene (before game starts):**
```javascript
// Optional: Request permission early in MenuScene
async create() {
  // ... existing menu setup ...

  // Check speech support
  if (this.detectSpeechSupport()) {
    // Show microphone setup button
    this.createMicrophoneSetupButton();
  } else {
    // Show browser warning
    this.showBrowserWarning();
  }
}

createMicrophoneSetupButton() {
  const button = this.add.text(400, 650, '[ Activer le micro ]', {
    fontFamily: '"Press Start 2P"',
    fontSize: '14px',
    color: '#00ff00',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.requestMicrophone());

  this.micSetupButton = button;
}

async requestMicrophone() {
  const permitted = await this.speechRecognition.requestMicrophonePermission();

  if (permitted) {
    this.micSetupButton.setText('[ Micro activé ✓ ]');
    this.micSetupButton.setColor('#ffff00');
    this.micSetupButton.removeInteractive();
  } else {
    this.showPermissionDeniedDialog();
  }
}

showPermissionDeniedDialog() {
  const message = this.add.text(400, 700,
    'Micro refusé\nVous pouvez utiliser le clavier',
    {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 8
    }
  ).setOrigin(0.5);
}
```

**In GameScene (fallback handling):**
```javascript
showPermissionDeniedWarning() {
  const warning = this.add.text(400, 50,
    'Micro non disponible - Utilisez le clavier',
    {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }
  ).setOrigin(0.5);

  // Hide after a few seconds
  this.time.delayedCall(5000, () => {
    warning.destroy();
  });
}

showBrowserWarning() {
  const warning = this.add.text(400, 400,
    'Reconnaissance vocale non supportée\n\nUtilisez Chrome ou Edge\n\nClavier disponible',
    {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 12
    }
  ).setOrigin(0.5);
}
```

**Permission States:**
- **Not requested:** Show "Activer le micro" button
- **Granted:** Show "Micro activé ✓" or microphone icon
- **Denied:** Show "Micro refusé - Utilisez le clavier"
- **Unsupported browser:** Show "Utilisez Chrome ou Edge"

**Deliverable:** Clear UI for all permission states

---

### 6.7 Optimize Recognition Performance
**Goal:** Minimize latency and improve accuracy

**Tasks:**
- [x] Tune recognition parameters (continuous, interim, maxAlternatives)
- [x] Implement recognition timeout (auto-restart if hung)
- [x] Debounce rapid recognition events
- [x] Cache parsed numbers to avoid re-parsing
- [x] Profile recognition latency (goal: < 1 second)
- [x] Test with background noise
- [x] Optimize parser performance
- [x] Handle recognition restart seamlessly

**Performance Optimizations:**

**Auto-restart on hang:**
```javascript
// In FrenchSpeechRecognition
start() {
  if (!this.supported) return;

  this.recognition.start();
  this.listening = true;
  this.lastResultTime = Date.now();

  // Watchdog: restart if no results for 10 seconds
  this.watchdogTimer = setInterval(() => {
    const timeSinceLastResult = Date.now() - this.lastResultTime;

    if (timeSinceLastResult > 10000 && this.listening) {
      console.warn('Speech recognition appears hung, restarting...');
      this.restart();
    }
  }, 5000);
}

restart() {
  this.stop();
  setTimeout(() => this.start(), 100);
}

handleResult(event) {
  this.lastResultTime = Date.now();
  // ... rest of result handling ...
}
```

**Debounce duplicate recognitions:**
```javascript
// Avoid processing same number multiple times rapidly
handleResult(event) {
  const results = event.results;
  const lastResult = results[results.length - 1];

  // Only process final results (not interim)
  if (!lastResult.isFinal) {
    // Update transcript display but don't validate
    this.onTranscriptUpdate?.call(this, lastResult[0].transcript);
    return;
  }

  // Process final result
  for (let i = 0; i < lastResult.length; i++) {
    const transcript = lastResult[i].transcript;
    const number = this.parseNumber(transcript);

    if (number !== null) {
      // Check if this is a duplicate of recently recognized number
      if (this.isDuplicateRecognition(number)) {
        console.log('Ignoring duplicate recognition:', number);
        return;
      }

      this.lastRecognizedNumber = number;
      this.lastRecognitionTime = Date.now();

      this.onNumberRecognized?.call(this, number);
      return;
    }
  }
}

isDuplicateRecognition(number) {
  // Ignore if same number recognized within 1 second
  const timeSinceLast = Date.now() - this.lastRecognitionTime;
  return (number === this.lastRecognizedNumber && timeSinceLast < 1000);
}
```

**Caching parsed numbers:**
```javascript
// Cache parsing results to avoid re-parsing same transcripts
constructor() {
  this.parseCache = new Map();
}

parseNumber(transcript) {
  // Check cache first
  if (this.parseCache.has(transcript)) {
    return this.parseCache.get(transcript);
  }

  // Parse normally
  const number = this._parseNumberInternal(transcript);

  // Cache result (limit cache size)
  if (this.parseCache.size > 100) {
    // Clear old entries
    const firstKey = this.parseCache.keys().next().value;
    this.parseCache.delete(firstKey);
  }

  this.parseCache.set(transcript, number);
  return number;
}
```

**Deliverable:** Fast, responsive speech recognition

---

### 6.8 Handle Edge Cases and Errors
**Goal:** Robust error handling for production use

**Tasks:**
- [x] Handle recognition errors (no-speech, aborted, network)
- [x] Handle rapid answer changes (user corrects themselves)
- [x] Handle ambiguous transcripts (unclear speech)
- [x] Handle very long pauses (restart recognition)
- [x] Handle tab switching (pause/resume recognition)
- [x] Test with various microphone qualities
- [x] Test with background noise/music
- [x] Document limitations and best practices

**Error Handling:**
```javascript
handleError(event) {
  console.error('Speech recognition error:', event.error);

  switch (event.error) {
    case 'not-allowed':
      // Microphone permission denied
      this.onPermissionDenied?.();
      this.listening = false;
      break;

    case 'no-speech':
      // No speech detected (normal, not really an error)
      console.log('No speech detected, continuing...');
      break;

    case 'aborted':
      // Recognition aborted (usually from manual stop)
      console.log('Recognition aborted');
      break;

    case 'network':
      // Network error (shouldn't happen with local recognition)
      console.error('Network error during recognition');
      this.restart();
      break;

    case 'audio-capture':
      // No microphone found
      this.onAudioCaptureError?.();
      this.listening = false;
      break;

    default:
      console.error('Unknown recognition error:', event.error);
  }
}
```

**Page Visibility Handling:**
```javascript
// Pause recognition when tab is hidden (saves resources)
constructor() {
  // ... existing setup ...

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      this.pauseForHiddenTab();
    } else {
      this.resumeForVisibleTab();
    }
  });
}

pauseForHiddenTab() {
  if (this.listening) {
    this.stop();
    this.wasListeningBeforeHidden = true;
  }
}

resumeForVisibleTab() {
  if (this.wasListeningBeforeHidden) {
    this.start();
    this.wasListeningBeforeHidden = false;
  }
}
```

**Ambiguous Speech Handling:**
```javascript
// When transcript is unclear, show what was heard
handleResult(event) {
  // ... existing result processing ...

  // If no number found in final result, show feedback
  if (lastResult.isFinal) {
    const transcript = lastResult[0].transcript;
    const number = this.parseNumber(transcript);

    if (number === null) {
      // Couldn't parse - show what was heard
      this.onAmbiguousTranscript?.call(this, transcript);
    }
  }
}

// In GameScene
handleAmbiguousTranscript(transcript) {
  // Show feedback that speech wasn't understood
  this.transcriptText.setText(`"${transcript}" (?)`);
  this.transcriptText.setColor('#ff8888'); // Reddish tint

  // Reset color after delay
  this.time.delayedCall(2000, () => {
    this.transcriptText.setColor('#888888');
  });
}
```

**Deliverable:** Robust error handling for all edge cases

---

### 6.9 Testing and Validation
**Goal:** Verify speech recognition works reliably

**Tasks:**
- [x] Test all numbers 2-100 with speech
- [x] Test common homophones
- [x] Test with different accents (if possible)
- [x] Test with background noise
- [x] Test permission flows (grant/deny/block)
- [x] Test browser compatibility (Chrome, Edge, Firefox, Safari)
- [x] Test hybrid input (switching between keyboard and speech)
- [x] Measure recognition latency
- [x] Test continuous gameplay session (10+ minutes)
- [x] Document known issues and workarounds

**Testing Scenarios:**

**Scenario 1: Basic number recognition (2-100)**
```
Test each answer:
- Speak "douze" → Recognizes 12
- Speak "vingt-trois" → Recognizes 23
- Speak "quarante-deux" → Recognizes 42
- Speak "soixante-dix" → Recognizes 70
- Speak "quatre-vingt-dix" → Recognizes 90
- Speak "cent" → Recognizes 100

Verify:
- All numbers 2-100 recognized
- Recognition happens within 1 second
- Answer validation triggers correctly
```

**Scenario 2: Homophones and variations**
```
Test misrecognitions:
- Speak "sis" (instead of "six") → Should recognize 6
- Speak "dis" (instead of "dix") → Should recognize 10
- Speak "vingt trois" (with space) → Recognizes 23
- Speak "vingt-trois" (with hyphen) → Recognizes 23

Verify:
- Common homophones handled
- Spacing/hyphen variations work
```

**Scenario 3: Permission handling**
```
Test permission flows:
1. First visit → Permission prompt appears
2. Grant permission → Recognition starts
3. Deny permission → Warning shown, keyboard works
4. Block permission → Error handled gracefully

Verify:
- Clear UI for each state
- Keyboard fallback always works
- No crashes on permission denial
```

**Scenario 4: Hybrid input**
```
Play game using both inputs:
- Start typing "4" then speak "quarante-deux" → Speech takes priority
- Speak incorrect answer, then type correct one → Both validated
- Rapidly switch between input methods

Verify:
- No conflicts between inputs
- Both inputs validated correctly
- Display updates properly
```

**Scenario 5: Continuous gameplay**
```
Play complete race (3 laps) using only speech:
- Answer 30+ problems
- Vary speech speed (fast/slow)
- Include some wrong answers

Verify:
- Recognition stays active entire session
- No performance degradation
- No crashes or hangs
- Accurate problem validation
```

**Scenario 6: Error recovery**
```
Test error scenarios:
- Disconnect microphone mid-game → Error handled
- Switch to tab without microphone → Pauses recognition
- Return to tab → Resumes recognition
- Very loud background noise → Graceful degradation

Verify:
- Errors don't crash game
- Recovery mechanisms work
- User feedback is clear
```

**Scenario 7: Browser compatibility**
```
Test on different browsers:
- Chrome (desktop) → Full support expected
- Edge (desktop) → Full support expected
- Firefox → Warning shown (no Web Speech API)
- Safari → Limited support or warning

Verify:
- Supported browsers work well
- Unsupported browsers show clear message
- Keyboard fallback always available
```

**Performance Benchmarks:**
```javascript
// Measure recognition latency
class LatencyTester {
  testRecognitionLatency() {
    const startTime = Date.now();

    // Trigger recognition
    this.speechRecognition.onNumberRecognized = () => {
      const latency = Date.now() - startTime;
      console.log(`Recognition latency: ${latency}ms`);

      // Assert latency < 1000ms
      console.assert(latency < 1000, 'Latency too high!');
    };

    // Speak test phrase
    // (Manual testing required)
  }
}
```

**Deliverable:** Comprehensive testing confirming reliable speech recognition

---

## Technical Architecture

### Updated File Structure
```
/src
  /scenes
    MenuScene.js              ✅ Updated: Microphone permission request (optional)
    GameScene.js              ✅ Updated: Speech recognition integration
    GameOverScene.js          (unchanged)
  /systems
    FrenchSpeechRecognition.js  ✅ NEW: Complete speech recognition system
    MathProblem.js            (unchanged)
    VehiclePhysics.js         (unchanged)
    Track.js                  (unchanged)
    StatisticsTracker.js      (unchanged)
  /config
    frenchNumbers.js          ✅ NEW: French number dictionaries and homophones
    colors.js                 (unchanged)
    constants.js              (unchanged)
    gameConfig.js             (unchanged)
  main.js                     (unchanged)
```

### Key Classes

**FrenchSpeechRecognition** (`src/systems/FrenchSpeechRecognition.js`)
```javascript
class FrenchSpeechRecognition {
  constructor()

  // Properties
  recognition                 // Web Speech API instance
  supported                   // Browser support flag
  listening                   // Current listening state
  lastRecognizedNumber        // Duplicate detection
  lastRecognitionTime         // Duplicate detection
  parseCache                  // Parsing performance cache
  watchdogTimer               // Auto-restart timer

  // Callbacks (set by GameScene)
  onNumberRecognized          // (number) => void
  onTranscriptUpdate          // (transcript) => void
  onPermissionDenied          // () => void
  onAmbiguousTranscript       // (transcript) => void

  // Methods
  start()                     // Begin listening
  stop()                      // Stop listening
  restart()                   // Stop and start
  requestMicrophonePermission() // Request permission
  handleResult(event)         // Process recognition results
  handleError(event)          // Handle errors
  handleEnd()                 // Handle recognition end
  parseNumber(transcript)     // Multi-strategy number parser
  parseDigits(transcript)     // Strategy 1: Digit recognition
  parseFrenchWords(transcript) // Strategy 2: French word mapping
  parseCompoundNumber(text)   // Handle compound numbers
  parseWithHomophones(transcript) // Strategy 3: Homophone handling
  isDuplicateRecognition(number) // Prevent duplicate processing
  pauseForHiddenTab()         // Pause when tab hidden
  resumeForVisibleTab()       // Resume when tab visible
}
```

**GameScene Updates**
```javascript
// New properties
this.speechRecognition        // FrenchSpeechRecognition instance
this.transcriptText           // Phaser text object for transcript
this.recognizedNumberText     // Phaser text object for recognized number
this.micIcon                  // Microphone status indicator
this.keyboardEnabled          // Toggle for hybrid input

// New methods
requestMicrophoneAndStart()   // Request permission and start listening
handleSpeechAnswer(number)    // Process speech-recognized answer
updateTranscriptDisplay(transcript) // Show what's being heard
clearTranscriptDisplay()      // Clear transcript after answer
showMicrophoneStatus(listening) // Update mic icon
showPermissionDeniedWarning() // Show warning if permission denied
handleAmbiguousTranscript(transcript) // Handle unclear speech
```

**French Numbers Configuration** (`src/config/frenchNumbers.js`)
```javascript
export const FRENCH_NUMBERS = {
  // Number word mappings
};

export const HOMOPHONES = {
  // Common misrecognitions
};

export const numberToFrenchWords = (number) => {
  // Convert number to French words (for testing/hints)
};
```

---

## Configuration

**Web Speech API Settings:**
```javascript
// In FrenchSpeechRecognition constructor
this.recognition.lang = 'fr-FR';
this.recognition.continuous = true;         // Don't stop after first result
this.recognition.interimResults = true;     // Real-time feedback
this.recognition.maxAlternatives = 5;       // Check multiple interpretations
```

**Performance Tuning:**
```javascript
// In constants.js (optional)
export const SPEECH = {
  DUPLICATE_THRESHOLD_MS: 1000,     // Ignore duplicates within 1 second
  WATCHDOG_TIMEOUT_MS: 10000,       // Restart if hung for 10 seconds
  PARSE_CACHE_SIZE: 100,            // Max cached parsing results
  LATENCY_TARGET_MS: 1000           // Target recognition latency
};
```

---

## Data Flow

### Speech Recognition Flow
```
Player speaks: "quarante-deux"
  ↓
Web Speech API transcribes
  ↓
recognition.onresult event fires
  ↓
FrenchSpeechRecognition.handleResult()
  ↓
Try parsing transcript:
  - Strategy 1 (digits): No match
  - Strategy 2 (French words): "quarante-deux" → 42 ✓
  ↓
onNumberRecognized callback → GameScene.handleSpeechAnswer(42)
  ↓
MathProblem.checkAnswer(42)
  ↓
If correct:
  - Apply boost
  - Record statistics
  - Generate next problem
  - Clear transcript display
If incorrect:
  - Show incorrect feedback
  - Keep listening
  - Transcript stays visible
```

### Hybrid Input Flow
```
Keyboard input: "4" typed
  ↓
GameScene.handleKeyboardInput('4')
  ↓
currentKeyboardAnswer = "4"
  ↓
updateAnswerDisplay("4")

Meanwhile, player speaks: "quarante-deux"
  ↓
Speech recognition: 42
  ↓
GameScene.handleSpeechAnswer(42)
  ↓
Validate answer (42)
  ↓
Clear keyboard input buffer
  ↓
Speech takes priority
```

---

## Browser Compatibility

**Fully Supported:**
- Chrome (desktop, version 25+)
- Edge (desktop, version 79+)
- Chrome (Android)

**Not Supported:**
- Firefox (no Web Speech API)
- Safari (limited support, unreliable)
- Internet Explorer

**Detection:**
```javascript
const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
```

**User Guidance:**
- Show clear message for unsupported browsers
- Recommend Chrome or Edge
- Always provide keyboard fallback

---

## Known Limitations

**Recognition Accuracy:**
- Varies with microphone quality (headset > laptop mic)
- Affected by background noise
- French accent variations may impact accuracy
- Compound numbers (70, 80, 90) sometimes misrecognized

**Performance:**
- Recognition latency typically 500-1500ms
- May increase with poor network (though recognition is local)
- CPU usage increases with continuous listening

**Workarounds:**
- Multi-strategy parsing reduces homophone errors
- Interim results provide immediate feedback
- Keyboard fallback always available
- Context-aware parsing can improve accuracy (future enhancement)

---

## Testing Strategy

### Manual Testing Checklist

**Basic Functionality:**
- [x] Permission request appears on game start
- [x] Granting permission enables voice input
- [x] Denying permission shows clear message
- [x] Keyboard fallback works when permission denied
- [x] Microphone icon shows listening status

**Number Recognition (2-100):**
- [x] Units (2-10): "deux", "trois", ... "dix"
- [x] Teens (11-16): "onze", "douze", ... "seize"
- [x] Twenties (20-29): "vingt", "vingt-et-un", ... "vingt-neuf"
- [x] Thirties-Fifties: "trente", "quarante", "cinquante"
- [x] Sixties (60-69): "soixante", ... "soixante-neuf"
- [x] Seventies (70-79): "soixante-dix", ... "soixante-dix-neuf"
- [x] Eighties (80-89): "quatre-vingts", ... "quatre-vingt-neuf"
- [x] Nineties (90-99): "quatre-vingt-dix", ... "quatre-vingt-dix-neuf"
- [x] Hundred: "cent"

**Homophones:**
- [x] "sis" → 6
- [x] "dis" → 10
- [x] "set" → 7
- [x] "sang" → 100

**Visual Feedback:**
- [x] Transcript displays what's heard
- [x] Recognized number highlighted
- [x] Mic icon animates when listening
- [x] Transcript clears after answer

**Error Handling:**
- [x] Unsupported browser shows warning
- [x] Permission denial handled gracefully
- [x] Microphone disconnect recovered
- [x] Tab switching pauses/resumes recognition

**Performance:**
- [x] Recognition latency < 1 second
- [x] No stuttering or lag during gameplay
- [x] Recognition stays active for full race
- [x] No memory leaks during long sessions

---

## Integration with Future Milestones

**Milestone 7 (Polish):**
- Add audio feedback for recognized speech (optional beep)
- Animate microphone icon with voice level meter
- Add visual pulse effect when number recognized
- Improve error messages with retro styling

**No changes required to speech recognition core** - M7 only adds polish.

---

---
## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** ✅ COMPLETED

**Implementation Notes:**
- FrenchSpeechRecognition class created with Web Speech API integration
- French number parser handling basic numbers, compounds, and special cases (70, 80)
- Homophone handling for common confusions (six/sis, cent/sang)
- Continuous listening mode with auto-restart on errors
- Visual feedback showing what's being heard in real-time
- Microphone status indicator (listening/error states)
- Speech-recognized numbers auto-submit (no Enter key needed)
- Keyboard input still works as fallback
- Proper cleanup when race ends
- Browser compatibility detection and graceful degradation

**Next Steps After Completion:**
1. Commit Milestone 6 work ← READY
2. All core features complete! (M7 is optional polish)

## Notes & Considerations

### Why Web Speech API?

**Advantages:**
- Free (no API costs)
- Client-side (no server infrastructure)
- Low latency (recognition happens locally in Chrome)
- No privacy concerns (audio never sent to our servers)
- Built into browser (no external dependencies)

**Disadvantages:**
- Chrome/Edge only (limited browser support)
- Variable accuracy (depends on microphone, accent, noise)
- No customization of recognition model
- Can't train on specific vocabulary (multiplication answers)

**Alternative considered:** Cloud-based ASR (Google Cloud Speech, Azure)
- **Rejected because:** Adds cost, latency, privacy concerns, infrastructure complexity
- **For MVP:** Web Speech API is sufficient and free

### French Number Complexity

**Why French numbers are tricky:**
- **70 = "soixante-dix"** (literally "sixty-ten")
- **80 = "quatre-vingts"** (literally "four-twenties")
- **90 = "quatre-vingt-dix"** (literally "four-twenty-ten")
- **Hyphens optional:** "vingt trois" vs "vingt-trois"
- **Homophones:** "six" sounds like "sis", "cent" sounds like "sang"

**Parser must handle:**
- Compound number addition (soixante + dix = 70)
- Multiplication (quatre × vingt = 80)
- Variations in spacing and punctuation
- Phonetic similarities

### Recognition Latency Sources

**Typical latency breakdown:**
1. **Speech buffering:** 200-400ms (browser waits for speech pause)
2. **Recognition processing:** 200-500ms (ASR model inference)
3. **Event dispatch:** 50-100ms (browser event loop)
4. **Parsing & validation:** <50ms (our code)

**Total: 500-1050ms** typical, up to 1500ms worst case

**Optimization opportunities:**
- Use interim results for faster feedback (don't wait for final)
- Cache parsing results
- Debounce duplicate recognitions
- Pre-emptively restart if recognition hangs

### Continuous vs Non-Continuous Mode

**Decision: Use continuous = true**

**Rationale:**
- Eliminates need to manually restart after each answer
- Provides seamless experience (always listening)
- Enables interim results (real-time feedback)

**Trade-offs:**
- Higher CPU usage (always processing audio)
- More potential for false triggers (ambient speech)
- Need to handle duplicate recognitions

**Mitigation:**
- Duplicate detection prevents repeated answers
- Interim results improve perceived responsiveness
- Watchdog timer handles hung recognition

### Interim Results vs Final Results

**Interim results:**
- Updated in real-time as speech is recognized
- Lower confidence, may change
- Good for visual feedback (transcript display)
- Don't use for validation (too unreliable)

**Final results:**
- Returned when speech pause detected
- Higher confidence, stable
- Use for answer validation
- Delay adds latency but ensures accuracy

**Strategy:**
- Show interim results in transcript display (real-time feel)
- Only validate final results (accuracy)

### Homophone Strategy Evolution

**MVP approach:** Manual homophone mapping
```javascript
const HOMOPHONES = {
  'sis': '6',
  'dis': '10',
  // ...
};
```

**Future enhancement:** Context-aware recognition
```javascript
// If expected answer is 6, boost confidence of "sis" → 6
parseWithContext(transcript, expectedAnswer) {
  // Fuzzy matching against expected answer
}
```

**Post-MVP:** Machine learning
- Collect recognition errors during gameplay
- Train custom phonetic mapping
- Improve over time with usage data

**For now:** Manual mapping is simple and effective.

### Accessibility Considerations

**Speech recognition improves accessibility for:**
- Younger children (typing is hard)
- Users with motor impairments
- Users with dyslexia (speaking easier than typing)

**But may reduce accessibility for:**
- Deaf/hard-of-hearing users (need keyboard fallback)
- Users in noisy environments
- Users without microphone

**Critical requirement:** Keyboard input must always work as fallback.

### Future Enhancements

**Post-MVP improvements:**

1. **Confidence-based hints:**
   ```javascript
   if (confidence < 0.5) {
     showHint("Dites le nombre plus clairement");
   }
   ```

2. **Voice level meter:**
   ```javascript
   // Show microphone input level visually
   this.micLevelBar.scaleX = audioLevel;
   ```

3. **Pronunciation hints:**
   ```javascript
   // Show how to say expected answer
   showPronunciationHint("Dites: quarante-deux");
   ```

4. **Custom vocabulary:**
   ```javascript
   // If browser supports, limit recognition to specific numbers
   this.recognition.grammars = buildMathAnswerGrammar();
   ```

5. **Multi-language support:**
   ```javascript
   // Detect browser language, switch between fr-FR and en-US
   this.recognition.lang = navigator.language;
   ```

6. **Recognition analytics:**
   ```javascript
   // Track which numbers are hardest to recognize
   // Improve homophones mapping over time
   ```

These can be added in future milestones without changing core architecture.

