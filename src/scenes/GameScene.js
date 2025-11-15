import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { TRACK, CAR, PHYSICS, TIMING } from '../config/constants.js';
import { AUDIO } from '../config/audioConfig.js';
import Track from '../systems/Track.js';
import VehiclePhysics from '../systems/VehiclePhysics.js';
import MathProblem from '../systems/MathProblem.js';
import StatisticsTracker from '../systems/StatisticsTracker.js';
import FrenchSpeechRecognition from '../systems/FrenchSpeechRecognition.js';
import AudioManager from '../systems/AudioManager.js';
import ParticleEffects from '../systems/ParticleEffects.js';
import SoundGenerator from '../systems/SoundGenerator.js';
import ScreenShake from '../effects/ScreenShake.js';

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

  /**
   * Preload assets
   * M7: Generate procedural sound effects using Web Audio API
   * Also preload car sprite
   */
  preload() {
    console.log('Preloading assets...');

    // Preload car sprite
    this.load.image('car', 'assets/red_car_top.png');

    console.log('Generating sound effects...');

    // Create sound generator
    const generator = new SoundGenerator();

    // Generate all sound effects and load them as base64 data URIs
    const sounds = [
      { key: AUDIO.SFX.ACCELERATE, buffer: generator.generateAccelerateSound() },
      { key: AUDIO.SFX.CORRECT, buffer: generator.generateCorrectSound() },
      { key: AUDIO.SFX.INCORRECT, buffer: generator.generateIncorrectSound() },
      { key: AUDIO.SFX.LAP_COMPLETE, buffer: generator.generateLapCompleteSound() },
      { key: AUDIO.SFX.PROBLEM_APPEAR, buffer: generator.generateProblemAppearSound() },
      { key: AUDIO.SFX.COUNTDOWN_TICK, buffer: generator.generateCountdownTickSound() },
      { key: AUDIO.SFX.MENU_CLICK, buffer: generator.generateMenuClickSound() },
      { key: AUDIO.SFX.MENU_HOVER, buffer: generator.generateMenuHoverSound() },
      { key: AUDIO.SFX.GAME_START, buffer: generator.generateGameStartSound() }
    ];

    // Convert buffers to base64 and load into Phaser
    sounds.forEach(({ key, buffer }) => {
      const dataUri = generator.bufferToBase64WAV(buffer);
      this.load.audio(key, dataUri);
    });

    console.log('Sound effects generated and queued for loading');
  }

  create() {
    console.log('=== GameScene.create() started ===');

    // Add grass green background
    // Note: Background color is also set in gameConfig, but we add this
    // as a rectangle to ensure it's visible if canvas is resized
    this.add.rectangle(400, 400, 800, 800, COLORS.GRASS_GREEN);
    console.log('Background added');

    // M7: Initialize audio and effects systems
    this.audioManager = new AudioManager(this);
    this.particleEffects = new ParticleEffects(this);
    console.log('Audio and particle effects initialized');

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
    this.answerSubmitted = false; // Flag to prevent timeout race condition
    this.processingAnswer = false; // Flag to prevent multiple simultaneous submissions
    this.answerBuffer = []; // Buffer to store sequence of recognized answers

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

    // M6: Setup speech recognition
    this.speech = new FrenchSpeechRecognition();

    if (this.speech.supported) {
      // Setup callbacks
      this.speech.onNumberRecognized = (number) => {
        this.handleSpeechNumber(number);
      };

      this.speech.onInterimResult = (text) => {
        // Show what's being heard (visual feedback)
        if (this.speechFeedbackText) {
          this.speechFeedbackText.setText(`Écoute: "${text}"`);
        }
      };

      this.speech.onError = (error) => {
        console.error('Speech error:', error);
        if (this.micStatusText) {
          this.micStatusText.setText('🎤 Erreur');
          this.micStatusText.setColor('#ff0000');
        }
      };

      // Start listening
      this.speech.start();

      // Add microphone status indicator
      this.micStatusText = this.add.text(400, 450, '🎤 Écoute...', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      // Add speech feedback text (shows what's being heard)
      this.speechFeedbackText = this.add.text(400, 480, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      console.log('Speech recognition started');
    } else {
      // Show keyboard-only indicator
      this.add.text(400, 450, 'Clavier uniquement', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      console.log('Speech recognition not supported - keyboard only');
    }

    // M3: Start first problem
    this.startNewProblem();
    console.log('First problem started');

    // M4: Start race timer
    // Use 0 as the baseline - we'll calculate elapsed time using deltas
    this.raceStartTime = 0;
    this.stats.startRace(0);  // Statistics tracker starts at 0
    this.elapsedTime = 0;  // Track accumulated elapsed time

    console.log('=== GameScene.create() completed ===');
    console.log('GameScene created! Answer with voice or keyboard, D for debug');
  }

  /**
   * Handle speech-recognized number(s)
   * M6: Automatically submit when number is spoken
   * Now supports multiple numbers in sequence - picks the correct one
   */
  handleSpeechNumber(numbers) {
    const timestamp = performance.now();
    console.log(`[${timestamp.toFixed(2)}ms] === Speech Input ===`);
    console.log('Recognized numbers:', numbers);
    console.log('Current problem:', this.mathProblem.currentProblem);
    console.log('Expected answer:', this.mathProblem.currentProblem?.answer);
    console.log('Processing flag:', this.processingAnswer);

    // Ignore if we're already processing an answer
    if (this.processingAnswer) {
      console.log(`[${performance.now().toFixed(2)}ms] IGNORED: Already processing an answer`);
      return;
    }

    // Clear speech feedback
    if (this.speechFeedbackText) {
      this.speechFeedbackText.setText('');
    }

    // Check if any of the recognized numbers is correct
    const expectedAnswer = this.mathProblem.currentProblem?.answer;
    let correctNumber = null;

    for (const number of numbers) {
      if (number === expectedAnswer) {
        correctNumber = number;
        console.log(`[${performance.now().toFixed(2)}ms] Found correct answer in sequence: ${number}`);
        break;
      }
    }

    // If no correct answer found, ignore this sequence
    if (correctNumber === null) {
      console.log(`[${performance.now().toFixed(2)}ms] No correct answer in sequence [${numbers.join(', ')}] - ignoring`);
      return;
    }

    // Set the correct answer and submit
    this.currentAnswer = String(correctNumber);
    this.answerText.setText(this.currentAnswer);
    console.log(`[${performance.now().toFixed(2)}ms] Correct answer displayed: ${correctNumber}`);

    // Mark answer as submitted to prevent timeout race condition
    this.answerSubmitted = true;
    this.processingAnswer = true;

    // Set speech cooldown immediately to prevent lingering final results from being processed
    if (this.speech && this.speech.supported) {
      this.speech.setCooldown(500); // Ignore speech for 500ms after answer accepted
    }

    console.log(`[${performance.now().toFixed(2)}ms] Calling submitAnswer()`);

    // Auto-submit (no need to press Enter with voice)
    this.submitAnswer();
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

    // Top-right corner: Restart button
    this.createRestartButton();
  }

  /**
   * Create restart button in top-right corner
   * Allows player to return to menu and start over
   */
  createRestartButton() {
    const restartButton = this.add.text(760, 110, '[ ↻ ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0);

    restartButton.setInteractive({ useHandCursor: true });

    // Hover effect
    restartButton.on('pointerover', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      restartButton.setColor('#ff0000');
      restartButton.setScale(1.1);
    });

    restartButton.on('pointerout', () => {
      restartButton.setColor('#ff6666');
      restartButton.setScale(1.0);
    });

    // Click handler - confirm before restarting
    restartButton.on('pointerdown', () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);

      // Animate button press
      this.tweens.add({
        targets: restartButton,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // Confirm restart
          const confirmed = confirm('Abandonner la course et retourner au menu?');
          if (confirmed) {
            this.restartGame();
          }
        }
      });
    });

    // Also allow ESC key to restart
    this.input.keyboard.on('keydown-ESC', () => {
      const confirmed = confirm('Abandonner la course et retourner au menu?');
      if (confirmed) {
        this.restartGame();
      }
    });
  }

  /**
   * Restart the game - return to menu
   * Stops speech recognition and transitions to MenuScene
   */
  restartGame() {
    console.log('Restarting game - returning to menu');

    // Stop speech recognition if active
    if (this.speech && this.speech.supported) {
      this.speech.stop();
    }

    // Return to menu
    this.scene.start('MenuScene');
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
   * M7: Add sound and animation
   */
  startNewProblem() {
    // Generate new problem
    this.mathProblem.generate();

    // Update problem text
    const p = this.mathProblem.currentProblem;
    this.problemText.setText(`${p.a} × ${p.b} = ?`);

    // M7: Animate problem appearance
    this.problemText.setAlpha(0);
    this.problemText.setScale(0.8);
    this.tweens.add({
      targets: this.problemText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // M7: Play problem appear sound
    this.audioManager.playSFX(AUDIO.SFX.PROBLEM_APPEAR);

    // Start timer after a short delay to give player time to read the problem
    // This prevents the timer from starting immediately and gives better UX
    this.time.delayedCall(TIMING.PROBLEM_READ_DELAY, () => {
      this.mathProblem.startTimer();
    });

    // Clear feedback and answer
    this.feedbackText.setText('');
    this.feedbackText.setScale(1); // Reset scale
    this.currentAnswer = '';
    this.answerText.setText('_');
    this.answerSubmitted = false; // Reset flag for new problem
    this.processingAnswer = false; // Reset processing flag for new problem

    // M6: Reset speech recognition to allow same number to be recognized again
    if (this.speech && this.speech.supported) {
      this.speech.reset();
    }
  }

  /**
   * Submit the current answer
   * M3.6: Check answer, apply boost or show error
   */
  submitAnswer() {
    console.log(`[${performance.now().toFixed(2)}ms] submitAnswer() called`);

    if (!this.currentAnswer) {
      console.log('No answer to submit');
      this.processingAnswer = false;
      return;
    }

    console.log(`[${performance.now().toFixed(2)}ms] Checking answer:`, this.currentAnswer, 'against expected:', this.mathProblem.currentProblem?.answer);
    const isCorrect = this.mathProblem.checkAnswer(this.currentAnswer);
    console.log(`[${performance.now().toFixed(2)}ms] Answer is correct:`, isCorrect);

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
   * M7: Add sound effects and visual effects
   */
  handleCorrectAnswer() {
    console.log(`[${performance.now().toFixed(2)}ms] handleCorrectAnswer() START`);

    // 1. Calculate boost based on remaining timer
    const boostStrength = this.mathProblem.calculateBoost();
    console.log(`[${performance.now().toFixed(2)}ms] Boost calculated:`, boostStrength);

    // 2. Apply boost to physics
    this.vehiclePhysics.applyBoost(boostStrength);
    console.log(`[${performance.now().toFixed(2)}ms] Boost APPLIED to vehicle`);

    // 3. Stop timer
    this.mathProblem.timerActive = false;

    // 4. M4: Record correct answer in statistics
    this.stats.recordCorrectAnswer();

    // 5. M7: Play correct answer sound
    // DISABLED FOR TESTING
    // this.audioManager.playSFX(AUDIO.SFX.CORRECT);

    // 6. M7: Show visual effect (green flash and particles)
    // DISABLED FOR TESTING
    // this.particleEffects.createCorrectFlash(400, 300);

    // 7. Show feedback with animation
    // DISABLED FOR TESTING
    this.feedbackText.setText(`Correct! +${boostStrength.toFixed(2)} boost`);
    this.feedbackText.setColor('#00ff00');
    // this.feedbackText.setScale(0.8);
    // this.tweens.add({
    //   targets: this.feedbackText,
    //   scale: 1,
    //   duration: 200,
    //   ease: 'Back.easeOut'
    // });

    // 8. Clear answer
    this.currentAnswer = '';
    this.answerText.setText('');

    console.log(`[${performance.now().toFixed(2)}ms] handleCorrectAnswer() COMPLETE`);

    // 9. Schedule next problem after delay
    this.time.delayedCall(TIMING.CORRECT_ANSWER_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Handle incorrect answer
   * M3.6: Show feedback, timer keeps running, can retry
   * M4: Record statistics
   * M7: REMOVED - No longer shows feedback to avoid interrupting flow
   */
  handleIncorrectAnswer() {
    console.log(`[${performance.now().toFixed(2)}ms] handleIncorrectAnswer() - silently ignoring`);

    // Record incorrect answer in statistics
    this.stats.recordIncorrectAnswer();

    // NO sound, NO screen shake, NO visual feedback
    // Just silently ignore and allow player to keep trying

    // Clear answer input so user can retry
    this.currentAnswer = '';
    this.answerText.setText('_');

    // Reset processing flag so user can try again
    this.processingAnswer = false;

    console.log(`[${performance.now().toFixed(2)}ms] Wrong answer ignored - Ready for next attempt`);

    // Timer continues counting down
    // Player can retry immediately without interruption
  }

  /**
   * Handle timer timeout
   * M3.6: No boost, show timeout message, next problem
   * M7: Add sound effect
   */
  handleTimeout() {
    // 1. No boost applied (critical!)

    // 2. M7: Play timeout sound (same as incorrect for now)
    this.audioManager.playSFX(AUDIO.SFX.INCORRECT, 0.7);

    // 3. Show timeout message
    this.feedbackText.setText('Time up!');
    this.feedbackText.setColor('#ff6600');

    // 4. Clear answer
    this.currentAnswer = '';
    this.answerText.setText('');

    // 5. Schedule next problem (shorter delay than correct answer)
    this.time.delayedCall(TIMING.TIMEOUT_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Update timer bar visual
   * M3.6: Update width and color based on remaining time
   * M7: Enhanced color feedback and pulsing animation
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
    // Only timeout if timer expired AND no answer was submitted (prevents race condition)
    if (this.mathProblem.timer <= 0 && this.mathProblem.timerActive === false && !this.answerSubmitted) {
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

    // Draw the circle manually to ensure it closes perfectly
    // Center at (400, 400), radius 320
    graphics.strokeCircle(400, 400, 320);

    console.log('Track rendered as circle');

    // Draw start/finish line (white bar perpendicular to track)
    // Position it at progress = 0 (top center)
    const startPos = this.track.getPositionAt(0);

    // The finish line rectangle dimensions: thinner width for a cleaner look
    // By default, Phaser rectangles have width on X-axis, height on Y-axis
    // So unrotated: narrow width (horizontal), height (vertical) = vertical bar
    //
    // At the top of track: tangent ≈ 0° (pointing right, horizontal)
    // We want the finish line perpendicular to this = vertical
    // A vertical bar (height > width) with 0° rotation is already vertical
    // So we just need the tangent angle directly to keep it perpendicular as we go around
    const perpAngle = startPos.angle;

    // Draw the start/finish line as a white rectangle rotated to be perpendicular
    // Using thinner width (5px instead of 10px) for cleaner appearance
    const startFinishRect = this.add.rectangle(
      startPos.x,
      startPos.y,
      5,  // Thinner width
      TRACK.START_FINISH_HEIGHT,
      COLORS.TRACK_LINE_WHITE
    );
    startFinishRect.setRotation(perpAngle);

    console.log('Track rendered');
  }

  /**
   * Create the car sprite
   * Uses a top-down car image sprite
   */
  createCar() {
    // Create sprite from preloaded image
    // The sprite should be oriented pointing upward in the source image
    this.car = this.add.sprite(0, 0, 'car');

    // Set origin to center for proper rotation
    this.car.setOrigin(0.5, 0.5);

    // Scale the sprite to appropriate size
    // Adjust these values based on your sprite's actual size
    // CAR.WIDTH and CAR.HEIGHT are the desired display size
    this.car.setDisplaySize(CAR.WIDTH, CAR.HEIGHT);

    // Position car slightly behind the start/finish line
    // Use -0.005 progress (slightly before the line at 0.0)
    const startPos = this.track.getPositionAt(-0.005);
    this.car.setPosition(startPos.x, startPos.y);

    // Rotate car to match track direction
    // Add PI/2 because sprite points up but we want it to follow the track tangent
    this.car.setRotation(startPos.angle + Math.PI / 2);

    console.log('Car sprite created at start position');
  }

  update(_time, delta) {
    // M2: Physics-based movement (replaces M1 constant-speed)

    // Accumulate elapsed time from deltas (resets properly between scenes)
    this.elapsedTime += delta;

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
   * M7: Add celebration effects
   */
  onLapComplete() {
    // Use accumulated elapsed time (resets properly between games)
    const lapData = this.stats.completeLap(this.elapsedTime);

    console.log(`Lap ${lapData.lapNumber} complete: ${this.stats.formatTime(lapData.lapTime)}`);

    // M7: Play lap complete sound
    this.audioManager.playSFX(AUDIO.SFX.LAP_COMPLETE);

    // M7: Show celebration particles (confetti at finish line)
    const finishPos = this.track.getPositionAt(0);
    this.particleEffects.createLapCelebration(finishPos.x, finishPos.y);

    // Check if race is complete (3 laps)
    if (lapData.isFinalLap) {
      this.endRace();
    }
  }

  /**
   * End the race and transition to GameOver scene
   * M4: Pass statistics to results screen
   * M6: Stop speech recognition
   */
  endRace() {
    console.log('Race complete! Transitioning to GameOver scene');

    // M6: Stop speech recognition
    if (this.speech && this.speech.supported) {
      this.speech.stop();
    }

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
    const currentLapTime = this.stats.getCurrentLapTime(this.elapsedTime);
    const lastLapTime = this.stats.getLastLapTime();

    let timesText = `Current: ${this.stats.formatTime(currentLapTime)}\n`;

    if (lastLapTime !== null) {
      timesText += `Last: ${this.stats.formatTime(lastLapTime)}\n`;
    }

    if (this.stats.bestLapTime !== Infinity) {
      timesText += `Best: ${this.stats.formatTime(this.stats.bestLapTime)}`;
    }

    this.lapTimesText.setText(timesText);

    // Update total time (use stats.totalTime if race complete, otherwise use current elapsed time)
    const totalTime = this.stats.isRaceComplete ? this.stats.totalTime : this.elapsedTime;
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
