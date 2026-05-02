import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';

// Surface runtime errors as a visible overlay — silent crashes inside Phaser
// scenes (which the engine swallows during create() / update()) are otherwise
// invisible to the user, leaving "blank screen" with the cause only in the
// devtools console.
function showError(prefix: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.error(prefix, err);
  const e = err as Error;
  const message = e?.message ?? String(err);

  // Audio decode failures aren't fatal — Phaser falls back gracefully and the
  // game stays playable. Don't pop a scary red banner for these.
  if (typeof message === 'string' && /decode audio data/i.test(message)) return;

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px;' +
    'background:#a00;color:#fff;font:12px/1.4 monospace;white-space:pre-wrap;';
  overlay.textContent = `${prefix}\n${message}\n${e?.stack ?? ''}`;
  document.body.appendChild(overlay);
}
window.addEventListener('error', (e) => showError('Uncaught error:', e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => showError('Unhandled promise rejection:', e.reason));

// Flow: MenuScene → GameScene → GameOverScene → MenuScene (loop).
// LeaderboardScene is reachable from MenuScene and GameOverScene.
gameConfig.scene = [MenuScene, GameScene, GameOverScene, LeaderboardScene];

new Phaser.Game(gameConfig);
