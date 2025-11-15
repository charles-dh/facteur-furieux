import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';

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

    console.log('GameOverScene initialized with results:', this.results);
  }

  create() {
    // Background (dark green to match game aesthetic)
    this.add.rectangle(400, 400, 800, 800, 0x004400);

    // Title
    this.add.text(400, 80, 'COURSE TERMINÉE!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ffff00',
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

    // Play Again button
    const playAgainY = 680;
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
      playAgainButton.setColor('#ffff00');
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setColor('#00ff00');
    });

    playAgainButton.on('pointerdown', () => {
      this.restartGame();
    });

    // Also allow Enter key to restart
    this.input.keyboard.on('keydown-ENTER', () => {
      this.restartGame();
    });

    console.log('GameOverScene created');
  }

  /**
   * Restart the game
   * M5: Returns to MenuScene (allows changing configuration)
   */
  restartGame() {
    console.log('Returning to menu');

    // M5: Return to MenuScene (player can choose different tables)
    this.scene.start('MenuScene');
  }
}
