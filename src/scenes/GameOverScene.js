import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { AUDIO, EFFECTS } from '../config/audioConfig.js';
import AudioManager from '../systems/AudioManager.js';
import LeaderboardManager from '../systems/LeaderboardManager.js';
import { savePlayerName } from '../systems/StorageManager.js';

/**
 * GameOverScene - Results and replay screen
 *
 * Displays final race statistics:
 * - Total race time (primary metric)
 * - Best lap time
 * - Accuracy percentage
 * - Correct/incorrect answer counts
 *
 * Allows player to restart the game
 *
 * M7: Added UI animations and sound effects
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  /**
   * Initialize scene with statistics data
   *
   * @param {Object} data - Statistics from GameScene {results, playerName, selectedTables}
   */
  init(data) {
    this.results = data.results;
    this.playerName = data.playerName || 'Pilote';
    this.selectedTables = data.selectedTables || [2, 3, 4, 5];

  }

  /**
   * Preload audio assets
   * M7: Generate sound effects for menu interactions
   */
  preload() {
    // Menu sounds are already in cache from GameScene — no need to regenerate.
  }

  create() {
    // M7: Initialize audio manager
    this.audioManager = new AudioManager(this);

    // Initialize leaderboard manager
    this.leaderboard = new LeaderboardManager();

    // Check if score would make the leaderboard
    const wouldMakeLeaderboard = this.leaderboard.wouldMakeLeaderboard(this.results.totalTime);

    // If score would make leaderboard, give player chance to edit name
    if (wouldMakeLeaderboard) {
      const editName = confirm(
        `Félicitations! Ton temps de ${this.leaderboard.formatTime(this.results.totalTime)} entre dans le classement!\n\n` +
        `Nom actuel: ${this.playerName}\n\n` +
        `Veux-tu changer ton nom avant de sauvegarder?`
      );

      if (editName) {
        const newName = prompt("Entre ton nom:", this.playerName);
        if (newName && newName.trim().length > 0) {
          this.playerName = newName.trim();
          // Save to localStorage so it persists for next game
          savePlayerName(this.playerName);
        }
      }
    }

    // Save score to leaderboard
    this.savedRank = this.leaderboard.addScore({
      playerName: this.playerName,
      totalTime: this.results.totalTime,
      accuracy: this.results.accuracy,
      lapTimes: this.results.lapTimes,
      correctAnswers: this.results.correctAnswers,
      totalAnswers: this.results.totalAnswers
    });

    // Background (dark green to match game aesthetic)
    this.add.rectangle(400, 400, 800, 800, 0x004400);

    // Title (with special message if new high score)
    let titleText = 'COURSE TERMINÉE!';
    let titleColor = '#ffff00';

    if (this.savedRank !== null) {
      if (this.savedRank === 1) {
        titleText = 'NOUVEAU RECORD! 🏆';
        titleColor = '#FFD700'; // Gold
      } else if (this.savedRank <= 3) {
        titleText = `TOP ${this.savedRank}! 🎉`;
        titleColor = '#00ff00';
      } else if (this.savedRank <= 10) {
        titleText = `TOP ${this.savedRank}! ⭐`;
      }
    }

    this.add.text(400, 80, titleText, {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Congratulations message
    this.add.text(400, 140, `Bravo ${this.playerName}!`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Main statistics panel
    const statsY = 220;
    const lineHeight = 45;

    // Total race time (primary metric - largest and highlighted)
    this.add.text(400, statsY, 'Temps Total:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(400, statsY + 35, this.results.totalTimeFormatted, {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Best lap time
    this.add.text(400, statsY + 90, `Meilleur Tour: ${this.results.bestLapTimeFormatted}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Accuracy
    this.add.text(400, statsY + 135, `Précision: ${this.results.accuracy}%`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Correct/Incorrect counts
    this.add.text(400, statsY + 180,
      `Bonnes réponses: ${this.results.correctAnswers} / ${this.results.totalAnswers}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Individual lap times
    const lapTimesY = statsY + 240;
    this.add.text(400, lapTimesY, 'Temps par tour:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.results.lapTimesFormatted.forEach((time, index) => {
      const isBestLap = this.results.lapTimes[index] === this.results.bestLapTime;
      this.add.text(400, lapTimesY + 30 + (index * 30),
        `Tour ${index + 1}: ${time}${isBestLap ? ' ★' : ''}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: isBestLap ? '#ffff00' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    });

    // View Leaderboard button
    const leaderboardY = 650;
    const leaderboardButton = this.add.text(400, leaderboardY, '[ VOIR CLASSEMENT ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    leaderboardButton.setInteractive({ useHandCursor: true });

    leaderboardButton.on('pointerover', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      leaderboardButton.setColor('#ffffff');
    });

    leaderboardButton.on('pointerout', () => {
      leaderboardButton.setColor('#ffff00');
    });

    leaderboardButton.on('pointerdown', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: leaderboardButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
        yoyo: true,
        onComplete: () => {
          // Navigate to leaderboard with highlight
          this.scene.start('LeaderboardScene', {
            highlightRank: this.savedRank
          });
        }
      });
    });

    // Play Again button
    const playAgainY = 710;
    const playAgainButton = this.add.text(400, playAgainY, '[ REJOUER ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Make button interactive
    playAgainButton.setInteractive({ useHandCursor: true });

    playAgainButton.on('pointerover', () => {
      // M7: Play hover sound
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      playAgainButton.setColor('#ffff00');
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setColor('#00ff00');
    });

    playAgainButton.on('pointerdown', () => {
      // M7: Play click sound and animation
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: playAgainButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: EFFECTS.ANIMATIONS.BUTTON_PRESS,
        yoyo: true,
        onComplete: () => {
          this.restartGame();
        }
      });
    });

    // Also allow Enter key to restart
    this.input.keyboard.on('keydown-ENTER', () => {
      this.restartGame();
    });

  }

  /**
   * Restart the game
   * M5: Returns to MenuScene (allows changing configuration)
   */
  restartGame() {
    // M5: Return to MenuScene (player can choose different tables)
    this.scene.start('MenuScene');
  }
}
