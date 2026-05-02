import Phaser from "phaser";
import { AUDIO } from "../config/audioConfig.js";
import AudioManager from "../systems/AudioManager.js";
import SoundGenerator from "../systems/SoundGenerator.js";
import {
  loadPlayerName, savePlayerName,
  loadInputMode, saveInputMode,
} from "../systems/StorageManager.js";
import { makeTextButton, makeRectButton, makeIconButton } from "./UIKit.js";

/**
 * MenuScene — welcome screen with configuration.
 *
 * Lets the player set their name, pick which multiplication tables to
 * practice, and choose voice/keyboard input.
 *
 * UI primitives (buttons, hover/click feedback, sounds) live in UIKit so
 * this scene focuses on layout and wiring.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  preload() {
    // Generate the menu sounds only on first load. On subsequent visits
    // (after a game), they're already in cache because GameScene
    // generated them.
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
    this.audioManager = new AudioManager(this);

    // Browsers require user interaction to unlock the audio context.
    this.input.once('pointerdown', () => {
      if (this.sound.context) this.sound.context.resume();
    });

    // Forward UIKit feedback events to the audio manager. Single place
    // to wire it for all buttons in the scene.
    this.events.on('uikit:hover', () => this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER));
    this.events.on('uikit:click', () => this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK));

    // Full-canvas dark-green background. Layout below still uses 800-wide
    // anchors; the wider canvas just shows extra background on the sides.
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x004400);

    this.drawHeader();
    this.drawNameSection();
    this.drawTableSection();
    this.drawActionButtons();
    this.drawInputModeToggle();

    this.setupKeyboardShortcuts();

    // Reset cleanup hooks so the next visit doesn't accumulate listeners.
    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-N');
      this.input.keyboard.off('keydown-ENTER');
      this.input.keyboard.off('keydown');
      this.events.off('uikit:hover');
      this.events.off('uikit:click');
    });
  }

  // ─── Layout ────────────────────────────────────────────────────────

  drawHeader() {
    this.add.text(400, 80, "FACTOR FURIOUS", {
      fontFamily: '"Press Start 2P"',
      fontSize: "48px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(400, 140, "Course de Multiplications", {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  drawNameSection() {
    this.playerName = loadPlayerName();

    this.add.text(400, 200, "Nom:", {
      fontFamily: '"Press Start 2P"',
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.nameText = this.add.text(400, 240, this.playerName, {
      fontFamily: '"Press Start 2P"',
      fontSize: "20px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(400, 270, "(appuyez sur N pour changer)", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#888888",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);
  }

  drawTableSection() {
    this.add.text(400, 330, "Choisis tes tables:", {
      fontFamily: '"Press Start 2P"',
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(400, 360, "(touches 2-9, 0 pour 10, 1 pour tout)", {
      fontFamily: '"Press Start 2P"',
      fontSize: "8px",
      color: "#888888",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.selectedTables = new Set([2, 3, 4, 5]); // sensible default
    this.tableButtons = {};

    const startX = 150;
    const y = 420;
    const spacing = 70;

    for (let table = 2; table <= 10; table++) {
      const x = startX + (table - 2) * spacing;
      const btn = makeRectButton({
        scene: this,
        x, y,
        width: 60, height: 60,
        label: String(table),
        onClick: () => this.toggleTable(table),
        onHover: () => {
          if (!this.selectedTables.has(table)) {
            btn.background.setFillStyle(0x555555);
          }
        },
        onHoverOut: () => this.refreshTableButton(table),
      });
      this.tableButtons[table] = btn;
      this.refreshTableButton(table);
    }
  }

  drawActionButtons() {
    this.selectAllButton = makeTextButton({
      scene: this,
      x: 400, y: 510,
      label: "[ Tout sélectionner ]",
      fontSize: "14px",
      idleColor: "#ffff00",
      hoverColor: "#ffffff",
      onClick: () => this.toggleSelectAll(),
    });

    this.startButton = makeTextButton({
      scene: this,
      x: 400, y: 600,
      label: "[ COMMENCER ]",
      fontSize: "24px",
      idleColor: "#00ff00",
      hoverColor: "#ffff00",
      onClick: () => this.startGame(),
      isEnabled: () => this.selectedTables.size > 0,
    });
    this.refreshStartButton();

    this.leaderboardButton = makeTextButton({
      scene: this,
      x: 400, y: 660,
      label: "[ CLASSEMENT ]",
      fontSize: "16px",
      idleColor: "#ffff00",
      hoverColor: "#ffffff",
      onClick: () => this.scene.start('LeaderboardScene'),
    });
  }

  drawInputModeToggle() {
    this.inputMode = loadInputMode();

    const baseX = 720;
    const baseY = 720;
    const spacing = 50;

    this.micIcon = makeIconButton({
      scene: this,
      x: baseX - spacing / 2,
      y: baseY,
      emoji: "🎤",
      onClick: () => this.setInputMode('voice'),
      isSelected: () => this.inputMode === 'voice',
    });

    this.keyboardIcon = makeIconButton({
      scene: this,
      x: baseX + spacing / 2,
      y: baseY,
      emoji: "⌨️",
      onClick: () => this.setInputMode('keyboard'),
      isSelected: () => this.inputMode === 'keyboard',
    });
  }

  // ─── State updates ─────────────────────────────────────────────────

  toggleTable(table) {
    if (this.selectedTables.has(table)) {
      this.selectedTables.delete(table);
    } else {
      this.selectedTables.add(table);
    }
    this.refreshTableButton(table);
    this.refreshStartButton();
  }

  toggleSelectAll() {
    const allSelected = this.selectedTables.size === 9;
    this.selectedTables.clear();
    if (!allSelected) {
      for (let t = 2; t <= 10; t++) this.selectedTables.add(t);
    }
    for (let t = 2; t <= 10; t++) this.refreshTableButton(t);
    this.refreshStartButton();
  }

  refreshTableButton(table) {
    const { background, label } = this.tableButtons[table];
    if (this.selectedTables.has(table)) {
      background.setFillStyle(0x00aa00);
      label.setColor("#ffffff");
    } else {
      background.setFillStyle(0x333333);
      label.setColor("#888888");
    }
  }

  refreshStartButton() {
    if (this.selectedTables.size > 0) {
      this.startButton.setColor("#00ff00");
      this.startButton.setAlpha(1);
    } else {
      this.startButton.setColor("#666666");
      this.startButton.setAlpha(0.5);
    }
  }

  setInputMode(mode) {
    this.inputMode = mode;
    saveInputMode(mode);
    // Refresh both icons so the previously-selected one greys out.
    this.micIcon.refresh();
    this.keyboardIcon.refresh();
  }

  // ─── Keyboard shortcuts ────────────────────────────────────────────

  setupKeyboardShortcuts() {
    this.input.keyboard.on('keydown-N', () => this.editName());

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.selectedTables.size > 0) this.startGame();
    });

    this.input.keyboard.on('keydown', (event) => {
      const key = event.key;
      if (key >= '2' && key <= '9') {
        this.toggleTableViaKeyboard(parseInt(key, 10));
      } else if (key === '0') {
        this.toggleTableViaKeyboard(10);
      } else if (key === '1') {
        this.toggleSelectAll();
      }
    });
  }

  /**
   * Keyboard-triggered table toggle: same as a click but also plays the
   * UIKit press animation manually so the user gets visual feedback.
   */
  toggleTableViaKeyboard(table) {
    this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
    this.tableButtons[table].pressAnimation();
    this.toggleTable(table);
  }

  editName() {
    // Browser prompt — replaced by an in-game text input in a later phase.
    const newName = prompt("Entre ton nom:", this.playerName);
    if (newName && newName.trim().length > 0) {
      this.playerName = newName.trim();
      this.nameText.setText(this.playerName);
      savePlayerName(this.playerName);
    }
  }

  startGame() {
    if (this.selectedTables.size === 0) return;
    this.scene.start("GameScene", {
      playerName: this.playerName,
      selectedTables: Array.from(this.selectedTables).sort((a, b) => a - b),
      inputMode: this.inputMode,
    });
  }
}
