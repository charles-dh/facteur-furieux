import { PHYSICS } from '../config/constants.js';

/**
 * VehiclePhysics System
 *
 * Manages car physics independent of track shape:
 * - Velocity-based movement (progress per second, 0-1 scale)
 * - Acceleration and friction
 * - Boost mechanics
 * - Can stop completely (velocity reaches zero)
 *
 * IMPORTANT: Velocity uses progress per second (0-1 scale), NOT pixels!
 * Example: velocity = 0.2 means "complete 20% of track per second" (~5 seconds per lap)
 */
export default class VehiclePhysics {
  constructor() {
    // Position on track (0-1 scale, where 0 = start, 1 = full lap)
    this.position = 0;

    // Velocity in progress per second (0-1 scale, NOT pixels!)
    // Example: 0.2 = 20% of track per second = ~5 seconds per lap
    this.velocity = 0;

    // Current frame acceleration (additive to velocity)
    this.acceleration = 0;

    // Maximum velocity (from constants)
    this.maxSpeed = PHYSICS.MAX_SPEED;

    // Friction multiplier applied every frame
    // 0.98 means car retains 98% of velocity each frame (continuous slowdown)
    this.friction = PHYSICS.FRICTION;

    console.log(`VehiclePhysics initialized: max speed = ${this.maxSpeed}, friction = ${this.friction}`);
  }

  /**
   * Update physics simulation
   *
   * @param {number} delta - Time since last frame in milliseconds
   *
   * Physics order matters:
   * 1. Apply acceleration to velocity
   * 2. Apply friction (multiplicative decay)
   * 3. Clamp velocity to valid range
   * 4. Update position based on velocity
   * 5. Reset acceleration for next frame
   */
  update(delta) {
    // 1. Apply current acceleration to velocity
    this.velocity += this.acceleration;

    // 2. Apply friction (continuous deceleration)
    // Multiplicative friction feels more natural than subtractive
    // and automatically slows less as velocity approaches zero
    this.velocity *= this.friction;

    // 3. Clamp velocity to valid range [0, maxSpeed]
    // Car CAN stop (velocity = 0) and cannot exceed max speed
    this.velocity = Math.max(0, Math.min(this.velocity, this.maxSpeed));

    // 4. Update position based on velocity
    // IMPORTANT: velocity is already in progress per second (0-1 scale)
    // So we just multiply by delta time - NO division by trackLength needed!
    const deltaSeconds = delta / 1000; // Convert milliseconds to seconds
    this.position += this.velocity * deltaSeconds;

    // 5. Handle lap wrapping
    // When position >= 1.0, we've completed a lap
    if (this.position >= 1.0) {
      this.position = this.position % 1.0;
    }

    // 6. Reset acceleration for next frame
    // Acceleration is applied once per boost, then reset
    this.acceleration = 0;
  }

  /**
   * Apply a boost to the car
   *
   * @param {number} multiplier - Boost strength (0-1 scale)
   *                             In M3, this will be based on remaining timer
   *                             For M2 testing, use 1.0 for full boost
   *
   * Boosts work by adding acceleration, which is then applied to velocity in update()
   * This creates smooth acceleration rather than instant speed changes
   */
  applyBoost(multiplier) {
    // Add acceleration based on boost multiplier
    // BASE_ACCELERATION is tuned in constants.js
    this.acceleration += PHYSICS.BASE_ACCELERATION * multiplier;
  }
}
