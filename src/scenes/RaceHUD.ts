import Phaser from 'phaser';
import { COLORS } from '../config/colors.js';
import { GAME } from '../config/constants.js';
import type StatisticsTracker from '../systems/StatisticsTracker';

/**
 * RaceHUD — owns every Phaser game object that lives "above" the track.
 *
 * Pulled out of GameScene so the scene can focus on orchestration
 * (physics tick, lap detection, audio cues). The HUD is a dumb view:
 * it never reads game state, only takes data via update() / show*().
 *
 * Lifecycle:
 *   const hud = new RaceHUD(scene);
 *   hud.create();                     // build display objects
 *   hud.hideProblemArea();            // during countdown
 *   hud.runCountdown(audioManager).then(() => { ... });
 *   hud.showProblemArea();
 *   hud.update({ stats, elapsedTime, velocity });   // each frame
 *   hud.flashCorrect(answer);
 *   hud.flashTimeout(answer);
 *   hud.destroy();                    // on scene shutdown
 *
 * The class deliberately does not own input — buttons forward callbacks
 * via setOnRestart() / setOnAbort().
 */

export interface HUDFrameData {
  stats: StatisticsTracker;
  elapsedTime: number;
  velocity: number;
}

const SCOREBOARD = {
  X: 400,
  Y: 370,
  WIDTH: 460,
  HEIGHT: 260,
  CORNER_RADIUS: 15,
} as const;

const TIMER_BAR_WIDTH = 400;

export default class RaceHUD {
  private scene: Phaser.Scene;

  // Scoreboard
  private scoreboardBg!: Phaser.GameObjects.Graphics;
  private scoreboardBorder!: Phaser.GameObjects.Graphics;

  // Problem area
  private problemText!: Phaser.GameObjects.Text;
  private timerBarBg!: Phaser.GameObjects.Rectangle;
  private timerBarFill!: Phaser.GameObjects.Rectangle;
  private answerText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  // Top HUD
  private lapText!: Phaser.GameObjects.Text;
  private answersText!: Phaser.GameObjects.Text;
  private lapTimesText!: Phaser.GameObjects.Text;
  private totalTimeText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;

  // Optional / mode-dependent
  private micStatusText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private debugText!: Phaser.GameObjects.Text;
  private debugVisible = false;

  // Callbacks
  private onRestart: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ─── Construction ───────────────────────────────────────────────────

  create(): void {
    this.createScoreboard();
    this.createProblemArea();
    this.createTopHUD();
    this.createSpeedAndDebug();
    this.createRestartButton();
  }

  private createScoreboard(): void {
    const { X, Y, WIDTH, HEIGHT, CORNER_RADIUS } = SCOREBOARD;
    const left = X - WIDTH / 2;
    const top = Y - HEIGHT / 2;

    this.scoreboardBg = this.scene.add.graphics();
    this.scoreboardBg.fillStyle(0x2a2a2a, 1);
    this.scoreboardBg.fillRoundedRect(left, top, WIDTH, HEIGHT, CORNER_RADIUS);

    this.scoreboardBorder = this.scene.add.graphics();
    this.scoreboardBorder.lineStyle(4, 0xffff00);
    this.scoreboardBorder.strokeRoundedRect(left, top, WIDTH, HEIGHT, CORNER_RADIUS);
  }

  private createProblemArea(): void {
    this.problemText = this.scene.add
      .text(400, 300, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.timerBarBg = this.scene.add.rectangle(400, 370, TIMER_BAR_WIDTH, 20, 0x333333);
    this.timerBarFill = this.scene.add
      .rectangle(400, 370, TIMER_BAR_WIDTH, 20, COLORS.TIMER_GREEN)
      .setOrigin(0.5);

    this.answerText = this.scene.add
      .text(400, 450, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.feedbackText = this.scene.add
      .text(400, 450, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private createTopHUD(): void {
    this.lapText = this.scene.add.text(20, 20, `Tour: 1/${GAME.LAPS_TO_COMPLETE}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });

    this.answersText = this.scene.add.text(20, 50, 'Correct: 0 / 0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    });

    this.lapTimesText = this.scene.add
      .text(780, 20, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'right',
      })
      .setOrigin(1, 0);

    // Total time — prominent, centered above the scoreboard.
    this.totalTimeText = this.scene.add
      .text(400, 215, '0.000s', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  private createSpeedAndDebug(): void {
    this.speedText = this.scene.add.text(20, 760, 'Speed: 0.00', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
    });

    this.debugText = this.scene.add
      .text(10, 650, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 8, y: 8 },
      })
      .setDepth(1000)
      .setVisible(false);
  }

  private createRestartButton(): void {
    const button = this.scene.add
      .text(760, 110, '[ ↻ ]', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: '#ff6666',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setColor('#ff0000');
      button.setScale(1.1);
      this.scene.events.emit('hud:button-hover');
    });
    button.on('pointerout', () => {
      button.setColor('#ff6666');
      button.setScale(1.0);
    });
    button.on('pointerdown', () => {
      this.scene.events.emit('hud:button-click');
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => this.requestRestart(),
      });
    });

    this.restartButton = button;
  }

  /** Wire restart confirmation. The scene supplies the actual restart action. */
  setOnRestart(handler: () => void): void {
    this.onRestart = handler;
  }

  private requestRestart(): void {
    // confirm() is a synchronous browser dialog — kept here because the
    // existing UX uses it. Replacing with a Phaser modal is a Phase 2 job.
    const confirmed = confirm('Abandonner la course et retourner au menu?');
    if (confirmed && this.onRestart) this.onRestart();
  }

  // ─── Visibility ─────────────────────────────────────────────────────

  hideProblemArea(): void {
    this.problemText.setVisible(false);
    this.timerBarBg.setVisible(false);
    this.timerBarFill.setVisible(false);
    this.answerText.setVisible(false);
    this.totalTimeText.setVisible(false);
  }

  showProblemArea(): void {
    this.problemText.setVisible(true);
    this.timerBarBg.setVisible(true);
    this.timerBarFill.setVisible(true);
    this.answerText.setVisible(true);
    this.totalTimeText.setVisible(true);
  }

  // ─── Problem display ────────────────────────────────────────────────

  setProblemText(text: string): void {
    this.problemText.setText(text);
  }

  /** Scale-and-fade-in for a fresh problem. */
  animateProblemIn(text: string): void {
    this.problemText.setText(text);
    this.problemText.setAlpha(0);
    this.problemText.setScale(0.8);
    this.scene.tweens.add({
      targets: this.problemText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  /** Reset opacity/scale in case the slot animation was used last problem. */
  resetProblemTransform(): void {
    this.problemText.setAlpha(1);
    this.problemText.setScale(1);
  }

  // ─── Answer buffer display ──────────────────────────────────────────

  setAnswerText(value: string, color: string = '#ffff00'): void {
    this.answerText.setText(value);
    this.answerText.setColor(color);
  }

  clearAnswerText(): void {
    this.answerText.setText('');
  }

  // ─── Timer bar ──────────────────────────────────────────────────────

  updateTimerBar(remainingPercent: number): void {
    this.timerBarFill.width = TIMER_BAR_WIDTH * remainingPercent;

    if (remainingPercent > 0.5) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_GREEN);
    } else if (remainingPercent > 0.25) {
      this.timerBarFill.setFillStyle(COLORS.TIMER_YELLOW);
    } else {
      this.timerBarFill.setFillStyle(COLORS.TIMER_RED);
    }
  }

  // ─── Feedback ───────────────────────────────────────────────────────

  /** Pop-in green feedback ("Bravo! +N boost"). */
  showCorrectFeedback(message: string): void {
    this.feedbackText.setText(message);
    this.feedbackText.setColor('#00ff00');
    this.feedbackText.setScale(0.8);
    this.scene.tweens.add({
      targets: this.feedbackText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /** Orange "time's up — answer was N" message. */
  showTimeoutFeedback(correctAnswer: number): void {
    this.feedbackText.setText(`Temps écoulé! → ${correctAnswer}`);
    this.feedbackText.setColor('#ff6600');
  }

  clearFeedback(): void {
    this.feedbackText.setText('');
    this.feedbackText.setScale(1);
  }

  /** Blue "passing through" answer that grows and fades — celebration only. */
  playCorrectAnswerAnimation(answer: number): void {
    const ghost = this.scene.add
      .text(400, 430, String(answer), {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: '#00aaff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.scene.tweens.add({
      targets: ghost,
      scale: 3.5,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  // ─── Mic status (voice mode only) ───────────────────────────────────

  showMicStatus(): void {
    this.micStatusText = this.scene.add
      .text(400, 530, '🎤 Écoute...', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#555555',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
  }

  // ─── Per-frame update ───────────────────────────────────────────────

  update(data: HUDFrameData): void {
    const { stats, elapsedTime, velocity } = data;

    this.lapText.setText(`Tour: ${stats.currentLap}/${GAME.LAPS_TO_COMPLETE}`);
    this.answersText.setText(
      `Correct: ${stats.correctAnswers} / ${stats.totalProblemsPresented}`
    );

    const currentLapTime = stats.getCurrentLapTime(elapsedTime);
    const lastLapTime = stats.getLastLapTime();

    let timesText = `Actuel: ${stats.formatTime(currentLapTime)}\n`;
    if (lastLapTime !== null) {
      timesText += `Dernier: ${stats.formatTime(lastLapTime)}\n`;
    }
    if (stats.bestLapTime !== Infinity) {
      timesText += `Meilleur: ${stats.formatTime(stats.bestLapTime)}`;
    }
    this.lapTimesText.setText(timesText);

    const totalTime = stats.isRaceComplete ? stats.totalTime : elapsedTime;
    this.totalTimeText.setText(stats.formatTime(totalTime));

    this.speedText.setText(`Speed: ${velocity.toFixed(2)}`);
  }

  // ─── Debug overlay ──────────────────────────────────────────────────

  toggleDebug(): void {
    this.debugVisible = !this.debugVisible;
    this.debugText.setVisible(this.debugVisible);
  }

  setDebugText(lines: string[]): void {
    if (!this.debugVisible) return;
    this.debugText.setText(lines.join('\n'));
  }

  isDebugVisible(): boolean {
    return this.debugVisible;
  }

  // ─── Cleanup ────────────────────────────────────────────────────────

  destroy(): void {
    // Phaser destroys most child objects on scene shutdown automatically;
    // we explicitly tear down graphics-typed objects since they were
    // historically a source of leaks in this scene.
    this.scoreboardBg?.destroy();
    this.scoreboardBorder?.destroy();
    this.micStatusText?.destroy();
    this.restartButton?.destroy();
  }
}
