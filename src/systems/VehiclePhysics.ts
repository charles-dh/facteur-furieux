import { PHYSICS } from '../config/constants.js';

/**
 * VehiclePhysics System
 *
 * Track-shape-independent car physics:
 * - Velocity in track-progress per second (0-1 scale, NOT pixels)
 * - Acceleration applied per-frame, then reset
 * - Multiplicative friction (continuous slowdown that eases to a stop)
 * - Boosts add acceleration; the integration step turns that into velocity
 *
 * Velocity scale example: velocity = 0.2 means 20% of track per second
 * (~5 seconds per lap).
 */
export default class VehiclePhysics {
  position: number;
  velocity: number;
  acceleration: number;
  maxSpeed: number;
  friction: number;

  constructor() {
    this.position = 0;
    this.velocity = 0;
    this.acceleration = 0;
    this.maxSpeed = PHYSICS.MAX_SPEED;
    this.friction = PHYSICS.FRICTION;
  }

  /**
   * Integrate physics for one frame.
   * @param delta milliseconds since last frame
   * @param perspectiveFactor multiplier applied to the position step only.
   *   1.0 = no change. < 1 slows the car down (used when far from the camera
   *   in the tilted track view); > 1 speeds it up (when near). Velocity itself
   *   is unaffected so accel/friction keep their normal feel.
   */
  update(delta: number, perspectiveFactor: number = 1): void {
    // 1. Apply acceleration accumulated this frame.
    this.velocity += this.acceleration;

    // 2. Multiplicative friction — feels natural and eases to zero.
    this.velocity *= this.friction;

    // 3. Clamp to [0, maxSpeed]. Car can stop completely.
    this.velocity = Math.max(0, Math.min(this.velocity, this.maxSpeed));

    // 4. Integrate position. Velocity is already in progress/sec, so we just
    //    multiply by deltaSeconds — no track-length conversion needed.
    //    Perspective factor scales the visible advance so the car looks the
    //    right speed at every depth.
    const deltaSeconds = delta / 1000;
    this.position += this.velocity * deltaSeconds * perspectiveFactor;

    // 5. Lap wrap.
    if (this.position >= 1.0) {
      this.position = this.position % 1.0;
    }

    // 6. Reset acceleration — boosts are one-shot, applied via applyBoost().
    this.acceleration = 0;
  }

  /**
   * Add a boost. Strength is in [0, 1]; 1.0 = full boost.
   * The boost is added to acceleration and integrated next update().
   */
  applyBoost(multiplier: number): void {
    this.acceleration += PHYSICS.BASE_ACCELERATION * multiplier;
  }
}
