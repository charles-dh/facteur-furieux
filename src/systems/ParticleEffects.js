import { EFFECTS } from '../config/audioConfig.js';

/**
 * Particle Effects System
 *
 * Manages visual effects using Phaser's particle system:
 * - Speed boost particles from car
 * - Correct answer flash/sparkle
 * - Lap completion celebration
 * - Problem appearance effects
 *
 * All effects are lightweight and designed for performance
 */
export default class ParticleEffects {
  constructor(scene) {
    this.scene = scene;

    // Track active effects for cleanup
    this.activeEffects = [];

    console.log('ParticleEffects initialized');
  }

  /**
   * Create speed boost particle effect
   * Emits particles from rear of car while boosting
   *
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} angleDegrees - Initial emission angle in degrees (optional)
   * @returns {Phaser.GameObjects.Particles.ParticleEmitter} The emitter
   */
  createSpeedBoost(x, y, angleDegrees = 0) {
    // Create particle texture only if it doesn't exist
    if (!this.scene.textures.exists('particle_boost')) {
      // Create a glowing circular particle texture with gradient
      const graphics = this.scene.add.graphics();

      // Outer glow (semi-transparent)
      graphics.fillStyle(EFFECTS.PARTICLES.SPEED_BOOST.TINT, 0.3);
      graphics.fillCircle(8, 8, 8);

      // Middle ring (brighter)
      graphics.fillStyle(EFFECTS.PARTICLES.SPEED_BOOST.TINT, 0.7);
      graphics.fillCircle(8, 8, 6);

      // Core (brightest)
      graphics.fillStyle(0xffff00, 1); // Yellow core for more glow
      graphics.fillCircle(8, 8, 4);

      graphics.generateTexture('particle_boost', 16, 16);
      graphics.destroy();

      console.log('Boost particle texture created');
    }

    // Create particle emitter
    const emitter = this.scene.add.particles(x, y, 'particle_boost', {
      speed: EFFECTS.PARTICLES.SPEED_BOOST.SPEED,
      lifespan: EFFECTS.PARTICLES.SPEED_BOOST.LIFESPAN,
      scale: {
        start: EFFECTS.PARTICLES.SPEED_BOOST.SCALE.start,
        end: EFFECTS.PARTICLES.SPEED_BOOST.SCALE.end
      },
      alpha: {
        start: EFFECTS.PARTICLES.SPEED_BOOST.ALPHA.start,
        end: EFFECTS.PARTICLES.SPEED_BOOST.ALPHA.end
      },
      blendMode: 'ADD', // Additive blending for glow effect
      frequency: 30, // Emit more frequently (reduced from 50ms)
      quantity: EFFECTS.PARTICLES.SPEED_BOOST.QUANTITY,
      // Angle will be updated dynamically in GameScene
      angle: { min: angleDegrees - 15, max: angleDegrees + 15 },
      gravityY: 0, // No gravity
      bounce: 0
    });

    console.log('Boost particle emitter created at', x, y, 'with angle', angleDegrees);

    this.activeEffects.push(emitter);
    return emitter;
  }

  /**
   * Create correct answer flash effect
   * Brief green particles/flash
   *
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   */
  createCorrectFlash(x = 400, y = 300) {
    // Create green particle texture
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(EFFECTS.PARTICLES.CORRECT_FLASH.TINT, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture('particle_correct', 6, 6);
    graphics.destroy();

    // One-shot particle burst
    const emitter = this.scene.add.particles(x, y, 'particle_correct', {
      speed: EFFECTS.PARTICLES.CORRECT_FLASH.SPEED,
      lifespan: EFFECTS.PARTICLES.CORRECT_FLASH.LIFESPAN,
      scale: {
        start: EFFECTS.PARTICLES.CORRECT_FLASH.SCALE.start,
        end: EFFECTS.PARTICLES.CORRECT_FLASH.SCALE.end
      },
      blendMode: 'ADD',
      quantity: EFFECTS.PARTICLES.CORRECT_FLASH.QUANTITY
    });

    // Explode once then destroy
    emitter.explode();

    this.scene.time.delayedCall(EFFECTS.PARTICLES.CORRECT_FLASH.LIFESPAN, () => {
      emitter.destroy();
    });

    // Also add a full-screen green flash overlay
    const flash = this.scene.add.rectangle(400, 400, 800, 800, 0x00ff00, 0.2);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Create incorrect answer shake and red flash
   */
  createIncorrectFlash() {
    // Red flash overlay
    const flash = this.scene.add.rectangle(400, 400, 800, 800, 0xff0000, 0.3);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });

    // Screen shake handled separately by ScreenShake utility
  }

  /**
   * Create lap celebration effect
   * Colorful confetti burst
   *
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   */
  createLapCelebration(x = 400, y = 200) {
    // Create multiple colored particle textures
    const colors = EFFECTS.PARTICLES.CELEBRATION.COLORS;

    colors.forEach((color, index) => {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 6, 6);
      graphics.generateTexture(`particle_confetti_${index}`, 6, 6);
      graphics.destroy();

      // Create emitter for this color
      const emitter = this.scene.add.particles(x, y, `particle_confetti_${index}`, {
        speed: EFFECTS.PARTICLES.CELEBRATION.SPEED,
        lifespan: EFFECTS.PARTICLES.CELEBRATION.LIFESPAN,
        gravityY: EFFECTS.PARTICLES.CELEBRATION.GRAVITY,
        scale: {
          start: EFFECTS.PARTICLES.CELEBRATION.SCALE.start,
          end: EFFECTS.PARTICLES.CELEBRATION.SCALE.end
        },
        angle: { min: -120, max: -60 }, // Upward burst
        quantity: EFFECTS.PARTICLES.CELEBRATION.QUANTITY / colors.length
      });

      // Explode once
      emitter.explode();

      // Cleanup
      this.scene.time.delayedCall(EFFECTS.PARTICLES.CELEBRATION.LIFESPAN, () => {
        emitter.destroy();
      });
    });
  }

  /**
   * Destroy all active effects
   * Call when cleaning up scene
   */
  destroyAll() {
    this.activeEffects.forEach(effect => {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    });
    this.activeEffects = [];
    console.log('All particle effects destroyed');
  }
}
