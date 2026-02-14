import Phaser from "phaser";

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

    // Simple circular track - clean and predictable
    // Center: (400, 400), Radius: 320 pixels (larger track)
    const centerX = 400;
    const centerY = 400;
    const radius = 320;

    // Create a circle path using Phaser's Ellipse curve (with equal radii it's a circle)
    // Start at 270 degrees (top of circle) so progress 0 is at the top
    this.path = new Phaser.Curves.Ellipse(
      centerX,
      centerY,
      radius,
      radius,
      270,
      630,
      false,
      0
    );

    // Calculate total track length in pixels using Phaser's built-in method
    // For a circle: circumference = 2 * PI * radius
    this.length = this.path.getLength();
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
      angle: angle,
    };
  }
}
