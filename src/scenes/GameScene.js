import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { TRACK, CAR } from '../config/constants.js';
import Track from '../systems/Track.js';

/**
 * GameScene - Main gameplay scene
 *
 * This scene handles the core racing gameplay:
 * - Top-down view of the racing track
 * - Car movement and rendering
 * - Physics simulation (added in M2)
 * - Problem display and input (added in M3)
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Add grass green background
    // Note: Background color is also set in gameConfig, but we add this
    // as a rectangle to ensure it's visible if canvas is resized
    this.add.rectangle(400, 400, 800, 800, COLORS.GRASS_GREEN);

    // Create track system
    this.track = new Track(this);

    // Render track graphics
    this.renderTrack();

    // Create and position car
    this.createCar();

    // Initialize car movement (for M1 only - will be replaced by physics in M2)
    // Progress represents position on track (0 = start, 1 = full lap)
    this.progress = 0;

    // Constant speed for M1 testing (will be replaced by physics in M2)
    // Speed of 0.05 means 5% of track per second (~20 seconds per lap)
    this.constantSpeed = 0.05;

    console.log('GameScene created!');
  }

  /**
   * Render the racing track using code-generated graphics
   * Uses Phaser Graphics API to draw the track path
   */
  renderTrack() {
    const graphics = this.add.graphics();

    // Draw main track (thick gray stroke)
    graphics.lineStyle(TRACK.WIDTH, COLORS.TRACK_GRAY);
    graphics.strokePath(this.track.path);

    // Draw dashed center line (white)
    graphics.lineStyle(TRACK.CENTER_LINE_WIDTH, COLORS.TRACK_LINE_WHITE);
    graphics.setLineDash([10, 10]); // 10px dash, 10px gap
    graphics.strokePath(this.track.path);
    graphics.setLineDash([]); // Reset line dash for other drawings

    // Draw start/finish line (red bar perpendicular to track)
    // Position it at progress = 0 (top center)
    const startPos = this.track.getPositionAt(0);

    // Calculate perpendicular angle (90 degrees to track direction)
    const perpAngle = startPos.angle + Math.PI / 2;

    // Draw the start/finish line as a rectangle rotated to be perpendicular
    const startFinishRect = this.add.rectangle(
      startPos.x,
      startPos.y,
      TRACK.START_FINISH_WIDTH,
      TRACK.START_FINISH_HEIGHT,
      COLORS.START_FINISH_RED
    );
    startFinishRect.setRotation(perpAngle);

    console.log('Track rendered');
  }

  /**
   * Create the car sprite using code-generated graphics
   * Uses a simple triangle shape pointing in the direction of travel
   */
  createCar() {
    // Create graphics object for the car
    const carGraphics = this.add.graphics();

    // Draw a simple triangle (wedge shape) for the car
    // Triangle points forward (up in local coordinates)
    // Origin is at center for proper rotation
    carGraphics.fillStyle(COLORS.CAR_RED, 1);
    carGraphics.fillTriangle(
      0, -CAR.HEIGHT / 2,      // Top point (front of car)
      -CAR.WIDTH / 2, CAR.HEIGHT / 2,  // Bottom-left
      CAR.WIDTH / 2, CAR.HEIGHT / 2    // Bottom-right
    );

    // Store reference to car graphics
    this.car = carGraphics;

    // Position car at track start (progress = 0)
    const startPos = this.track.getPositionAt(0);
    this.car.setPosition(startPos.x, startPos.y);

    // Rotate car to match track direction
    // Add PI/2 because triangle points up but we want it to follow the track tangent
    this.car.setRotation(startPos.angle + Math.PI / 2);

    console.log('Car created at start position');
  }

  update(time, delta) {
    // M1: Simple constant-speed movement to verify track following
    // This will be replaced by physics-based movement in M2

    // Convert delta from milliseconds to seconds for frame-rate independence
    const deltaSeconds = delta / 1000;

    // Increment progress based on constant speed
    // Progress is 0-1 scale (0 = start, 1 = complete lap)
    this.progress += this.constantSpeed * deltaSeconds;

    // Handle lap wrapping - when we complete a lap, reset to start
    if (this.progress >= 1.0) {
      this.progress = this.progress % 1.0;
      console.log('Lap completed!');
    }

    // Get world position and angle from track at current progress
    const position = this.track.getPositionAt(this.progress);

    // Update car position and rotation to follow the track
    this.car.setPosition(position.x, position.y);

    // Add PI/2 to angle because car triangle points up in local coordinates
    // but the track tangent angle assumes pointing right
    this.car.setRotation(position.angle + Math.PI / 2);
  }
}
