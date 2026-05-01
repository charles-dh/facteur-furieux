import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';

// Flow: MenuScene → GameScene → GameOverScene → MenuScene (loop).
// LeaderboardScene is reachable from MenuScene and GameOverScene.
gameConfig.scene = [MenuScene, GameScene, GameOverScene, LeaderboardScene];

new Phaser.Game(gameConfig);
