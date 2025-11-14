import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

// Scenes will be imported here as we build them
// import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
// import GameOverScene from './scenes/GameOverScene.js';

// Add scenes to configuration
// For M1-M3, we only have GameScene
gameConfig.scene = [GameScene];

// Initialize Phaser game
const game = new Phaser.Game(gameConfig);

// Make game instance globally accessible for debugging (optional)
window.game = game;

console.log('Math Racer initialized!');
