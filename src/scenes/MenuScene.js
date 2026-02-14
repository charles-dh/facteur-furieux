import Phaser from "phaser";
import { COLORS } from "../config/colors.js";
import { AUDIO, EFFECTS } from "../config/audioConfig.js";
import AudioManager from "../systems/AudioManager.js";
import SoundGenerator from "../systems/SoundGenerator.js";
import { loadPlayerName, savePlayerName, loadInputMode, saveInputMode } from "../systems/StorageManager.js";

/**
 * MenuScene - Welcome screen with configuration
 *
 * Allows players to:
 * - Enter their name (optional, defaults to "Pilote")
 * - Select which multiplication tables to practice (2-10)
 * - Start the game with selected configuration
 *
 * Educational design:
 * - Students can focus on specific tables (e.g., harder ones like 7, 8, 9)
 * - Or practice all tables for comprehensive review
 * - Selection validation ensures at least one table chosen
 *
 * M7: Added UI animations and sound effects for enhanced feedback
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  /**
   * Preload audio assets
   * M7: Generate sound effects for menu interactions
   */
  preload() {
    // Menu sounds are generated once by GameScene on first load.
    // On subsequent visits (after a game), they're already in cache.
    // Only generate if cache is empty (i.e., app just started and
    // MenuScene is the first scene — which is the normal flow).
    if (!this.cache.audio.exists(AUDIO.SFX.MENU_CLICK)) {
      const generator = new SoundGenerator();
      const sounds = [
        { key: AUDIO.SFX.MENU_CLICK, buffer: generator.generateMenuClickSound() },
        { key: AUDIO.SFX.MENU_HOVER, buffer: generator.generateMenuHoverSound() },
      ];
      sounds.forEach(({ key, buffer }) => {
        const dataUri = generator.bufferToBase64WAV(buffer);
        this.load.audio(key, dataUri);
      });
    }
  }

  create() {
    // M7: Initialize audio manager
    this.audioManager = new AudioManager(this);

    // Unlock audio context on first user interaction (required by browsers)
    this.input.once('pointerdown', () => {
      if (this.sound.context) {
        this.sound.context.resume();
      }
    });

    // Background (dark green)
    this.add.rectangle(400, 400, 800, 800, 0x004400);

    // Game title
    this.add
      .text(400, 80, "FACTOR FURIOUS", {
        fontFamily: '"Press Start 2P"',
        fontSize: "48px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(400, 140, "Course de Multiplications", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Input mode selection toggle (voice/keyboard)
    this.inputMode = loadInputMode();
    this.createInputModeToggle();

    // Name input section
    this.add
      .text(400, 200, "Nom:", {
        fontFamily: '"Press Start 2P"',
        fontSize: "18px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Name display (simulated input - Phaser doesn't have text input)
    // Load player name from localStorage or use default
    this.playerName = loadPlayerName();
    this.nameText = this.add
      .text(400, 240, this.playerName, {
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(400, 270, "(appuyez sur N pour changer)", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#888888",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Table selection section
    this.add
      .text(400, 330, "Choisis tes tables:", {
        fontFamily: '"Press Start 2P"',
        fontSize: "18px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Keyboard hint
    this.add
      .text(400, 360, "(touches 2-9, 0 pour 10, 1 pour tout)", {
        fontFamily: '"Press Start 2P"',
        fontSize: "8px",
        color: "#888888",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Create table selection buttons
    this.selectedTables = new Set([2, 3, 4, 5]); // Default selection
    this.tableButtons = {};
    this.createTableButtons();

    // "Select All" button
    this.createSelectAllButton();

    // Start button
    this.createStartButton();

    // Leaderboard button
    this.createLeaderboardButton();

    // Setup keyboard input for name editing
    this.setupNameInput();

  }

  /**
   * Create table selection buttons (2-10)
   */
  createTableButtons() {
    const startX = 150;
    const y = 420;  // Moved down to make room for keyboard hint
    const spacing = 70;

    for (let table = 2; table <= 10; table++) {
      const x = startX + (table - 2) * spacing;

      // Button background
      const button = this.add.rectangle(x, y, 60, 60, 0x333333);
      button.setStrokeStyle(3, 0xffffff);
      button.setInteractive({ useHandCursor: true });

      // Button text
      const text = this.add
        .text(x, y, String(table), {
          fontFamily: '"Press Start 2P"',
          fontSize: "24px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      // Store references
      this.tableButtons[table] = { button, text };

      // Update visual state
      this.updateTableButtonState(table);

      // Click handler with sound and animation
      button.on("pointerdown", () => {
        // M7: Play click sound
        this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);

        // M7: Button press animation
        this.tweens.add({
          targets: [button, text],
          scaleX: 0.9,
          scaleY: 0.9,
          duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
          yoyo: true,
          ease: "Quad.easeInOut",
        });

        this.toggleTable(table);
      });

      // Hover effects with sound
      button.on("pointerover", () => {
        // M7: Play hover sound
        this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);

        if (!this.selectedTables.has(table)) {
          button.setFillStyle(0x555555);
        }
      });

      button.on("pointerout", () => {
        this.updateTableButtonState(table);
      });
    }
  }

  /**
   * Toggle table selection
   */
  toggleTable(table) {
    if (this.selectedTables.has(table)) {
      this.selectedTables.delete(table);
    } else {
      this.selectedTables.add(table);
    }

    this.updateTableButtonState(table);
    this.updateStartButton();
  }

  /**
   * Update visual state of table button
   */
  updateTableButtonState(table) {
    const { button, text } = this.tableButtons[table];
    const isSelected = this.selectedTables.has(table);

    if (isSelected) {
      button.setFillStyle(0x00aa00); // Green when selected
      text.setColor("#ffffff");
    } else {
      button.setFillStyle(0x333333); // Gray when not selected
      text.setColor("#888888");
    }
  }

  /**
   * Create "Select All" toggle button
   */
  createSelectAllButton() {
    const y = 510;  // Adjusted spacing

    this.selectAllButton = this.add
      .text(400, y, "[ Tout sélectionner ]", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.selectAllButton.setInteractive({ useHandCursor: true });

    this.selectAllButton.on("pointerdown", () => {
      // M7: Play click sound and animation
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: this.selectAllButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
        yoyo: true,
      });

      this.toggleSelectAll();
    });

    this.selectAllButton.on("pointerover", () => {
      // M7: Play hover sound
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      this.selectAllButton.setColor("#ffffff");
    });

    this.selectAllButton.on("pointerout", () => {
      this.selectAllButton.setColor("#ffff00");
    });
  }

  /**
   * Toggle all tables selection
   */
  toggleSelectAll() {
    const allSelected = this.selectedTables.size === 9; // 2-10 = 9 tables

    if (allSelected) {
      // Deselect all
      this.selectedTables.clear();
    } else {
      // Select all
      for (let table = 2; table <= 10; table++) {
        this.selectedTables.add(table);
      }
    }

    // Update all button visuals
    for (let table = 2; table <= 10; table++) {
      this.updateTableButtonState(table);
    }

    this.updateStartButton();
  }

  /**
   * Create start button
   */
  createStartButton() {
    const y = 600;  // Adjusted spacing

    this.startButton = this.add
      .text(400, y, "[ COMMENCER ]", {
        fontFamily: '"Press Start 2P"',
        fontSize: "24px",
        color: "#00ff00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.startButton.setInteractive({ useHandCursor: true });

    this.startButton.on("pointerdown", () => {
      if (this.selectedTables.size > 0) {
        // M7: Play click sound and animation
        this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
        this.tweens.add({
          targets: this.startButton,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
          yoyo: true,
        });
      }

      this.startGame();
    });

    this.startButton.on("pointerover", () => {
      if (this.selectedTables.size > 0) {
        // M7: Play hover sound
        this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
        this.startButton.setColor("#ffff00");
      }
    });

    this.startButton.on("pointerout", () => {
      this.updateStartButton();
    });

    // Initial state
    this.updateStartButton();
  }

  /**
   * Update start button based on selection
   */
  updateStartButton() {
    if (this.selectedTables.size > 0) {
      this.startButton.setColor("#00ff00");
      this.startButton.setAlpha(1);
    } else {
      this.startButton.setColor("#666666");
      this.startButton.setAlpha(0.5);
    }
  }

  /**
   * Setup keyboard input for name editing and table selection
   */
  setupNameInput() {
    // Press N to edit name
    this.input.keyboard.on("keydown-N", () => {
      this.editName();
    });

    // Press Enter to start game
    this.input.keyboard.on("keydown-ENTER", () => {
      if (this.selectedTables.size > 0) {
        this.startGame();
      }
    });

    // Press number keys 2-9 to toggle tables
    // Press 0 to toggle table 10
    this.input.keyboard.on("keydown", (event) => {
      const key = event.key;

      // Handle number keys 2-9
      if (key >= '2' && key <= '9') {
        const tableNumber = parseInt(key, 10);
        this.toggleTableWithKeyboard(tableNumber);
      }
      // Handle 0 for table 10
      else if (key === '0') {
        this.toggleTableWithKeyboard(10);
      }
      // Handle 1 to toggle "Select All"
      else if (key === '1') {
        this.toggleSelectAll();
      }
    });
  }

  /**
   * Toggle table using keyboard with visual feedback
   */
  toggleTableWithKeyboard(table) {
    // Play click sound
    this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);

    // Animate button press
    const { button, text } = this.tableButtons[table];
    this.tweens.add({
      targets: [button, text],
      scaleX: 0.9,
      scaleY: 0.9,
      duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
      yoyo: true,
      ease: "Quad.easeInOut",
    });

    // Toggle the table
    this.toggleTable(table);
  }

  /**
   * Create leaderboard button
   */
  createLeaderboardButton() {
    const y = 660;  // Adjusted spacing

    this.leaderboardButton = this.add
      .text(400, y, "[ CLASSEMENT ]", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.leaderboardButton.setInteractive({ useHandCursor: true });

    this.leaderboardButton.on("pointerdown", () => {
      // Play click sound and animation
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: this.leaderboardButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
        yoyo: true,
        onComplete: () => {
          this.viewLeaderboard();
        }
      });
    });

    this.leaderboardButton.on("pointerover", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      this.leaderboardButton.setColor("#ffffff");
    });

    this.leaderboardButton.on("pointerout", () => {
      this.leaderboardButton.setColor("#ffff00");
    });
  }

  /**
   * Create input mode toggle (voice/keyboard)
   * Shows mic and keyboard emoji icons with visual selection state
   * Positioned in bottom right corner
   */
  createInputModeToggle() {
    // Bottom right corner positioning
    const baseX = 720; // Right side with padding
    const baseY = 720; // Bottom with padding
    const spacing = 50; // Spacing between icons

    // Mic icon (left)
    this.micIcon = this.add
      .text(baseX - spacing / 2, baseY, "🎤", {
        fontFamily: "Arial", // Emoji font
        fontSize: "32px",
        color: "#ffff00",
      })
      .setOrigin(0.5);

    // Keyboard icon (right)
    this.keyboardIcon = this.add
      .text(baseX + spacing / 2, baseY, "⌨️", {
        fontFamily: "Arial", // Emoji font
        fontSize: "32px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Make both icons interactive
    this.micIcon.setInteractive({ useHandCursor: true });
    this.keyboardIcon.setInteractive({ useHandCursor: true });

    // Click handlers
    this.micIcon.on("pointerdown", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.setInputMode("voice");
    });

    this.keyboardIcon.on("pointerdown", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.setInputMode("keyboard");
    });

    // Hover effects
    this.micIcon.on("pointerover", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      if (this.inputMode !== "voice") {
        this.micIcon.setScale(1.1);
      }
    });

    this.micIcon.on("pointerout", () => {
      if (this.inputMode !== "voice") {
        this.micIcon.setScale(1.0);
      }
    });

    this.keyboardIcon.on("pointerover", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      if (this.inputMode !== "keyboard") {
        this.keyboardIcon.setScale(1.1);
      }
    });

    this.keyboardIcon.on("pointerout", () => {
      if (this.inputMode !== "keyboard") {
        this.keyboardIcon.setScale(1.0);
      }
    });

    // Set initial visual state
    this.updateInputModeVisuals();
  }

  /**
   * Set input mode and update visuals
   * @param {string} mode - 'voice' or 'keyboard'
   */
  setInputMode(mode) {
    this.inputMode = mode;
    saveInputMode(mode);
    this.updateInputModeVisuals();
  }

  /**
   * Update visual state of input mode icons
   * Selected: full color (yellow text color), alpha 1.0
   * Unselected: greyed out with reduced alpha (0.3)
   */
  updateInputModeVisuals() {
    if (this.inputMode === "voice") {
      // Mic: selected (full color)
      this.micIcon.setAlpha(1.0);
      this.micIcon.setTint(0xffffff); // No tint (full color)
      // Keyboard: unselected (greyed out)
      this.keyboardIcon.setAlpha(0.3);
      this.keyboardIcon.setTint(0x888888); // Grey tint
    } else {
      // Keyboard: selected (full color)
      this.keyboardIcon.setAlpha(1.0);
      this.keyboardIcon.setTint(0xffffff); // No tint (full color)
      // Mic: unselected (greyed out)
      this.micIcon.setAlpha(0.3);
      this.micIcon.setTint(0x888888); // Grey tint
    }
  }

  /**
   * Edit player name (simple prompt for MVP)
   * M5: Using browser prompt for simplicity
   * Could be enhanced with custom input UI later
   */
  editName() {
    const newName = prompt("Entre ton nom:", this.playerName);

    if (newName && newName.trim().length > 0) {
      this.playerName = newName.trim();
      this.nameText.setText(this.playerName);
      // Save to localStorage so it persists
      savePlayerName(this.playerName);
    }
  }

  /**
   * View the leaderboard
   */
  viewLeaderboard() {
    this.scene.start('LeaderboardScene');
  }

  /**
   * Start the game with selected configuration
   */
  startGame() {
    // Validation: at least one table selected
    if (this.selectedTables.size === 0) {
      return;
    }

    // Transition to GameScene with configuration
    this.scene.start("GameScene", {
      playerName: this.playerName,
      selectedTables: Array.from(this.selectedTables).sort((a, b) => a - b),
      inputMode: this.inputMode,
    });
  }
}
