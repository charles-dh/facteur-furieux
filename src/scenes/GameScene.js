import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { TRACK, CAR, PHYSICS, TIMING } from '../config/constants.js';
import Track from '../systems/Track.js';
import VehiclePhysics from '../systems/VehiclePhysics.js';
import MathProblem from '../systems/MathProblem.js';

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
    console.log('=== GameScene.create() started ===');

    // Add grass green background
    // Note: Background color is also set in gameConfig, but we add this
    // as a rectangle to ensure it's visible if canvas is resized
    this.add.rectangle(400, 400, 800, 800, COLORS.GRASS_GREEN);
    console.log('Background added');

    // Create track system
    this.track = new Track(this);
    console.log('Track created');

    // Render track graphics
    this.renderTrack();
    console.log('Track rendered');

    // Create and position car
    this.createCar();
    console.log('Car created');

    // M2: Create physics system (replaces M1 constant-speed movement)
    this.vehiclePhysics = new VehiclePhysics();
    console.log('Physics created');

    // M3: Create math problem system
    // For MVP, using tables 2-5 for testing (will be configurable in M5)
    this.mathProblem = new MathProblem([2, 3, 4, 5]);
    console.log('Math problem system created');

    // M3: Create problem UI overlay
    this.createProblemUI();
    console.log('Problem UI created');

    // M3: Initialize answer input
    this.currentAnswer = '';

    // M3: Setup keyboard input for answers
    this.setupAnswerInput();
    console.log('Answer input setup');

    // M2.4: Add speed indicator UI
    this.speedText = this.add.text(20, 760, 'Speed: 0.00', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });
    console.log('Speed indicator created');

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
    console.log('Debug panel created');

    // M3: Start first problem
    this.startNewProblem();
    console.log('First problem started');

    console.log('=== GameScene.create() completed ===');
    console.log('GameScene created! Answer problems to boost, D for debug');
  }

  /**
   * Create problem UI overlay
   * M3.4: Problem display, timer bar, answer input, feedback
   */
  createProblemUI() {
    // Problem display (centered, large text)
    this.problemText = this.add.text(400, 250, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Timer bar background (gray rectangle)
    this.timerBarBg = this.add.rectangle(400, 320, 400, 20, 0x333333);

    // Timer bar fill (starts green, changes to yellow/red)
    this.timerBarFill = this.add.rectangle(400, 320, 400, 20, COLORS.TIMER_GREEN)
      .setOrigin(0.5);

    // Answer display (shows what user is typing)
    this.answerText = this.add.text(400, 360, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Feedback text (correct/incorrect/timeout messages)
    this.feedbackText = this.add.text(400, 410, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  /**
   * Setup keyboard input for answering problems
   * M3.5: Numeric input, backspace, enter to submit
   */
  setupAnswerInput() {
    // Numeric input (0-9)
    this.input.keyboard.on('keydown', (event) => {
      if (event.key >= '0' && event.key <= '9') {
        this.currentAnswer += event.key;
        this.answerText.setText(this.currentAnswer || '_');
      }
    });

    // Backspace to delete digits
    this.input.keyboard.on('keydown-BACKSPACE', () => {
      this.currentAnswer = this.currentAnswer.slice(0, -1);
      this.answerText.setText(this.currentAnswer || '_');
    });

    // Enter to submit answer
    this.input.keyboard.on('keydown-ENTER', () => {
      this.submitAnswer();
    });
  }

  /**
   * Start a new problem
   * M3.6: Generate problem, start timer, clear feedback
   */
  startNewProblem() {
    // Generate new problem
    this.mathProblem.generate();

    // Update problem text
    const p = this.mathProblem.currentProblem;
    this.problemText.setText(`${p.a} × ${p.b} = ?`);

    // Start timer
    this.mathProblem.startTimer();

    // Clear feedback and answer
    this.feedbackText.setText('');
    this.currentAnswer = '';
    this.answerText.setText('_');
  }

  /**
   * Submit the current answer
   * M3.6: Check answer, apply boost or show error
   */
  submitAnswer() {
    if (!this.currentAnswer) return;

    const isCorrect = this.mathProblem.checkAnswer(this.currentAnswer);

    if (isCorrect) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  /**
   * Handle correct answer
   * M3.6: Calculate boost, apply to physics, show feedback, next problem
   */
  handleCorrectAnswer() {
    // 1. Calculate boost based on remaining timer
    const boostStrength = this.mathProblem.calculateBoost();

    // 2. Apply boost to physics
    this.vehiclePhysics.applyBoost(boostStrength);

    // 3. Stop timer
    this.mathProblem.timerActive = false;

    // 4. Show feedback
    this.feedbackText.setText(`Correct! +${boostStrength.toFixed(2)} boost`);
    this.feedbackText.setColor('#00ff00');

    // 5. Clear answer
    this.currentAnswer = '';
    this.answerText.setText('');

    // 6. Schedule next problem after delay
    this.time.delayedCall(TIMING.CORRECT_ANSWER_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Handle incorrect answer
   * M3.6: Show feedback, timer keeps running, can retry
   */
  handleIncorrectAnswer() {
    // 1. Show feedback (timer keeps running!)
    this.feedbackText.setText('Try again!');
    this.feedbackText.setColor('#ff0000');

    // 2. Clear answer input so user can retry
    this.currentAnswer = '';
    this.answerText.setText('_');

    // 3. Timer continues counting down
    // Player can retry immediately
  }

  /**
   * Handle timer timeout
   * M3.6: No boost, show timeout message, next problem
   */
  handleTimeout() {
    // 1. No boost applied (critical!)

    // 2. Show timeout message
    this.feedbackText.setText('Time up!');
    this.feedbackText.setColor('#ff6600');

    // 3. Clear answer
    this.currentAnswer = '';
    this.answerText.setText('');

    // 4. Schedule next problem (shorter delay than correct answer)
    this.time.delayedCall(TIMING.TIMEOUT_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Update timer bar visual
   * M3.6: Update width and color based on remaining time
   */
  updateTimerBar() {
    const percent = this.mathProblem.getRemainingPercent();

    // Update width
    this.timerBarFill.width = 400 * percent;

    // Update color based on remaining time
    if (percent > 0.5) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_GREEN);
    } else if (percent > 0.25) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_YELLOW);
    } else {
      this.timerBarFill.setFillStyle(COLORS.TIMER_RED);
    }

    // Check for timeout
    if (this.mathProblem.timer <= 0 && this.mathProblem.timerActive === false) {
      // Only handle timeout once
      if (!this.timeoutHandled) {
        this.timeoutHandled = true;
        this.handleTimeout();
      }
    } else {
      this.timeoutHandled = false;
    }
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

    // Note: Phaser Graphics doesn't support dashed lines natively
    // Skipping dashed center line for MVP - can be added later with manual segments

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

    // M3: Update problem timer
    this.mathProblem.updateTimer(delta);

    // M3: Update timer bar visual
    this.updateTimerBar();

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
