import { EFFECTS } from '../config/audioConfig.js';

/**
 * Screen Shake Effect Utility
 *
 * Creates camera shake effects for impactful moments:
 * - Incorrect answers
 * - Collisions
 * - Other dramatic events
 *
 * Uses Phaser's camera shake feature for smooth,
 * performance-friendly screen shake.
 */
export default class ScreenShake {
  /**
   * Apply screen shake to a scene's camera
   *
   * @param {Phaser.Scene} scene - The scene to shake
   * @param {number} intensity - Shake intensity in pixels (default from config)
   * @param {number} duration - Shake duration in ms (default from config)
   */
  static shake(scene, intensity = EFFECTS.SCREEN_SHAKE.INTENSITY, duration = EFFECTS.SCREEN_SHAKE.DURATION) {
    if (!scene || !scene.cameras || !scene.cameras.main) {
      console.warn('Cannot shake: invalid scene or camera');
      return;
    }

    // Use Phaser's built-in camera shake
    scene.cameras.main.shake(duration, intensity / 1000); // Phaser uses 0-1 scale, we use pixels
  }

  /**
   * Apply a light shake (half intensity)
   *
   * @param {Phaser.Scene} scene - The scene to shake
   */
  static lightShake(scene) {
    this.shake(scene, EFFECTS.SCREEN_SHAKE.INTENSITY * 0.5, EFFECTS.SCREEN_SHAKE.DURATION);
  }

  /**
   * Apply a heavy shake (double intensity, longer duration)
   *
   * @param {Phaser.Scene} scene - The scene to shake
   */
  static heavyShake(scene) {
    this.shake(scene, EFFECTS.SCREEN_SHAKE.INTENSITY * 2, EFFECTS.SCREEN_SHAKE.DURATION * 1.5);
  }
}
