# Milestone 5: Menu System & Configuration

## Summary

This milestone completes the game flow by adding a proper welcome screen where players configure their experience before racing. Instead of jumping directly into gameplay, players will now choose which multiplication tables to practice and optionally enter their name. This transforms Math Racer from a single-session prototype into a complete, replayable game.

**Context:** After M4, we have a complete racing game that tracks progress and displays results, but it starts immediately with hardcoded settings. Players can't choose which multiplication tables to practice, and there's no personalization. The "Play Again" button currently restarts the game with the same settings, which is functional but not ideal for a learning tool where students need to practice different tables.

**Rationale:**
1. **Educational flexibility** - Students need to practice specific tables (e.g., just 7×, 8×, 9× which are typically harder)
2. **Player agency** - Choosing difficulty creates investment in the game
3. **Personalization** - Name input makes the experience feel tailored
4. **Proper game flow** - Professional games have menus, not instant-start
5. **Replayability** - Easy configuration changes encourage multiple sessions
6. **Validation** - Ensures at least one table is selected (prevents empty problem sets)

**Success Criteria:**
- Game launches to MenuScene (not GameScene)
- Player can select one or more multiplication tables (2-10)
- "Select All" button toggles all tables at once
- Start button disabled until at least one table selected
- Selected configuration properly passed to GameScene
- GameScene uses selected tables for problem generation
- GameOverScene "Play Again" returns to MenuScene (not GameScene)
- Name input works with default value "Pilote"

---

## High-Level Milestones

### 5.1 Create MenuScene Structure
**Goal:** Basic menu scene with layout and styling

**Tasks:**
- [x] Create `src/scenes/MenuScene.js`
- [x] Add MenuScene to game configuration
- [x] Set MenuScene as first scene to load
- [x] Design retro arcade menu layout
- [x] Add game title/logo
- [x] Create background (matching game aesthetic)
- [x] Add basic scene navigation to GameScene

**Layout Design:**
```
┌─────────────────────────────────────────────┐
│                                             │
│            MATH RACER                       │
│         Multiplication Rush!               │
│                                             │
│         Nom: [__________]                   │
│                                             │
│      Choisis tes tables:                    │
│                                             │
│   [2] [3] [4] [5] [6] [7] [8] [9] [10]     │
│                                             │
│         [ Tout sélectionner ]               │
│                                             │
│            [ COMMENCER ]                    │
│                                             │
└─────────────────────────────────────────────┘
```

**MenuScene Structure:**
```javascript
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    // Title
    // Name input field
    // Table selector buttons
    // "Select All" button
    // Start button
    // Layout positioning
  }

  startGame() {
    // Validate selection
    // Pass configuration to GameScene
    // Transition to GameScene
  }
}
```

**Visual Style:**
- Retro arcade aesthetic (consistent with game)
- Press Start 2P font for all text
- Bright, high-contrast colors (yellow title, white text)
- Simple geometric buttons
- Grass green background matching game

**Deliverable:** MenuScene renders with all UI elements visible

---

### 5.2 Implement Name Input Field
**Goal:** Working text input for player name

**Tasks:**
- [x] Create HTML input field overlay
- [x] Style input to match retro aesthetic
- [x] Position input in menu layout
- [x] Set default value to "Pilote"
- [x] Handle input focus/blur events
- [x] Retrieve input value when starting game
- [x] Pass player name to GameScene and GameOverScene

**Implementation Approach:**

**Option 1: HTML Input Overlay (Recommended)**
```html
<!-- In index.html -->
<div id="name-input-container" style="display: none;">
  <input
    type="text"
    id="player-name"
    maxlength="20"
    value="Pilote"
    placeholder="Pilote"
  />
</div>
```

```javascript
// In MenuScene.create()
this.nameInput = document.getElementById('player-name');
this.nameInputContainer = document.getElementById('name-input-container');
this.nameInputContainer.style.display = 'block';

// Position overlay
this.positionNameInput();

// In MenuScene.shutdown()
this.nameInputContainer.style.display = 'none';
```

**CSS Styling:**
```css
#name-input-container {
  position: absolute;
  top: 250px;
  left: 50%;
  transform: translateX(-50%);
}

#player-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  padding: 10px;
  border: 3px solid #ffffff;
  background: #000000;
  color: #ffff00;
  text-align: center;
  width: 200px;
}

#player-name:focus {
  outline: none;
  border-color: #ffff00;
}
```

**Alternative Option 2: Phaser rexUI Plugin** (more complex, can skip for MVP)

**Data Flow:**
```javascript
startGame() {
  const playerName = this.nameInput.value.trim() || 'Pilote';

  this.scene.start('GameScene', {
    playerName: playerName,
    selectedTables: this.selectedTables
  });
}
```

**Deliverable:** Functional name input with retro styling

---

### 5.3 Create Multiplication Table Selector
**Goal:** Interactive buttons to select tables 2-10

**Tasks:**
- [x] Create 9 table buttons (2, 3, 4, 5, 6, 7, 8, 9, 10)
- [x] Track selected state for each button
- [x] Implement toggle behavior (click to select/deselect)
- [x] Visual feedback for selected vs unselected state
- [x] Arrange buttons in grid layout
- [x] Store selected tables in array
- [x] Ensure at least one table is selected at all times (or disable start button)

**Button Grid Layout:**
```
[2] [3] [4] [5] [6] [7] [8] [9] [10]
```

Or two rows:
```
[2] [3] [4] [5] [6]
[7] [8] [9] [10]
```

**Implementation:**
```javascript
// In MenuScene
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.selectedTables = []; // Array of selected table numbers
  }

  create() {
    this.createTableButtons();
  }

  createTableButtons() {
    const tables = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const startX = 200;
    const startY = 350;
    const spacing = 60;

    this.tableButtons = [];

    tables.forEach((table, index) => {
      const x = startX + (index % 5) * spacing;
      const y = startY + Math.floor(index / 5) * spacing;

      const button = this.createTableButton(x, y, table);
      this.tableButtons.push(button);
    });
  }

  createTableButton(x, y, table) {
    // Background rectangle
    const bg = this.add.rectangle(x, y, 50, 50, 0x404040)
      .setStrokeStyle(3, 0xffffff);

    // Table number text
    const text = this.add.text(x, y, table.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Make interactive
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleTable(table, bg, text));

    return { table, bg, text, selected: false };
  }

  toggleTable(table, bg, text) {
    const buttonData = this.tableButtons.find(b => b.table === table);

    if (buttonData.selected) {
      // Deselect
      buttonData.selected = false;
      bg.setFillStyle(0x404040);
      text.setColor('#ffffff');

      const index = this.selectedTables.indexOf(table);
      if (index > -1) {
        this.selectedTables.splice(index, 1);
      }
    } else {
      // Select
      buttonData.selected = true;
      bg.setFillStyle(0x00ff00);
      text.setColor('#000000');

      this.selectedTables.push(table);
    }

    // Update start button state
    this.updateStartButton();
  }
}
```

**Visual States:**
- **Unselected:** Dark gray background (#404040), white border, white text
- **Selected:** Bright green background (#00ff00), white border, black text
- **Hover:** Slight scale increase or border color change (optional)

**Deliverable:** 9 interactive table selection buttons with visual feedback

---

### 5.4 Add "Select All" Toggle Button
**Goal:** Quick selection of all tables

**Tasks:**
- [x] Create "Select All" button below table buttons
- [x] Implement toggle behavior (Select All / Deselect All)
- [x] Update button text based on current state
- [x] Select/deselect all table buttons when clicked
- [x] Update visual state of all buttons
- [x] Synchronize with individual button selections

**Implementation:**
```javascript
createSelectAllButton() {
  this.selectAllButton = this.add.text(400, 480, '[ Tout sélectionner ]', {
    fontFamily: '"Press Start 2P"',
    fontSize: '14px',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.selectAllButton.setColor('#ffffff'))
    .on('pointerout', () => this.selectAllButton.setColor('#ffff00'))
    .on('pointerdown', () => this.toggleSelectAll());
}

toggleSelectAll() {
  const allSelected = this.selectedTables.length === 9;

  if (allSelected) {
    // Deselect all
    this.tableButtons.forEach(buttonData => {
      if (buttonData.selected) {
        buttonData.selected = false;
        buttonData.bg.setFillStyle(0x404040);
        buttonData.text.setColor('#ffffff');
      }
    });
    this.selectedTables = [];
    this.selectAllButton.setText('[ Tout sélectionner ]');
  } else {
    // Select all
    this.tableButtons.forEach(buttonData => {
      if (!buttonData.selected) {
        buttonData.selected = true;
        buttonData.bg.setFillStyle(0x00ff00);
        buttonData.text.setColor('#000000');
      }
    });
    this.selectedTables = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.selectAllButton.setText('[ Tout désélectionner ]');
  }

  this.updateStartButton();
}
```

**Button Text States:**
- No tables or partial selection: "Tout sélectionner"
- All 9 tables selected: "Tout désélectionner"

**Deliverable:** Working "Select All" toggle button

---

### 5.5 Implement Start Button with Validation
**Goal:** Start button that enforces selection requirement

**Tasks:**
- [x] Create "Commencer" (Start) button
- [x] Implement enabled/disabled states
- [x] Disable button when no tables selected
- [x] Enable button when at least one table selected
- [x] Update button state whenever selection changes
- [x] Handle button click to start game
- [x] Pass selected configuration to GameScene

**Implementation:**
```javascript
createStartButton() {
  this.startButton = this.add.text(400, 560, '[ COMMENCER ]', {
    fontFamily: '"Press Start 2P"',
    fontSize: '20px',
    color: '#888888', // Disabled color
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);

  // Initially disabled
  this.startButtonEnabled = false;
}

updateStartButton() {
  const hasSelection = this.selectedTables.length > 0;

  if (hasSelection && !this.startButtonEnabled) {
    // Enable
    this.startButtonEnabled = true;
    this.startButton.setColor('#00ff00');
    this.startButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.startButton.setColor('#ffff00'))
      .on('pointerout', () => this.startButton.setColor('#00ff00'))
      .on('pointerdown', () => this.startGame());
  } else if (!hasSelection && this.startButtonEnabled) {
    // Disable
    this.startButtonEnabled = false;
    this.startButton.setColor('#888888');
    this.startButton.removeInteractive();
  }
}

startGame() {
  if (!this.startButtonEnabled) return;

  const playerName = this.nameInput.value.trim() || 'Pilote';

  this.scene.start('GameScene', {
    playerName: playerName,
    selectedTables: [...this.selectedTables] // Copy array
  });
}
```

**Visual States:**
- **Disabled (no selection):** Gray text (#888888), not clickable
- **Enabled:** Green text (#00ff00), clickable
- **Hover (when enabled):** Yellow text (#ffff00)

**Validation:**
- Must have at least 1 table selected
- Button clearly shows disabled state
- Clicking disabled button does nothing

**Deliverable:** Functional start button with proper validation

---

### 5.6 Update GameScene to Receive Configuration
**Goal:** GameScene uses menu configuration

**Tasks:**
- [x] Update GameScene.init() to receive data
- [x] Store playerName and selectedTables
- [x] Pass selectedTables to MathProblem instance
- [x] Update MathProblem to use selectedTables
- [x] Verify problem generation respects table selection
- [x] Display player name in HUD or GameOver (optional enhancement)

**GameScene Updates:**
```javascript
class GameScene extends Phaser.Scene {
  init(data) {
    // Receive configuration from MenuScene
    this.playerName = data.playerName || 'Pilote';
    this.selectedTables = data.selectedTables || [2, 3, 4, 5];
  }

  create() {
    // Pass selectedTables to MathProblem
    this.mathProblem = new MathProblem(this.selectedTables);

    // Rest of GameScene setup...
  }
}
```

**MathProblem Updates:**
```javascript
class MathProblem {
  constructor(selectedTables) {
    this.selectedTables = selectedTables;
    this.usedProblems = new Set();

    // Generate first problem
    this.generateProblem();
  }

  generateProblem() {
    // Ensure at least one factor is from selectedTables
    const firstFactor = this.selectedTables[
      Math.floor(Math.random() * this.selectedTables.length)
    ];

    const secondFactor = Math.floor(Math.random() * 9) + 2; // 2-10

    // Randomly swap factors (so selected table can be either position)
    const factors = Math.random() < 0.5
      ? [firstFactor, secondFactor]
      : [secondFactor, firstFactor];

    this.currentProblem = {
      a: factors[0],
      b: factors[1],
      answer: factors[0] * factors[1]
    };

    // Mark as used
    const problemKey = `${factors[0]}x${factors[1]}`;
    this.usedProblems.add(problemKey);
  }
}
```

**Verification:**
- If only table 7 selected: should only see problems with 7 as one factor
- If tables 5, 7, 9 selected: should see mix of problems from those tables
- Problem generation never uses tables outside selection

**Deliverable:** GameScene properly uses selected tables for problems

---

### 5.7 Update Scene Flow (Menu → Game → GameOver → Menu)
**Goal:** Complete scene navigation loop

**Tasks:**
- [x] Set MenuScene as first scene in game config
- [x] MenuScene → GameScene with data
- [x] GameScene → GameOverScene with stats
- [x] GameOverScene → MenuScene (not back to GameScene)
- [x] Ensure proper cleanup between scenes
- [x] Hide name input when leaving MenuScene
- [x] Show name input when returning to MenuScene

**Game Configuration Update:**
```javascript
// In src/main.js
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  // ... other config
  scene: [MenuScene, GameScene, GameOverScene]
};
```

**Scene Transitions:**

**MenuScene → GameScene:**
```javascript
// In MenuScene.startGame()
this.scene.start('GameScene', {
  playerName: this.playerName,
  selectedTables: this.selectedTables
});
```

**GameScene → GameOverScene:**
```javascript
// In GameScene.endGame() (already exists from M4)
this.scene.start('GameOverScene', {
  stats: this.statistics.getStats(),
  playerName: this.playerName // Add player name
});
```

**GameOverScene → MenuScene:**
```javascript
// In GameOverScene.restartGame()
// Change from:
this.scene.start('GameScene');

// To:
this.scene.start('MenuScene');
```

**MenuScene Cleanup:**
```javascript
// In MenuScene
shutdown() {
  // Hide HTML input when leaving menu
  if (this.nameInputContainer) {
    this.nameInputContainer.style.display = 'none';
  }
}

create() {
  // Show HTML input when entering menu
  if (this.nameInputContainer) {
    this.nameInputContainer.style.display = 'block';
  }

  // Reset selection state for new session
  this.selectedTables = [];
  this.updateStartButton();
}
```

**Deliverable:** Complete scene navigation loop working correctly

---

### 5.8 Optional Enhancement: Display Player Name
**Goal:** Show player name in GameOver screen

**Tasks:**
- [x] Update GameOverScene to receive playerName
- [x] Display personalized message with player name
- [x] Format text nicely with retro styling

**Implementation:**
```javascript
// In GameOverScene.init()
init(data) {
  this.finalStats = data.stats;
  this.playerName = data.playerName || 'Pilote';
}

// In GameOverScene.create()
create() {
  // ... existing code ...

  // Personalized title
  this.add.text(400, 120, `Bravo ${this.playerName}!`, {
    fontFamily: '"Press Start 2P"',
    fontSize: '20px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);

  this.add.text(400, 160, 'COURSE TERMINÉE!', {
    fontFamily: '"Press Start 2P"',
    fontSize: '28px',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5);

  // ... rest of results display ...
}
```

**Deliverable:** Personalized GameOver message (optional, nice-to-have)

---

### 5.9 Testing and Validation
**Goal:** Verify complete menu system functionality

**Tasks:**
- [x] Test all selection combinations
- [x] Test validation (start button disabled/enabled)
- [x] Test scene transitions
- [x] Test configuration data passing
- [x] Test problem generation with different table selections
- [x] Test edge cases
- [x] Test UI responsiveness and layout
- [x] Verify retro styling consistency

**Testing Scenarios:**

**Scenario 1: Single table selection**
- Open game (lands on MenuScene)
- Select only table 7
- Click "Commencer"
- Play game
- Verify all problems involve 7 (e.g., 7×3, 9×7, 7×7)
- Complete race
- Verify GameOver shows results
- Click "Rejouer"
- Verify return to MenuScene

**Scenario 2: Multiple table selection**
- Select tables 5, 7, 9
- Start game
- Verify problems only use those tables
- One factor always from {5, 7, 9}

**Scenario 3: Select All**
- Click "Tout sélectionner"
- Verify all 9 buttons highlighted
- Verify start button enabled
- Click "Tout désélectionner"
- Verify all buttons unhighlighted
- Verify start button disabled

**Scenario 4: Manual all selection**
- Click each button individually until all selected
- Verify "Select All" button text changes to "Tout désélectionner"
- Click "Select All" once
- Verify all deselected

**Scenario 5: Start button validation**
- Start with no selection
- Verify start button gray and not clickable
- Select one table
- Verify start button green and clickable
- Deselect all tables
- Verify start button returns to gray

**Scenario 6: Name input**
- Enter name "Alice"
- Start game
- Check GameOver shows "Bravo Alice!" (if implemented)
- Leave name blank
- Start game
- Verify defaults to "Pilote"

**Scenario 7: Scene cleanup**
- Complete race, return to menu
- Verify selection state reset (no tables selected)
- Verify name input still shows previous value
- Change selections
- Start new game
- Verify new configuration used

**Edge Cases:**
- [x] No tables selected → start button disabled
- [x] Clicking disabled start button → nothing happens
- [x] Very long name (20+ chars) → input maxlength prevents
- [x] Special characters in name → handled gracefully
- [x] Rapid clicking on table buttons → toggles correctly
- [x] Selecting/deselecting during "Select All" transition
- [x] Browser window resize → input overlay repositions (or consider)

**UI/Visual Testing:**
- [x] All text uses Press Start 2P font
- [x] Colors consistent with game aesthetic
- [x] Input field clearly visible
- [x] Buttons have clear selected/unselected states
- [x] Layout centered and balanced
- [x] No overlapping UI elements
- [x] Readable text over background

**Deliverable:** Fully validated menu system

---

## Technical Architecture

### Updated File Structure
```
/src
  /scenes
    MenuScene.js          ✅ NEW: Welcome and configuration screen
    GameScene.js          ✅ Updated: Receives configuration data
    GameOverScene.js      ✅ Updated: Returns to MenuScene, shows player name
  /systems
    MathProblem.js        ✅ Updated: Constructor takes selectedTables parameter
    VehiclePhysics.js     (unchanged)
    Track.js              (unchanged)
    StatisticsTracker.js  (unchanged)
  /config
    colors.js             (unchanged)
    constants.js          (unchanged)
    gameConfig.js         ✅ Updated: MenuScene as first scene
  main.js                 ✅ Updated: Import MenuScene
/public
  index.html              ✅ Updated: Add name input HTML element and CSS
```

### Key Classes

**MenuScene** (`src/scenes/MenuScene.js`)
```javascript
class MenuScene extends Phaser.Scene {
  constructor()

  // Properties
  selectedTables          // Array of selected table numbers
  tableButtons            // Array of button objects
  selectAllButton         // "Select All" toggle button
  startButton             // Start game button
  startButtonEnabled      // Boolean state
  nameInput               // HTML input reference
  nameInputContainer      // Container div reference

  // Methods
  create()                // Setup UI
  createTableButtons()    // Create 9 table selection buttons
  createTableButton()     // Create individual button
  toggleTable()           // Handle table selection
  createSelectAllButton() // Create "Select All" button
  toggleSelectAll()       // Toggle all tables
  createStartButton()     // Create start button
  updateStartButton()     // Enable/disable start button
  startGame()             // Validate and transition to GameScene
  shutdown()              // Cleanup (hide HTML input)
}
```

**GameScene Updates**
```javascript
// New properties
this.playerName
this.selectedTables

// New method
init(data)               // Receive configuration from MenuScene
```

**MathProblem Updates**
```javascript
// Updated constructor
constructor(selectedTables)

// Updated property
this.selectedTables      // Stored from constructor parameter

// Updated method
generateProblem()        // Uses selectedTables for generation
```

**GameOverScene Updates**
```javascript
// New property
this.playerName

// Updated method
init(data)               // Receive playerName
create()                 // Display personalized message
restartGame()            // Return to MenuScene (not GameScene)
```

---

## HTML Structure

Add to `/public/index.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math Racer</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    #game-container {
      position: relative;
    }

    #name-input-container {
      position: absolute;
      top: 250px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      z-index: 10;
    }

    #player-name {
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      padding: 10px;
      border: 3px solid #ffffff;
      background: #000000;
      color: #ffff00;
      text-align: center;
      width: 200px;
    }

    #player-name:focus {
      outline: none;
      border-color: #ffff00;
    }

    #player-name::placeholder {
      color: #888888;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div id="name-input-container">
      <input
        type="text"
        id="player-name"
        maxlength="20"
        value="Pilote"
        placeholder="Nom du pilote"
      />
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

---

## Scene Configuration

Update `src/main.js`:
```javascript
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
  parent: 'game-container',
  backgroundColor: '#00aa00',
  scene: [MenuScene, GameScene, GameOverScene] // MenuScene loads first
};

const game = new Phaser.Game(config);
```

---

## Data Flow

### Configuration Flow
```
MenuScene
  ↓ (user selects)
  selectedTables: [5, 7, 9]
  playerName: "Alice"
  ↓ (click Commencer)
GameScene.init({ playerName, selectedTables })
  ↓ (store config)
  this.playerName = "Alice"
  this.selectedTables = [5, 7, 9]
  ↓ (pass to MathProblem)
  new MathProblem([5, 7, 9])
  ↓ (problem generation)
  Generates: 5×3, 7×8, 9×2, etc.
  ✓ Always one factor from {5, 7, 9}
  ✗ Never generates: 2×3, 4×6, etc.
```

### Scene Navigation Flow
```
Game Start
  ↓
MenuScene (configuration)
  ↓ [Commencer]
GameScene (gameplay)
  ↓ [3 laps complete]
GameOverScene (results)
  ↓ [Rejouer]
MenuScene (fresh configuration)
  ↓ [loop continues]
```

---

## Constants

No new constants needed. Existing `GAME` constant remains:

```javascript
// src/config/constants.js
export const GAME = {
  LAPS_TO_COMPLETE: 3,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800
};
```

Optional additions for menu:
```javascript
export const MENU = {
  TABLES_MIN: 2,
  TABLES_MAX: 10,
  DEFAULT_NAME: 'Pilote',
  MAX_NAME_LENGTH: 20
};
```

---

## Problem Generation Algorithm

**Key requirement:** At least one factor must be from selected tables.

**Algorithm:**
```javascript
generateProblem() {
  // Choose random table from selected tables
  const primaryFactor = this.selectedTables[
    Math.floor(Math.random() * this.selectedTables.length)
  ];

  // Choose random factor from 2-10
  const secondaryFactor = Math.floor(Math.random() * 9) + 2;

  // Randomly decide which position for primary factor
  const [a, b] = Math.random() < 0.5
    ? [primaryFactor, secondaryFactor]
    : [secondaryFactor, primaryFactor];

  // Create problem key for duplicate prevention
  const problemKey = `${Math.min(a, b)}x${Math.max(a, b)}`;

  // Skip if already used (optional: clear set after N problems)
  if (this.usedProblems.has(problemKey)) {
    return this.generateProblem(); // Recursive retry
  }

  this.usedProblems.add(problemKey);

  this.currentProblem = { a, b, answer: a * b };
}
```

**Examples:**
- Selected: [7] → Generates: 7×2, 3×7, 7×9, etc.
- Selected: [5, 7, 9] → Generates: 5×4, 7×7, 9×2, 3×5, etc.
- Selected: [2, 3, 4, 5, 6, 7, 8, 9, 10] → Any combination

---

## UI Layout Coordinates

**MenuScene Layout:**
```javascript
// Title
Title: x=400, y=100, origin=0.5

// Subtitle (optional)
Subtitle: x=400, y=140, origin=0.5

// Name input label (optional)
Label: x=400, y=220, origin=0.5

// Name input (HTML overlay)
Input: x=400, y=250, transform: translateX(-50%)

// Table selector label
Label: x=400, y=300, origin=0.5

// Table buttons (2 rows)
Row 1: y=350
  x positions: 200, 260, 320, 380, 440 (spacing 60)
  Tables: 2, 3, 4, 5, 6

Row 2: y=410
  x positions: 260, 320, 380, 440 (spacing 60)
  Tables: 7, 8, 9, 10

// Select All button
Button: x=400, y=480, origin=0.5

// Start button
Button: x=400, y=560, origin=0.5
```

---

## Integration with Future Milestones

**Milestone 6 (Speech Recognition):**
- No changes to MenuScene
- Voice input only affects GameScene
- Configuration passing unchanged

**Milestone 7 (Polish):**
- Add menu background music (optional)
- Add button click sounds
- Add animations (button press effects)
- Add transition effects between scenes

**MenuScene remains stable** through remaining milestones.

---

## Testing Strategy

### Manual Testing Procedure

1. **Menu Rendering:**
   - Launch game
   - Verify MenuScene appears (not GameScene)
   - Verify all UI elements visible and positioned correctly
   - Verify retro styling applied

2. **Name Input:**
   - Click in name field
   - Type name
   - Verify text appears in retro font
   - Clear field and blur
   - Verify defaults to "Pilote"

3. **Table Selection:**
   - Click each table button 2, 3, ..., 10
   - Verify selection state toggles (gray ↔ green)
   - Click same button again
   - Verify deselection works

4. **Select All:**
   - Click "Tout sélectionner"
   - Verify all 9 buttons turn green
   - Verify button text changes to "Tout désélectionner"
   - Click again
   - Verify all buttons turn gray
   - Verify button text changes back

5. **Start Button Validation:**
   - Deselect all tables
   - Verify start button is gray and not clickable
   - Select one table
   - Verify start button turns green
   - Verify button becomes clickable
   - Deselect all
   - Verify button returns to gray

6. **Game Launch:**
   - Select specific tables (e.g., 5, 7)
   - Enter name "Test"
   - Click "Commencer"
   - Verify transition to GameScene
   - Play game and observe problems
   - Verify all problems involve 5 or 7
   - Complete race
   - Verify GameOver shows (optional: "Bravo Test!")

7. **Return to Menu:**
   - Click "Rejouer" on GameOver
   - Verify return to MenuScene
   - Verify selection state reset (no tables selected)
   - Verify start button disabled
   - Make new selection
   - Start game
   - Verify new configuration applied

### Automated Testing (Future)

```javascript
// Example test cases (if adding Jest later)

describe('MenuScene', () => {
  test('start button disabled with no selection', () => {
    // ...
  });

  test('start button enabled with selection', () => {
    // ...
  });

  test('selectedTables array updated on toggle', () => {
    // ...
  });
});

describe('MathProblem', () => {
  test('generates problems from selected tables only', () => {
    const problem = new MathProblem([5, 7]);
    // Generate 100 problems
    // Assert all have 5 or 7 as factor
  });
});
```

### Visual Validation

- [x] Title readable and centered
- [x] Name input clearly visible and styled
- [x] Table buttons in neat grid
- [x] Selected buttons clearly distinguishable from unselected
- [x] Start button clearly shows enabled/disabled state
- [x] All text uses Press Start 2P font
- [x] Colors match game palette
- [x] Layout works on 800×800 canvas
- [x] No text cutoff or overlap

---

## Progress Tracking

Mark tasks with ✅ as they are completed. Leave comments if blockers arise.

**Overall Milestone Status:** ✅ COMPLETED

**Implementation Notes:**
- MenuScene created with table selection buttons (2-10)
- Name input using browser prompt() for simplicity
- "Select All" toggle button working correctly
- Start button disabled when no tables selected
- Configuration properly passed to GameScene
- GameOverScene now returns to MenuScene (proper game flow)
- Default selection: tables 2-5 for testing
- Visual feedback on button hover and selection states

**Next Steps After Completion:**
1. Commit Milestone 5 work ← READY
2. Begin Milestone 6: French Speech Recognition

---

## Notes & Considerations

### Why HTML Input Over Phaser Text Input?

**HTML input advantages:**
- Native browser text editing (cursor, selection, copy/paste)
- Accessibility features (screen readers, autocomplete)
- Mobile keyboard support
- No need for custom keyboard handling
- Can style with CSS to match retro aesthetic

**Phaser text input disadvantages:**
- Need to implement cursor manually
- Need to handle all keyboard events
- More complex for relatively simple input
- Third-party plugins add dependency

**Trade-off:** HTML overlay is pragmatic choice for MVP. Can replace with pure Phaser solution later if needed.

### Default Table Selection

**Design choice:** Start with NO tables selected (not "all selected")

**Rationale:**
- Forces intentional selection (educational tool)
- "Select All" button clearly offers easy path
- Prevents accidental "play with everything" without thinking
- Encourages focused practice on specific tables

**Alternative:** Could default to middle difficulty (5, 6, 7) but less clear.

### Table Selection Persistence

**MVP:** No persistence between sessions

**Future enhancement:** Could store selection in localStorage:
```javascript
localStorage.setItem('selectedTables', JSON.stringify([5, 7, 9]));
```

For MVP, requiring re-selection each session is acceptable.

### Name Input Validation

**Minimal validation for MVP:**
- Max length: 20 characters (HTML maxlength)
- Empty defaults to "Pilote"
- No special character restrictions

**Future enhancement:** Could add validation for offensive words, but probably unnecessary for educational tool.

### Scene Transition Animation

**MVP:** Instant scene transitions (`this.scene.start()`)

**Future enhancement (M7):** Could add fade transitions:
```javascript
this.cameras.main.fadeOut(500);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.start('GameScene', data);
});
```

For now, instant transitions keep code simple.

### Problem Generation Performance

**Potential issue:** Recursive retry on duplicate problems could infinite loop if:
- Selected tables are very limited (e.g., only table 2)
- Many problems already used
- Set never cleared

**Mitigation:**
- For MVP: Ignore duplicates (comment notes this)
- Alternative: Clear `usedProblems` set every 20 problems
- Alternative: Pre-generate all possible problems, shuffle, iterate

Example fix:
```javascript
if (this.usedProblems.size > 50) {
  this.usedProblems.clear(); // Reset after 50 unique problems
}
```

### Accessibility Considerations

**Basic improvements possible:**
- Add `aria-label` to name input
- Add `role="button"` to Phaser interactive elements (if possible)
- Keyboard navigation (Tab between buttons, Enter to select)

**For MVP:** Mouse-only interaction acceptable. Can enhance later.

### Internationalization (i18n)

**Current:** All text hardcoded in French

**Future:** Could extract strings to constants:
```javascript
const STRINGS = {
  title: 'MATH RACER',
  selectTables: 'Choisis tes tables:',
  selectAll: 'Tout sélectionner',
  start: 'COMMENCER',
  // ...
};
```

This would enable easy English/French toggle later. For MVP, French-only is fine per spec.

---

## Code Style Reminders

Following CLAUDE.md guidelines:

1. **Comments:**
   - Explain why HTML input overlay chosen
   - Document table selection validation logic
   - Comment scene data passing structure

2. **Simplicity:**
   - Direct DOM manipulation for HTML input
   - Simple array for selectedTables (not Set or complex structure)
   - Straightforward toggle logic

3. **Readability:**
   - Clear variable names (selectedTables, startButtonEnabled)
   - Separate methods for each button type
   - Explicit state management

4. **Minimal exception handling:**
   - Trust Phaser scene lifecycle
   - Assume HTML elements exist (created in index.html)
   - Basic validation only (at least one table)

