import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { TRACK, CAR, PHYSICS, TIMING } from '../config/constants.js';
import Track from '../systems/Track.js';
import VehiclePhysics from '../systems/VehiclePhysics.js';
import MathProblem from '../systems/MathProblem.js';
import StatisticsTracker from '../systems/StatisticsTracker.js';

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

  /**
   * Initialize scene with configuration data
   * M4: Receives player name and selected tables from GameOverScene
   * M5: Will receive from MenuScene instead
   */
  init(data) {
    this.selectedTables = data.selectedTables || [2, 3, 4, 5];
    this.playerName = data.playerName || 'Pilote';
    console.log('GameScene initialized with tables:', this.selectedTables, 'Player:', this.playerName);
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

    // M4: Create statistics tracker
    this.stats = new StatisticsTracker();
    this.previousPosition = 0; // For lap detection
    console.log('Statistics tracker created');

    // M3: Create math problem system
    // M4: Now uses selectedTables from init() instead of hardcoded values
    this.mathProblem = new MathProblem(this.selectedTables);
    console.log('Math problem system created with tables:', this.selectedTables);

    // M3: Create problem UI overlay
    this.createProblemUI();
    console.log('Problem UI created');

    // M4: Create HUD (lap counter, stats display)
    this.createHUD();
    console.log('HUD created');

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

    // M4: Start race timer (use Phaser time for consistency)
    this.stats.startRace(this.time.now);

    console.log('=== GameScene.create() completed ===');
    console.log('GameScene created! Answer problems to boost, D for debug');
  }

  /**
   * Create HUD (Heads-Up Display)
   * M4: Displays lap counter, accuracy, and timing info
   */
  createHUD() {
    // Top-left: Lap counter and accuracy
    this.lapText = this.add.text(20, 20, 'Lap: 1/3', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.accuracyText = this.add.text(20, 50, 'Accuracy: 0%', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });

    this.answersText = this.add.text(20, 75, 'Correct: 0 / 0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    });

    // Top-right: Lap times
    this.lapTimesText = this.add.text(780, 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0);

    this.totalTimeText = this.add.text(780, 75, 'Total: 0.000s', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0);
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
   * M4: Record statistics
   */
  handleCorrectAnswer() {
    // 1. Calculate boost based on remaining timer
    const boostStrength = this.mathProblem.calculateBoost();

    // 2. Apply boost to physics
    this.vehiclePhysics.applyBoost(boostStrength);

    // 3. Stop timer
    this.mathProblem.timerActive = false;

    // 4. M4: Record correct answer in statistics
    this.stats.recordCorrectAnswer();

    // 5. Show feedback
    this.feedbackText.setText(`Correct! +${boostStrength.toFixed(2)} boost`);
    this.feedbackText.setColor('#00ff00');

    // 6. Clear answer
    this.currentAnswer = '';
    this.answerText.setText('');

    // 7. Schedule next problem after delay
    this.time.delayedCall(TIMING.CORRECT_ANSWER_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Handle incorrect answer
   * M3.6: Show feedback, timer keeps running, can retry
   * M4: Record statistics
   */
  handleIncorrectAnswer() {
    // 1. M4: Record incorrect answer in statistics
    this.stats.recordIncorrectAnswer();

    // 2. Show feedback (timer keeps running!)
    this.feedbackText.setText('Try again!');
    this.feedbackText.setColor('#ff0000');

    // 3. Clear answer input so user can retry
    this.currentAnswer = '';
    this.answerText.setText('_');

    // 4. Timer continues counting down
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

    // Get points along the path to draw it
    const points = this.track.path.getPoints(100); // Get 100 points along the path

    // Draw the path using lines between points
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();

    console.log('Track rendered with', points.length, 'points');

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

    // M4: Detect lap completion
    this.detectLapCompletion();

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

    // M4: Update HUD
    this.updateHUD();

    // M2.7: Update debug panel
    this.updateDebug();
  }

  /**
   * Detect lap completion
   * M4: Checks if car crossed start/finish line (forward direction)
   */
  detectLapCompletion() {
    const currentPos = this.vehiclePhysics.position;
    const previousPos = this.previousPosition;

    // Detect wrap-around from ~1.0 to ~0.0 (forward direction)
    if (previousPos > 0.9 && currentPos < 0.1) {
      this.onLapComplete();
    }

    this.previousPosition = currentPos;
  }

  /**
   * Handle lap completion
   * M4: Record lap time, check for game over
   */
  onLapComplete() {
    const lapData = this.stats.completeLap(this.time.now);

    console.log(`Lap ${lapData.lapNumber} complete: ${this.stats.formatTime(lapData.lapTime)}`);

    // Check if race is complete (3 laps)
    if (lapData.isFinalLap) {
      this.endRace();
    }
  }

  /**
   * End the race and transition to GameOver scene
   * M4: Pass statistics to results screen
   */
  endRace() {
    console.log('Race complete! Transitioning to GameOver scene');

    // Small delay before transition for dramatic effect
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        results: this.stats.getResults(),
        playerName: this.playerName,
        selectedTables: this.selectedTables
      });
    });
  }

  /**
   * Update HUD display
   * M4: Updates lap counter, accuracy, and timing displays
   */
  updateHUD() {
    // Update lap counter
    this.lapText.setText(`Lap: ${this.stats.currentLap}/3`);

    // Update accuracy
    this.accuracyText.setText(`Accuracy: ${this.stats.getAccuracy()}%`);

    // Update answer counts
    this.answersText.setText(`Correct: ${this.stats.correctAnswers} / ${this.stats.totalAnswers}`);

    // Update lap times (right side)
    const currentLapTime = this.stats.getCurrentLapTime(this.time.now);
    const lastLapTime = this.stats.getLastLapTime();

    let timesText = `Current: ${this.stats.formatTime(currentLapTime)}\n`;

    if (lastLapTime !== null) {
      timesText += `Last: ${this.stats.formatTime(lastLapTime)}\n`;
    }

    if (this.stats.bestLapTime !== Infinity) {
      timesText += `Best: ${this.stats.formatTime(this.stats.bestLapTime)}`;
    }

    this.lapTimesText.setText(timesText);

    // Update total time
    const totalTime = this.time.now - this.stats.raceStartTime;
    this.totalTimeText.setText(`Total: ${this.stats.formatTime(totalTime)}`);
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
