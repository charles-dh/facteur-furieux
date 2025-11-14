import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { TRACK, CAR, PHYSICS } from '../config/constants.js';
import Track from '../systems/Track.js';
import VehiclePhysics from '../systems/VehiclePhysics.js';

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

    // M2: Create physics system (replaces M1 constant-speed movement)
    this.vehiclePhysics = new VehiclePhysics();

    // M2.3: Add manual boost input for testing
    // Spacebar applies a full boost (will be replaced by problem answers in M3)
    this.input.keyboard.on('keydown-SPACE', () => {
      this.vehiclePhysics.applyBoost(1.0); // Full boost for testing
      console.log('Boost applied! Velocity:', this.vehiclePhysics.velocity.toFixed(4));
    });

    // M2.4: Add speed indicator UI
    this.speedText = this.add.text(20, 760, 'Speed: 0.00', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });

    // M2.7: Debug mode (optional but recommended for physics tuning)
    this.debugMode = false;

    // Toggle debug mode with D key
    this.input.keyboard.on('keydown-D', () => {
      this.debugMode = !this.debugMode;
      console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
    });

    // Create debug text panel (bottom-left corner)
    this.debugText = this.add.text(10, 650, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 8 }
    }).setDepth(1000); // Ensure it's on top of everything

    console.log('GameScene created! Press SPACE to boost, D for debug');
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
    // M2: Physics-based movement (replaces M1 constant-speed)

    // Update physics simulation
    // This handles velocity, friction, acceleration, and position updates
    this.vehiclePhysics.update(delta);

    // Get world position and angle from track using physics position
    const position = this.track.getPositionAt(this.vehiclePhysics.position);

    // Update car position and rotation to follow the track
    this.car.setPosition(position.x, position.y);

    // Add PI/2 to angle because car triangle points up in local coordinates
    // but the track tangent angle assumes pointing right
    this.car.setRotation(position.angle + Math.PI / 2);

    // M2.4: Update speed indicator
    this.speedText.setText(`Speed: ${this.vehiclePhysics.velocity.toFixed(2)}`);

    // M2.7: Update debug panel
    this.updateDebug();
  }

  /**
   * Update debug overlay with physics information
   * M2.7: Debug mode for physics tuning
   */
  updateDebug() {
    if (!this.debugMode) {
      this.debugText.setVisible(false);
      return;
    }

    this.debugText.setVisible(true);
    const p = this.vehiclePhysics;

    const debugInfo = [
      'DEBUG MODE (Press D to toggle)',
      '─'.repeat(35),
      `Velocity:     ${p.velocity.toFixed(4)} / ${p.maxSpeed}`,
      `Acceleration: ${p.acceleration.toFixed(6)}`,
      `Position:     ${p.position.toFixed(4)}`,
      `Friction:     ${PHYSICS.FRICTION}`,
      `Max Speed:    ${PHYSICS.MAX_SPEED} (${(1/PHYSICS.MAX_SPEED).toFixed(1)}s/lap)`
    ].join('\n');

    this.debugText.setText(debugInfo);
  }
}
