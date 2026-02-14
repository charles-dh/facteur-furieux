import Phaser from "phaser";
import { COLORS } from "../config/colors.js";
import { TRACK, CAR, PHYSICS, TIMING, GAME } from "../config/constants.js";
import { AUDIO } from "../config/audioConfig.js";
import Track from "../systems/Track.js";
import VehiclePhysics from "../systems/VehiclePhysics.js";
import MathProblem from "../systems/MathProblem.js";
import StatisticsTracker from "../systems/StatisticsTracker.js";
import FrenchSpeechRecognition from "../systems/FrenchSpeechRecognition.js";
import AudioManager from "../systems/AudioManager.js";
import ParticleEffects from "../systems/ParticleEffects.js";
import SoundGenerator from "../systems/SoundGenerator.js";

/**
 * GameScene - Main gameplay scene
 *
 * Handles the core racing gameplay:
 * - Top-down circular track with car movement
 * - Physics simulation (velocity, friction, boost)
 * - Multiplication problem display and answer input (voice or keyboard)
 * - HUD with lap counter, accuracy, timing
 * - Audio and particle effects
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Initialize scene with configuration from MenuScene
   */
  init(data) {
    this.selectedTables = data.selectedTables || [2, 3, 4, 5];
    this.playerName = data.playerName || "Pilote";
    this.inputMode = data.inputMode || "voice";
  }

  /**
   * Preload assets: car sprite, boost sound, and procedural sound effects
   */
  preload() {
    this.load.image("car", "assets/red_car_top.png");
    this.load.audio(AUDIO.SFX.BOOST, "assets/sports_car_vroooom.mp3");

    // Generate all procedural sound effects and load as base64 data URIs
    const generator = new SoundGenerator();
    const sounds = [
      { key: AUDIO.SFX.ACCELERATE, buffer: generator.generateAccelerateSound() },
      { key: AUDIO.SFX.INCORRECT, buffer: generator.generateIncorrectSound() },
      { key: AUDIO.SFX.LAP_COMPLETE, buffer: generator.generateLapCompleteSound() },
      { key: AUDIO.SFX.PROBLEM_APPEAR, buffer: generator.generateProblemAppearSound() },
      { key: AUDIO.SFX.COUNTDOWN_TICK, buffer: generator.generateCountdownTickSound() },
      { key: AUDIO.SFX.MENU_CLICK, buffer: generator.generateMenuClickSound() },
      { key: AUDIO.SFX.MENU_HOVER, buffer: generator.generateMenuHoverSound() },
      { key: AUDIO.SFX.GAME_START, buffer: generator.generateGameStartSound() },
    ];

    sounds.forEach(({ key, buffer }) => {
      const dataUri = generator.bufferToBase64WAV(buffer);
      this.load.audio(key, dataUri);
    });

    this.load.on("loaderror", (file) => {
      console.error(`Failed to load: ${file.key}`, file);
    });
  }

  create() {
    // Background (grass green)
    this.add.rectangle(400, 400, 800, 800, COLORS.GRASS_GREEN);

    // Initialize audio and effects systems
    this.audioManager = new AudioManager(this);
    this.particleEffects = new ParticleEffects(this);

    // Unlock audio context on first user interaction (required by browsers)
    this.input.once("pointerdown", () => {
      if (this.sound.context) {
        this.sound.context.resume();
      }
    });

    // Create track, car, and physics
    this.track = new Track(this);
    this.renderTrack();
    this.createCar();
    this.vehiclePhysics = new VehiclePhysics();

    // Statistics and lap detection
    this.stats = new StatisticsTracker();
    this.previousPosition = 0;

    // Math problem system
    this.mathProblem = new MathProblem(this.selectedTables);

    // UI layers
    this.createProblemUI();
    this.createHUD();

    // Answer input state
    this.currentAnswer = "";
    this.answerSubmitted = false;
    this.processingAnswer = false;
    this.setupAnswerInput();

    // Speed indicator
    this.speedText = this.add.text(20, 760, "Speed: 0.00", {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 3,
    });

    // Debug mode (toggle with D key)
    this.debugMode = false;
    this.input.keyboard.on("keydown-D", () => {
      this.debugMode = !this.debugMode;
    });

    // Debug text panel (bottom-left corner, only visible in debug mode)
    this.debugText = this.add
      .text(10, 650, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 8, y: 8 },
      })
      .setDepth(1000);

    // Speech recognition (voice mode only)
    this.speech = new FrenchSpeechRecognition();

    if (this.inputMode === "voice" && this.speech.supported) {
      this.speech.onNumberRecognized = (number) => {
        this.handleSpeechNumber(number);
      };

      this.speech.onInterimResult = (text) => {
        if (this.answerText) {
          this.answerText.setText(text || "_");
          this.answerText.setColor("#ffff00");
        }
      };

      this.speech.onError = (error) => {
        console.error("Speech error:", error);
        if (this.micStatusText) {
          this.micStatusText.setText("🎤 Erreur");
          this.micStatusText.setColor("#ff0000");
        }
      };

      this.speech.start();

      // Microphone status indicator (below scoreboard)
      this.micStatusText = this.add
        .text(400, 530, "🎤 Écoute...", {
          fontFamily: '"Press Start 2P"',
          fontSize: "12px",
          color: "#555555",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);
    } else if (this.inputMode === "voice" && !this.speech.supported) {
      console.warn("Speech recognition not supported in this browser");
    }

    // Start first problem and race timer
    this.startNewProblem();
    this.raceStartTime = 0;
    this.stats.startRace(0);
    this.elapsedTime = 0;
  }

  /**
   * Handle speech-recognized number(s).
   * Checks if any recognized number matches the expected answer.
   */
  handleSpeechNumber(numbers) {
    if (this.processingAnswer) return;

    // Find the correct answer in the recognized sequence
    const expectedAnswer = this.mathProblem.currentProblem?.answer;
    let correctNumber = null;

    for (const number of numbers) {
      if (number === expectedAnswer) {
        correctNumber = number;
        break;
      }
    }

    // Ignore if no correct answer found
    if (correctNumber === null) return;

    // Display and submit the correct answer
    this.currentAnswer = String(correctNumber);
    this.answerText.setText(this.currentAnswer);

    this.answerSubmitted = true;
    this.processingAnswer = true;

    // Set speech cooldown to prevent lingering audio from triggering
    if (this.speech && this.speech.supported) {
      this.speech.setCooldown(500);
    }

    this.submitAnswer();
  }

  /**
   * Create HUD (Heads-Up Display)
   * Displays lap counter, accuracy, timing info, and restart button
   */
  createHUD() {
    // Top-left: Lap counter and accuracy
    this.lapText = this.add.text(20, 20, `Lap: 1/${GAME.LAPS_TO_COMPLETE}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });

    this.accuracyText = this.add.text(20, 50, "Accuracy: 0%", {
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 2,
    });

    this.answersText = this.add.text(20, 75, "Correct: 0 / 0", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 2,
    });

    // Top-right: Lap times
    this.lapTimesText = this.add
      .text(780, 20, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "right",
      })
      .setOrigin(1, 0);

    this.totalTimeText = this.add
      .text(780, 75, "Total: 0.000s", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#aaaaaa",
        stroke: "#000000",
        strokeThickness: 2,
        align: "right",
      })
      .setOrigin(1, 0);

    this.createRestartButton();
  }

  /**
   * Create restart button in top-right corner
   */
  createRestartButton() {
    const restartButton = this.add
      .text(760, 110, "[ ↻ ]", {
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
        color: "#ff6666",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    restartButton.setInteractive({ useHandCursor: true });

    restartButton.on("pointerover", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER);
      restartButton.setColor("#ff0000");
      restartButton.setScale(1.1);
    });

    restartButton.on("pointerout", () => {
      restartButton.setColor("#ff6666");
      restartButton.setScale(1.0);
    });

    restartButton.on("pointerdown", () => {
      this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK);
      this.tweens.add({
        targets: restartButton,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          const confirmed = confirm(
            "Abandonner la course et retourner au menu?"
          );
          if (confirmed) {
            this.restartGame();
          }
        },
      });
    });

    this.input.keyboard.on("keydown-ESC", () => {
      const confirmed = confirm("Abandonner la course et retourner au menu?");
      if (confirmed) {
        this.restartGame();
      }
    });
  }

  /**
   * Return to menu, stopping speech recognition if active
   */
  restartGame() {
    if (this.speech && this.speech.supported) {
      this.speech.stop();
    }
    this.scene.start("MenuScene");
  }

  /**
   * Create the central problem UI overlay:
   * scoreboard background, problem text, timer bar, answer display, feedback
   */
  createProblemUI() {
    const scoreboardWidth = 460;
    const scoreboardHeight = 260;
    const scoreboardX = 400;
    const scoreboardY = 370;
    const cornerRadius = 15;

    // Scoreboard background (dark grey with yellow border)
    this.scoreboardBg = this.add.graphics();
    this.scoreboardBg.fillStyle(0x2a2a2a, 1);
    this.scoreboardBg.fillRoundedRect(
      scoreboardX - scoreboardWidth / 2,
      scoreboardY - scoreboardHeight / 2,
      scoreboardWidth,
      scoreboardHeight,
      cornerRadius
    );

    this.scoreboardBorder = this.add.graphics();
    this.scoreboardBorder.lineStyle(4, 0xffff00);
    this.scoreboardBorder.strokeRoundedRect(
      scoreboardX - scoreboardWidth / 2,
      scoreboardY - scoreboardHeight / 2,
      scoreboardWidth,
      scoreboardHeight,
      cornerRadius
    );

    // Problem text (large, centered)
    this.problemText = this.add
      .text(400, 300, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Timer bar (background + fill)
    this.timerBarBg = this.add.rectangle(400, 370, 400, 20, 0x333333);
    this.timerBarFill = this.add
      .rectangle(400, 370, 400, 20, COLORS.TIMER_GREEN)
      .setOrigin(0.5);

    // Answer display (shows typed/spoken input)
    this.answerText = this.add
      .text(400, 450, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "24px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Feedback text (correct/timeout messages)
    this.feedbackText = this.add
      .text(400, 450, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#00ff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  /**
   * Setup keyboard input for answering problems.
   * Only active in keyboard mode (voice mode uses speech callbacks).
   */
  setupAnswerInput() {
    if (this.inputMode !== "keyboard") return;

    // Numeric input (0-9)
    this.input.keyboard.on("keydown", (event) => {
      if (event.key >= "0" && event.key <= "9") {
        this.currentAnswer += event.key;
        this.answerText.setText(this.currentAnswer || "_");
        this.answerText.setColor("#ffff00");
      }
    });

    // Backspace to delete digits
    this.input.keyboard.on("keydown-BACKSPACE", () => {
      this.currentAnswer = this.currentAnswer.slice(0, -1);
      this.answerText.setText(this.currentAnswer || "_");
    });

    // Enter to submit
    this.input.keyboard.on("keydown-ENTER", () => {
      this.submitAnswer();
    });
  }

  /**
   * Generate a new problem and reset answer state
   */
  startNewProblem() {
    this.mathProblem.generate();

    // Update problem text with animation
    const p = this.mathProblem.currentProblem;
    this.problemText.setText(`${p.a} × ${p.b} = ?`);
    this.problemText.setAlpha(0);
    this.problemText.setScale(0.8);
    this.tweens.add({
      targets: this.problemText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.audioManager.playSFX(AUDIO.SFX.PROBLEM_APPEAR);

    // Start timer after a short delay so the player can read the problem
    this.time.delayedCall(TIMING.PROBLEM_READ_DELAY, () => {
      this.mathProblem.startTimer();
    });

    // Reset answer state
    this.feedbackText.setText("");
    this.feedbackText.setScale(1);
    this.currentAnswer = "";
    this.answerText.setText("_");
    this.answerText.setColor("#ffff00");
    this.answerSubmitted = false;
    this.processingAnswer = false;
    this.timeoutHandled = false;

    // Reset speech recognition cooldown for new problem
    if (this.speech && this.speech.supported) {
      this.speech.reset();
    }
  }

  /**
   * Submit the current answer and check correctness
   */
  submitAnswer() {
    if (!this.currentAnswer) {
      this.processingAnswer = false;
      return;
    }

    const isCorrect = this.mathProblem.checkAnswer(this.currentAnswer);
    if (isCorrect) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  /**
   * Play "passing through" animation for correct answer.
   * Blue number grows and fades out.
   */
  playCorrectAnswerAnimation(answer) {
    const answerAnimation = this.add
      .text(400, 430, String(answer), {
        fontFamily: '"Press Start 2P"',
        fontSize: "24px",
        color: "#00aaff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: answerAnimation,
      scale: 3.5,
      alpha: 0,
      duration: 500,
      ease: "Quad.easeOut",
      onComplete: () => {
        answerAnimation.destroy();
      },
    });
  }

  /**
   * Handle correct answer: boost car, play effects, schedule next problem
   */
  handleCorrectAnswer() {
    // Calculate and apply boost
    const boostStrength = this.mathProblem.calculateBoost();
    this.vehiclePhysics.applyBoost(boostStrength);

    // Boost duration scales with strength (250ms–650ms)
    const boostDuration = Phaser.Math.Linear(
      250,
      650,
      Phaser.Math.Clamp(boostStrength, 0, 1)
    );

    // Visual and audio effects
    const correctAnswer = this.mathProblem.currentProblem.answer;
    this.playCorrectAnswerAnimation(correctAnswer);
    this.triggerBoostExhaust(boostStrength);
    this.audioManager.playBoostSound(boostStrength, boostDuration);
    this.particleEffects.createCorrectFlash(400, 300);

    // Stop problem timer and record stats
    this.mathProblem.timerActive = false;
    this.stats.recordCorrectAnswer();

    // Show feedback with animation
    this.feedbackText.setText(`Correct! +${boostStrength.toFixed(2)} boost`);
    this.feedbackText.setColor("#00ff00");
    this.feedbackText.setScale(0.8);
    this.tweens.add({
      targets: this.feedbackText,
      scale: 1,
      duration: 200,
      ease: "Back.easeOut",
    });

    // Clear answer display
    this.currentAnswer = "";
    this.answerText.setText("");

    // Schedule next problem
    this.time.delayedCall(TIMING.CORRECT_ANSWER_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Handle incorrect answer: record stats, let player retry.
   * No sound or screen shake — just a red flash on the answer text.
   */
  handleIncorrectAnswer() {
    this.stats.recordIncorrectAnswer();

    // Show red indicator briefly, then let player retry
    this.currentAnswer = "";
    this.answerText.setText("_");
    this.answerText.setColor("#ff0000");

    this.processingAnswer = false;
    // Timer continues — player can retry immediately
  }

  /**
   * Handle timer timeout: play sound, show message, next problem
   */
  handleTimeout() {
    this.audioManager.playSFX(AUDIO.SFX.INCORRECT, 0.7);

    this.feedbackText.setText("Time up!");
    this.feedbackText.setColor("#ff6600");

    this.currentAnswer = "";
    this.answerText.setText("");

    this.time.delayedCall(TIMING.TIMEOUT_DELAY, () => {
      this.startNewProblem();
    });
  }

  /**
   * Update timer bar width and color, and detect timeout
   */
  updateTimerBar() {
    const percent = this.mathProblem.getRemainingPercent();

    this.timerBarFill.width = 400 * percent;

    if (percent > 0.5) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_GREEN);
    } else if (percent > 0.25) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_YELLOW);
    } else {
      this.timerBarFill.setFillStyle(COLORS.TIMER_RED);
    }

    // Detect timeout: timer expired, no answer submitted, not already handled
    if (
      this.mathProblem.timer <= 0 &&
      !this.mathProblem.timerActive &&
      !this.answerSubmitted &&
      !this.timeoutHandled
    ) {
      this.timeoutHandled = true;
      this.handleTimeout();
    }
  }

  /**
   * Activate boost exhaust particles for a duration based on boost strength
   */
  triggerBoostExhaust(boostStrength) {
    if (!this.boostEmitter || boostStrength <= 0) return;

    const duration = Phaser.Math.Linear(
      250,
      650,
      Phaser.Math.Clamp(boostStrength, 0, 1)
    );
    this.boostEmitterTimer = Math.max(this.boostEmitterTimer, duration);
  }

  /**
   * Render the circular racing track with dashed lane divider and finish line
   */
  renderTrack() {
    const graphics = this.add.graphics();

    // Main track (thick gray circle)
    graphics.lineStyle(TRACK.WIDTH, COLORS.TRACK_GRAY);
    graphics.strokeCircle(400, 400, 320);

    // Dashed lane divider
    const dashLength = 15;
    const gapLength = 10;
    const middleRadius = 320;
    const centerX = 400;
    const centerY = 400;
    const circumference = 2 * Math.PI * middleRadius;
    const segmentLength = dashLength + gapLength;
    const numSegments = Math.floor(circumference / segmentLength);

    graphics.lineStyle(3, 0xffffff, 0.6);

    for (let i = 0; i < numSegments; i++) {
      const startAngle = ((i * segmentLength) / circumference) * Math.PI * 2;
      const endAngle = startAngle + (dashLength / circumference) * Math.PI * 2;

      graphics.beginPath();
      graphics.arc(
        centerX,
        centerY,
        middleRadius,
        startAngle - Math.PI / 2,
        endAngle - Math.PI / 2
      );
      graphics.strokePath();
    }

    // Start/finish line (white bar perpendicular to track at progress = 0)
    const startPos = this.track.getPositionAt(0);
    const startFinishRect = this.add.rectangle(
      startPos.x,
      startPos.y,
      5,
      TRACK.START_FINISH_HEIGHT,
      COLORS.TRACK_LINE_WHITE
    );
    startFinishRect.setRotation(startPos.angle);
  }

  /**
   * Create the car sprite and boost particle emitter
   */
  createCar() {
    this.car = this.add.sprite(0, 0, "car");
    this.car.setOrigin(0.5, 0.5);
    this.car.setDisplaySize(CAR.WIDTH, CAR.HEIGHT);

    // Position car slightly behind the start/finish line
    const startPos = this.track.getPositionAt(-0.005);
    this.car.setPosition(startPos.x, startPos.y);
    // Add PI/2 because sprite points up but track tangent assumes pointing right
    this.car.setRotation(startPos.angle + Math.PI / 2);

    // Create boost particle emitter (initially stopped)
    this.boostEmitter = this.particleEffects.createSpeedBoost(
      startPos.x,
      startPos.y
    );

    // Reusable vector for exhaust position calculation
    this.exhaustOffsetVec = new Phaser.Math.Vector2(0, 0);
    this.boostEmitterTimer = 0;

    // Dynamic angle callback: particles emit backwards from car
    this.boostEmitter.ops.angle.loadConfig({
      angle: {
        onEmit: () => {
          // Car rotation has +90° baked in; another +90° gives exhaust direction
          const backwardsAngleRadians = this.car.rotation + Math.PI / 2;
          const backwardsAngleDegrees = Phaser.Math.RadToDeg(backwardsAngleRadians);
          return backwardsAngleDegrees + Phaser.Math.Between(-15, 15);
        },
      },
    });

    this.boostEmitter.stop();
    this.boostEmitter.setVisible(false);
    this.boostEmitter.setDepth(1000);
  }

  update(_time, delta) {
    this.elapsedTime += delta;

    // Physics
    this.vehiclePhysics.update(delta);
    this.detectLapCompletion();

    // Problem timer
    this.mathProblem.updateTimer(delta);
    this.updateTimerBar();

    // Position car on track
    const position = this.track.getPositionAt(this.vehiclePhysics.position);
    this.car.setPosition(position.x, position.y);
    const carRotation = position.angle + Math.PI / 2;
    this.car.setRotation(carRotation);

    // Update boost emitter position (rear of car)
    const rearOffset = this.car.displayHeight / 2 + 15;
    this.exhaustOffsetVec.set(0, rearOffset).rotate(carRotation);
    this.boostEmitter.setPosition(
      position.x + this.exhaustOffsetVec.x,
      position.y + this.exhaustOffsetVec.y
    );

    // Manage boost emitter lifetime
    if (this.boostEmitterTimer > 0) {
      this.boostEmitterTimer -= delta;
      if (!this.boostEmitter.emitting) {
        this.boostEmitter.start();
        this.boostEmitter.setVisible(true);
      }
    } else if (this.boostEmitter.emitting) {
      this.boostEmitter.stop();
      this.boostEmitter.setVisible(false);
      this.audioManager.stopBoostSound();
    }

    // Update HUD
    this.speedText.setText(`Speed: ${this.vehiclePhysics.velocity.toFixed(2)}`);
    this.updateHUD();
    this.updateDebug();
  }

  /**
   * Detect lap completion by checking for position wrap-around
   */
  detectLapCompletion() {
    const currentPos = this.vehiclePhysics.position;
    if (this.previousPosition > 0.9 && currentPos < 0.1) {
      this.onLapComplete();
    }
    this.previousPosition = currentPos;
  }

  /**
   * Handle lap completion: record time, play effects, check for race end
   */
  onLapComplete() {
    const lapData = this.stats.completeLap(this.elapsedTime);

    this.audioManager.playSFX(AUDIO.SFX.LAP_COMPLETE);

    const finishPos = this.track.getPositionAt(0);
    this.particleEffects.createLapCelebration(finishPos.x, finishPos.y);

    if (lapData.isFinalLap) {
      this.endRace();
    }
  }

  /**
   * End the race: stop speech, transition to GameOverScene
   */
  endRace() {
    if (this.speech && this.speech.supported) {
      this.speech.stop();
    }

    this.time.delayedCall(500, () => {
      this.scene.start("GameOverScene", {
        results: this.stats.getResults(),
        playerName: this.playerName,
        selectedTables: this.selectedTables,
      });
    });
  }

  /**
   * Update HUD: lap counter, accuracy, timing displays
   */
  updateHUD() {
    this.lapText.setText(`Lap: ${this.stats.currentLap}/${GAME.LAPS_TO_COMPLETE}`);
    this.accuracyText.setText(`Accuracy: ${this.stats.getAccuracy()}%`);
    this.answersText.setText(
      `Correct: ${this.stats.correctAnswers} / ${this.stats.totalAnswers}`
    );

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

    const totalTime = this.stats.isRaceComplete
      ? this.stats.totalTime
      : this.elapsedTime;
    this.totalTimeText.setText(`Total: ${this.stats.formatTime(totalTime)}`);
  }

  /**
   * Update debug overlay with physics information (D key to toggle)
   */
  updateDebug() {
    if (!this.debugMode) {
      this.debugText.setVisible(false);
      return;
    }

    this.debugText.setVisible(true);
    const p = this.vehiclePhysics;

    const debugInfo = [
      "DEBUG MODE (Press D to toggle)",
      "─".repeat(35),
      `Velocity:     ${p.velocity.toFixed(4)} / ${p.maxSpeed}`,
      `Acceleration: ${p.acceleration.toFixed(6)}`,
      `Position:     ${p.position.toFixed(4)}`,
      `Friction:     ${PHYSICS.FRICTION}`,
      `Max Speed:    ${PHYSICS.MAX_SPEED} (${(1 / PHYSICS.MAX_SPEED).toFixed(1)}s/lap)`,
    ].join("\n");

    this.debugText.setText(debugInfo);
  }
}
