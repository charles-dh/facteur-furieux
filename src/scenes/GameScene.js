import Phaser from "phaser";
import { COLORS } from "../config/colors.js";
import { TRACK, CAR, PHYSICS, TIMING } from "../config/constants.js";
import { AUDIO } from "../config/audioConfig.js";
import Track from "../systems/Track.js";
import VehiclePhysics from "../systems/VehiclePhysics.js";
import MathProblem from "../systems/MathProblem.js";
import StatisticsTracker from "../systems/StatisticsTracker.js";
import RaceState from "../systems/RaceState.js";
import RaceHUD from "./RaceHUD.js";
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

    // Race state machine — single source of truth for phase + answer buffer.
    // Replaces the previous scatter of booleans (raceStarted, answerSubmitted,
    // processingAnswer, timeoutHandled, etc).
    this.raceState = new RaceState();

    // Math problem system
    this.mathProblem = new MathProblem(this.selectedTables);

    // HUD owns every Phaser display object that lives above the track.
    this.hud = new RaceHUD(this);
    this.hud.create();
    this.hud.setOnRestart(() => this.restartGame());

    // Forward HUD button events to audio. Decoupling means the HUD knows
    // nothing about AudioManager.
    this.events.on('hud:button-hover', () => this.audioManager.playSFX(AUDIO.SFX.MENU_HOVER));
    this.events.on('hud:button-click', () => this.audioManager.playSFX(AUDIO.SFX.MENU_CLICK));

    // ESC also aborts to menu.
    this.input.keyboard.on('keydown-ESC', () => {
      const confirmed = confirm('Abandonner la course et retourner au menu?');
      if (confirmed) this.restartGame();
    });

    // Debug toggle.
    this.input.keyboard.on('keydown-D', () => this.hud.toggleDebug());

    this.setupAnswerInput();

    // Scene shutdown cleanup — keyboard listeners + audio + particles + HUD.
    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-D');
      this.input.keyboard.off('keydown-ESC');
      this.input.keyboard.off('keydown-BACKSPACE');
      this.input.keyboard.off('keydown-ENTER');
      this.input.keyboard.off('keydown');

      if (this.speech && this.speech.supported) {
        this.speech.stop();
        this.speech = null;
      }
      this.particleEffects?.destroyAll();
      if (this.boostEmitter) {
        this.boostEmitter.destroy();
        this.boostEmitter = null;
      }
      this.hud?.destroy();
    });

    // Speech recognition (voice mode only)
    this.speech = new FrenchSpeechRecognition();

    if (this.inputMode === "voice" && this.speech.supported) {
      this.speech.onNumberRecognized = (number) => this.handleSpeechNumber(number);
      this.speech.onInterimResult = (text) => this.hud.setAnswerText(text || "_");
      this.speech.onError = (error) => console.error("Speech error:", error);
      this.speech.start();

      this.hud.showMicStatus();
    } else if (this.inputMode === "voice" && !this.speech.supported) {
      console.warn("Speech recognition not supported in this browser");
    }

    // Play countdown before starting the race
    this.raceState.startCountdown();
    this.playCountdownSequence();
  }

  /**
   * Handle speech-recognized number(s).
   * Checks if any recognized number matches the expected answer.
   */
  handleSpeechNumber(numbers) {
    if (!this.raceState.isAcceptingAnswers()) return;

    // Find the correct answer in the recognized sequence. We only auto-submit
    // when the player actually says the right number — wrong utterances are
    // ignored (the player just keeps trying).
    const expectedAnswer = this.mathProblem.currentProblem?.answer;
    let correctNumber = null;

    for (const number of numbers) {
      if (number === expectedAnswer) {
        correctNumber = number;
        break;
      }
    }

    if (correctNumber === null) return;

    this.raceState.setAnswer(String(correctNumber));
    this.hud.setAnswerText(this.raceState.currentAnswer);

    // Lock further submissions and gag stale audio that may still arrive.
    if (this.speech && this.speech.supported) {
      this.speech.setCooldown(500);
    }

    this.submitAnswer();
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
   * Setup keyboard input for answering problems.
   * Only active in keyboard mode (voice mode uses speech callbacks).
   */
  setupAnswerInput() {
    if (this.inputMode !== "keyboard") return;

    this.input.keyboard.on("keydown", (event) => {
      if (event.key >= "0" && event.key <= "9") {
        this.raceState.appendDigit(event.key);
        this.hud.setAnswerText(this.raceState.currentAnswer || "_");
      }
    });

    this.input.keyboard.on("keydown-BACKSPACE", () => {
      this.raceState.popDigit();
      this.hud.setAnswerText(this.raceState.currentAnswer || "_");
    });

    this.input.keyboard.on("keydown-ENTER", () => this.submitAnswer());
  }

  /**
   * Play a traffic light countdown before the race starts.
   * Three horizontal lights: Red→Yellow→Green with 3-2-1-GO sequence.
   */
  playCountdownSequence() {
    const centerX = 400;
    const centerY = 370;

    // Three horizontal circles inside the scoreboard
    const lightRadius = 30;
    const lightSpacing = 80;
    const redLight = this.add.circle(centerX - lightSpacing, centerY, lightRadius, 0x333333);
    const yellowLight = this.add.circle(centerX, centerY, lightRadius, 0x333333);
    const greenLight = this.add.circle(centerX + lightSpacing, centerY, lightRadius, 0x333333);

    // Countdown number (large, above the lights)
    const countdownText = this.add
      .text(centerX, centerY - 70, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Hide problem UI elements during countdown
    this.hud.hideProblemArea();

    // Strict 800ms intervals for even rhythm
    const interval = 800;

    // Step 1: Red light
    this.time.delayedCall(interval, () => {
      redLight.setFillStyle(0xff0000);
      countdownText.setText("3");
      countdownText.setColor("#ff0000");
      this.audioManager.playSFX(AUDIO.SFX.COUNTDOWN_TICK);
    });

    // Step 2: Yellow light
    this.time.delayedCall(interval * 2, () => {
      yellowLight.setFillStyle(0xffff00);
      countdownText.setText("2");
      countdownText.setColor("#ffff00");
      this.audioManager.playSFX(AUDIO.SFX.COUNTDOWN_TICK);
    });

    // Step 3: Green light
    this.time.delayedCall(interval * 3, () => {
      greenLight.setFillStyle(0x00ff00);
      countdownText.setText("1");
      countdownText.setColor("#00ff00");
      this.audioManager.playSFX(AUDIO.SFX.COUNTDOWN_TICK);
    });

    // Step 4: GO! (same interval)
    this.time.delayedCall(interval * 4, () => {
      countdownText.setText("GO!");
      countdownText.setColor("#00ff00");
      countdownText.setFontSize("40px");
      this.audioManager.playSFX(AUDIO.SFX.GAME_START);

      // Flash all lights green
      redLight.setFillStyle(0x00ff00);
      yellowLight.setFillStyle(0x00ff00);

      // Animate GO! text out
      this.tweens.add({
        targets: countdownText,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        ease: "Quad.easeOut",
      });
    });

    // Step 5: Clean up and start race
    this.time.delayedCall(interval * 4 + 500, () => {
      redLight.destroy();
      yellowLight.destroy();
      greenLight.destroy();
      countdownText.destroy();

      // Show problem UI
      this.hud.showProblemArea();

      // Start the race with departure board animation for first problem
      this.raceState.startRace();
      this.stats.startRace(0);
      this.startNewProblem(true);
    });
  }

  /**
   * Generate a new problem and reset answer state
   */
  startNewProblem(useSlotAnimation = false) {
    this.mathProblem.generate();
    // Pre-fill timer so the timeout detector doesn't fire before startTimer().
    // The timer is "armed" but inactive — beginAnswering() flips both at once.
    this.mathProblem.timer = this.mathProblem.timerMax;

    // RaceState transitions to awaitingProblem; answer buffer cleared.
    this.raceState.showProblem();

    const p = this.mathProblem.currentProblem;
    const finalText = `${p.a} × ${p.b} = ?`;

    // Schedules the read-delay → beginAnswering transition.
    const armProblemTimer = (extraDelay = 0) => {
      this.time.delayedCall(extraDelay + TIMING.PROBLEM_READ_DELAY, () => {
        this.stats.recordProblemPresented();
        this.mathProblem.startTimer();
        this.raceState.beginAnswering();
      });
    };

    if (useSlotAnimation) {
      // Airport departure board animation: cycle random problems before settling.
      const tables = this.selectedTables;
      const cycleCount = 6;
      const cycleInterval = 60; // ms between flashes

      this.hud.resetProblemTransform();

      for (let i = 0; i < cycleCount; i++) {
        this.time.delayedCall(i * cycleInterval, () => {
          const randTable = tables[Math.floor(Math.random() * tables.length)];
          const randNum = Math.floor(Math.random() * 9) + 2;
          this.hud.setProblemText(`${randTable} × ${randNum} = ?`);
        });
      }

      this.time.delayedCall(cycleCount * cycleInterval, () => {
        this.hud.setProblemText(finalText);
        this.audioManager.playSFX(AUDIO.SFX.PROBLEM_APPEAR);
      });

      armProblemTimer(cycleCount * cycleInterval);
    } else {
      this.hud.animateProblemIn(finalText);
      this.audioManager.playSFX(AUDIO.SFX.PROBLEM_APPEAR);
      armProblemTimer();
    }

    // Reset visible answer + feedback (state was already cleared in showProblem).
    this.hud.clearFeedback();
    this.hud.setAnswerText("_");

    // Reset speech recognition cooldown for new problem
    if (this.speech && this.speech.supported) {
      this.speech.reset();
    }
  }

  /**
   * Submit the current answer and check correctness
   */
  submitAnswer() {
    const buffer = this.raceState.currentAnswer;
    if (!buffer) return;

    if (this.mathProblem.checkAnswer(buffer)) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  /**
   * Handle correct answer: boost car, play effects, schedule next problem
   */
  handleCorrectAnswer() {
    // Lock the phase so late speech callbacks for the same number don't
    // re-trigger this handler. acceptCorrect() is a no-op if we're not in
    // 'answering' (e.g. timeout fired on the same frame).
    if (!this.raceState.acceptCorrect()) return;

    const boostStrength = this.mathProblem.calculateBoost();
    this.vehiclePhysics.applyBoost(boostStrength);

    const correctAnswer = this.mathProblem.currentProblem.answer;
    this.hud.playCorrectAnswerAnimation(correctAnswer);
    this.triggerBoostExhaust(boostStrength);
    this.audioManager.startBoostSound(boostStrength);
    this.particleEffects.createCorrectFlash(400, 300);

    // Stop the problem timer and record stats.
    this.mathProblem.timerActive = false;
    this.stats.recordCorrectAnswer();

    this.hud.showCorrectFeedback(`Bravo! +${boostStrength.toFixed(2)} boost`);
    this.raceState.clearAnswer();
    this.hud.clearAnswerText();

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

    // Stay in 'answering' phase. Just clear the buffer and flash red — the
    // player can retry immediately and the timer keeps counting down.
    this.raceState.clearAnswer();
    this.hud.setAnswerText("_", "#ff0000");
  }

  /**
   * Handle timer timeout: play sound, show message, next problem
   */
  handleTimeout() {
    // Phase guard: markTimeout() returns false if we already transitioned
    // out of 'answering' (e.g. an answer landed on the same frame the
    // timer hit zero). Without it the player could see the correct-answer
    // animation AND the timeout message at once.
    if (!this.raceState.markTimeout()) return;

    this.audioManager.stopBoostSound();
    this.audioManager.playSFX(AUDIO.SFX.INCORRECT, 0.7);

    const correctAnswer = this.mathProblem.currentProblem.answer;
    this.hud.showTimeoutFeedback(correctAnswer);
    this.raceState.clearAnswer();
    this.hud.clearAnswerText();

    this.time.delayedCall(800, () => {
      this.startNewProblem(true);
    });
  }

  /**
   * Drive the HUD's timer bar from the math-problem timer, and detect timeout.
   * RaceState.markTimeout() guards against double-firing internally.
   */
  updateTimerBar() {
    this.hud.updateTimerBar(this.mathProblem.getRemainingPercent());

    if (
      this.mathProblem.timer <= 0 &&
      !this.mathProblem.timerActive &&
      this.raceState.isAcceptingAnswers()
    ) {
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

    // Position car at the start/finish line
    const startPos = this.track.getPositionAt(0);
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
    if (!this.raceState.isRaceActive()) return;

    this.raceState.advanceTime(delta);

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

    // Update HUD (lap counter, accuracy, timing, speed)
    this.hud.update({
      stats: this.stats,
      elapsedTime: this.raceState.elapsedTime,
      velocity: this.vehiclePhysics.velocity,
    });
    this.updateDebug();
  }

  /**
   * Detect lap completion by checking for position wrap-around
   */
  detectLapCompletion() {
    const currentPos = this.vehiclePhysics.position;
    if (this.raceState.previousPosition > 0.9 && currentPos < 0.1) {
      this.onLapComplete();
    }
    this.raceState.previousPosition = currentPos;
  }

  /**
   * Handle lap completion: record time, play effects, check for race end
   */
  onLapComplete() {
    const lapData = this.stats.completeLap(this.raceState.elapsedTime);

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
    this.raceState.finish();
    this.audioManager.stopBoostSound();

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
   * Compute and forward debug overlay text. The HUD owns visibility.
   */
  updateDebug() {
    if (!this.hud.isDebugVisible()) return;

    const p = this.vehiclePhysics;
    this.hud.setDebugText([
      "DEBUG MODE (Press D to toggle)",
      "─".repeat(35),
      `Velocity:     ${p.velocity.toFixed(4)} / ${p.maxSpeed}`,
      `Acceleration: ${p.acceleration.toFixed(6)}`,
      `Position:     ${p.position.toFixed(4)}`,
      `Friction:     ${PHYSICS.FRICTION}`,
      `Max Speed:    ${PHYSICS.MAX_SPEED} (${(1 / PHYSICS.MAX_SPEED).toFixed(1)}s/lap)`,
    ]);
  }
}
