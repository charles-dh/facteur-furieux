import Phaser from 'phaser';
import { GAME } from './constants.js';

// Phaser game configuration
export const gameConfig = {
  type: Phaser.AUTO,
  width: GAME.CANVAS_WIDTH,
  height: GAME.CANVAS_HEIGHT,
  backgroundColor: '#00aa00', // Grass green background
  parent: 'game-container',
  scene: [], // Scenes will be added in main.js
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true, // Crisp rendering for retro aesthetic
    antialias: false
  }
};
