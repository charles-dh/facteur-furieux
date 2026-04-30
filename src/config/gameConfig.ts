import Phaser from 'phaser';
import { GAME } from './constants.js';

// Phaser game configuration. Scenes are registered in main.ts.
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.CANVAS_WIDTH,
  height: GAME.CANVAS_HEIGHT,
  backgroundColor: '#00aa00', // grass green
  parent: 'game-container',
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true, // crisp retro rendering
    antialias: false,
  },
  audio: {
    noAudio: false,
    disableWebAudio: false,
  },
};
