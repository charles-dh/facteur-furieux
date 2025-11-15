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
   * @param {number} speedPercent - Speed as percentage (0-1), affects color gradient and quantity
   * @returns {Phaser.GameObjects.Particles.ParticleEmitter} The emitter
   */
  createSpeedBoost(x, y, speedPercent = 0.5) {
    // Create gradient colored particle textures (yellow → orange → red based on speed)
    // Low speed (0-0.33): Yellow
    // Medium speed (0.33-0.66): Orange
    // High speed (0.66-1.0): Red
    const colors = [
      { threshold: 0, color: 0xffff00, name: 'yellow' },   // Yellow
      { threshold: 0.33, color: 0xffaa00, name: 'orange' }, // Orange
      { threshold: 0.66, color: 0xff6600, name: 'red_orange' }, // Red-orange
      { threshold: 0.85, color: 0xff0000, name: 'red' }     // Red
    ];

    // Determine color based on speed
    let selectedColor = colors[0];
    for (let i = colors.length - 1; i >= 0; i--) {
      if (speedPercent >= colors[i].threshold) {
        selectedColor = colors[i];
        break;
      }
    }

    // Create particle texture with selected color
    const textureName = `particle_boost_${selectedColor.name}`;
    if (!this.scene.textures.exists(textureName)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(selectedColor.color, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture(textureName, 8, 8);
      graphics.destroy();
    }

    // Increase particle quantity at high speeds (2x to 5x base quantity)
    const baseQuantity = EFFECTS.PARTICLES.SPEED_BOOST.QUANTITY;
    const quantity = Math.floor(baseQuantity * (1 + speedPercent * 4));

    // Create particle emitter with turbulence/swirl effect
    const emitter = this.scene.add.particles(x, y, textureName, {
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
      blendMode: 'ADD',
      frequency: 50,
      quantity: quantity,
      // Add turbulence/swirl effect by varying angle and speed
      angle: { min: -20, max: 20 }, // Particles spread in a cone
      speedX: { min: -30, max: 30 }, // Horizontal turbulence
      speedY: { min: -30, max: 30 }, // Vertical turbulence
      rotate: { min: -180, max: 180 }, // Random rotation
      gravityY: 20 // Slight downward drift
    });

    this.activeEffects.push(emitter);
    return emitter;
  }

  /**
   * Create correct answer flash effect with starburst
   * Brief green particles/flash with enhanced starburst rays
   *
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   */
  createCorrectFlash(x = 400, y = 300) {
    // Create green particle texture (circles)
    if (!this.scene.textures.exists('particle_correct')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(EFFECTS.PARTICLES.CORRECT_FLASH.TINT, 1);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('particle_correct', 6, 6);
      graphics.destroy();
    }

    // Create star particle texture (for starburst rays)
    if (!this.scene.textures.exists('particle_star')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffff00, 1); // Yellow stars
      graphics.fillStar(4, 4, 5, 2, 4);
      graphics.generateTexture('particle_star', 8, 8);
      graphics.destroy();
    }

    // One-shot particle burst (circles)
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

    // Create starburst effect (radiating star rays)
    const starEmitter = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 150, max: 300 },
      lifespan: 800,
      scale: {
        start: 1.5,
        end: 0
      },
      alpha: {
        start: 1,
        end: 0
      },
      blendMode: 'ADD',
      quantity: 16, // 16 rays radiating outward
      angle: { min: 0, max: 360 }, // Full circle
      rotate: { min: 0, max: 360 } // Random rotation
    });

    // Explode starburst
    starEmitter.explode();

    // Cleanup
    this.scene.time.delayedCall(EFFECTS.PARTICLES.CORRECT_FLASH.LIFESPAN, () => {
      emitter.destroy();
    });

    this.scene.time.delayedCall(800, () => {
      starEmitter.destroy();
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
