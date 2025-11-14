import Phaser from 'phaser';

/**
 * Track System
 *
 * Manages the racing track path and provides position/angle calculations
 * for converting progress (0-1) to world coordinates.
 *
 * Design: Fixed oval track for MVP (same track every time)
 * - 8 control points creating smooth curves
 * - Roughly oval shape for familiarity
 * - Start/finish at top center
 * - All curves are gentle (no hairpin turns)
 */
export default class Track {
  /**
   * @param {Phaser.Scene} scene - The scene this track belongs to
   */
  constructor(scene) {
    this.scene = scene;

    // Fixed oval track - same every time (not randomly generated)
    // These points create a smooth, roughly oval racing path
    const points = [
      new Phaser.Math.Vector2(400, 100),   // Top center (start/finish)
      new Phaser.Math.Vector2(600, 150),   // Top-right curve entry
      new Phaser.Math.Vector2(700, 400),   // Right side
      new Phaser.Math.Vector2(600, 650),   // Bottom-right curve
      new Phaser.Math.Vector2(400, 700),   // Bottom center
      new Phaser.Math.Vector2(200, 650),   // Bottom-left curve
      new Phaser.Math.Vector2(100, 400),   // Left side
      new Phaser.Math.Vector2(200, 150)    // Top-left curve
    ];

    // Create closed spline path using Phaser's curve system
    // Spline curves provide smooth interpolation between control points
    this.path = new Phaser.Curves.Path();
    this.path.add(new Phaser.Curves.Spline(points));
    this.path.closePath(); // Ensure the path forms a closed loop

    // Calculate total track length in pixels using Phaser's built-in method
    // This is used for rendering and will be referenced by the physics system
    this.length = this.path.getLength();

    console.log(`Track created: ${this.length.toFixed(0)} pixels long`);
  }

  /**
   * Convert track progress (0-1) to world position and orientation
   *
   * @param {number} t - Progress along track (0 = start, 1 = full lap)
   * @returns {{x: number, y: number, angle: number}} World position and rotation
   */
  getPositionAt(t) {
    // Get the point on the path at progress t
    // Phaser's getPoint() handles the 0-1 range automatically
    const point = this.path.getPoint(t);

    // Get the tangent (direction) at this point on the path
    // This tells us which way the track is facing
    const tangent = this.path.getTangent(t);

    // Calculate rotation angle from the tangent vector
    // atan2 gives us the angle in radians, which Phaser uses for rotation
    const angle = Math.atan2(tangent.y, tangent.x);

    return {
      x: point.x,
      y: point.y,
      angle: angle
    };
  }
}
