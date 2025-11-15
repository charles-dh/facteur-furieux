import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { AUDIO, EFFECTS } from '../config/audioConfig.js';
import AudioManager from '../systems/AudioManager.js';
import SoundGenerator from '../systems/SoundGenerator.js';
import LeaderboardManager from '../systems/LeaderboardManager.js';

/**
 * LeaderboardScene - Display high scores
 *
 * Shows the top 10 local scores stored in browser localStorage
 * Includes:
 * - Player names and times
 * - Accuracy percentages
 * - Date of achievement
 * - Return to menu button
 * - Clear leaderboard button
 *
 * Educational value:
 * - Motivates students to improve their times
 * - Shows progress over multiple sessions
 * - Encourages friendly competition (same device)
 */
export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  /**
   * Initialize scene
   * M5: Can be called from MenuScene
   */
  init(data) {
    // Optional: highlight a specific rank (if just added)
    this.highlightRank = data?.highlightRank || null;
  }

  /**
   * Preload audio assets
   * M7: Generate sound effects for menu interactions
   */
  preload() {
    console.log('LeaderboardScene: Generating sound effects...');

    // Create sound generator
    const generator = new SoundGenerator();

    // Generate menu sounds
    const sounds = [
      { key: AUDIO.SFX.MENU_CLICK, buffer: generator.generateMenuClickSound() },
      { key: AUDIO.SFX.MENU_HOVER, buffer: generator.generateMenuHoverSound() }
    ];

    // Convert buffers to base64 and load into Phaser
    sounds.forEach(({ key, buffer }) => {
      const dataUri = generator.bufferToBase64WAV(buffer);
      this.load.audio(key, dataUri);
    });
  }

  create() {
    // M7: Initialize audio manager
    this.audioManager = new AudioManager(this);

    // Initialize leaderboard manager
    this.leaderboard = new LeaderboardManager();

    // Background (dark green)
    this.add.rectangle(400, 400, 800, 800, 0x004400);

    // Title
    this.add.text(400, 60, 'MEILLEURS TEMPS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Get scores
    const scores = this.leaderboard.getScores();

    // Display scores or empty message
    if (scores.length === 0) {
      this.displayEmptyMessage();
    } else {
      this.displayScores(scores);
    }

    // Back to menu button
    this.createBackButton();

    // Clear leaderboard button (only if scores exist)
    if (scores.length > 0) {
      this.createClearButton();
    }

    console.log('LeaderboardScene created');
  }

  /**
   * Display message when leaderboard is empty
   */
  displayEmptyMessage() {
    this.add.text(400, 300, 'Aucun score enregistré', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(400, 350, 'Joue une course pour', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(400, 380, 'apparaître ici!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  /**
   * Display leaderboard scores
   *
   * @param {Array<Object>} scores - Array of score objects
   */
  displayScores(scores) {
    // Table headers
    const headerY = 120;
    const headerStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    };

    this.add.text(80, headerY, 'RANG', headerStyle);
    this.add.text(200, headerY, 'NOM', headerStyle);
    this.add.text(420, headerY, 'TEMPS', headerStyle);
    this.add.text(620, headerY, 'PRÉCISION', headerStyle);

    // Score entries
    const startY = 160;
    const lineHeight = 45;

    scores.forEach((score, index) => {
      const rank = index + 1;
      const y = startY + (index * lineHeight);

      // Highlight if this is a new score
      const isHighlighted = this.highlightRank === rank;
      const bgColor = isHighlighted ? 0x226622 : (index % 2 === 0 ? 0x003300 : 0x004400);

      // Background row
      const rowBg = this.add.rectangle(400, y + 10, 750, 40, bgColor);
      rowBg.setAlpha(0.5);

      // Medal colors for top 3
      let rankColor = '#ffffff';
      if (rank === 1) rankColor = '#FFD700'; // Gold
      else if (rank === 2) rankColor = '#C0C0C0'; // Silver
      else if (rank === 3) rankColor = '#CD7F32'; // Bronze

      const rankStyle = {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: rankColor,
        stroke: '#000000',
        strokeThickness: 3
      };

      const normalStyle = {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      };

      const timeStyle = {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: rank <= 3 ? '#00ff00' : '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      };

      // Rank (with medal emoji for top 3)
      let rankText = `${rank}`;
      if (rank === 1) rankText += ' 🥇';
      else if (rank === 2) rankText += ' 🥈';
      else if (rank === 3) rankText += ' 🥉';

      this.add.text(80, y, rankText, rankStyle);

      // Player name (truncate if too long)
      const displayName = score.name.length > 12 ? score.name.substring(0, 12) + '...' : score.name;
      this.add.text(200, y, displayName, normalStyle);

      // Time (formatted)
      const timeFormatted = this.leaderboard.formatTime(score.time);
      this.add.text(420, y, timeFormatted, timeStyle);

      // Accuracy
      this.add.text(620, y, `${score.accuracy}%`, normalStyle);

      // Date (small text below, optional)
      if (index < 5) { // Only show date for top 5 to avoid clutter
        const dateText = this.leaderboard.formatDate(score.date);
        this.add.text(200, y + 20, dateText, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: '#666666',
          stroke: '#000000',
          strokeThickness: 1
        });
      }
    });
  }

  /**
   * Create back to menu button
   */
  createBackButton() {
    const backButton = this.add.text(400, 720, '[ RETOUR AU MENU ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      backButton.setColor('#ffff00');
    });

    backButton.on('pointerout', () => {
      backButton.setColor('#00ff00');
    });

    backButton.on('pointerdown', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: backButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
        yoyo: true,
        onComplete: () => {
          this.scene.start('MenuScene');
        }
      });
    });

    // Also allow ESC key to go back
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Create clear leaderboard button
   */
  createClearButton() {
    const clearButton = this.add.text(400, 680, '[ Effacer le tableau ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    clearButton.setInteractive({ useHandCursor: true });

    clearButton.on('pointerover', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      clearButton.setColor('#ff0000');
    });

    clearButton.on('pointerout', () => {
      clearButton.setColor('#ff6666');
    });

    clearButton.on('pointerdown', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);

      // Show confirmation (simple browser confirm for MVP)
      const confirmed = confirm('Effacer tous les scores du tableau? Cette action ne peut pas être annulée.');

      if (confirmed) {
        this.leaderboard.clearScores();
        // Recreate scene to show empty state
        this.scene.restart();
      }
    });
  }
}
