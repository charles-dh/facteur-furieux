import Phaser from 'phaser';
import type FrenchSpeechRecognition from './FrenchSpeechRecognition';

/**
 * InputController — unified keyboard + voice input for the race.
 *
 * Replaces hand-wired listeners scattered across GameScene. The scene
 * subscribes to events via `on()`; the controller owns the listeners
 * and tears them down on shutdown.
 *
 * Events:
 *   'digit'     (digit: string)   — keyboard 0-9 pressed
 *   'backspace' ()                — keyboard Backspace
 *   'submit'    ()                — keyboard Enter
 *   'voiceMatch'(answer: number)  — recognized speech matched the
 *                                   expected answer (filtered through
 *                                   the getExpectedAnswer hook)
 *   'voiceInterim'(text: string)  — interim speech transcript
 *
 * The controller intentionally does not know about the race state
 * machine. It accepts a `gate` predicate so the consumer (GameScene)
 * decides whether each input is currently meaningful. Gate is checked
 * on every input — late voice callbacks during a transition phase get
 * dropped at the source.
 */

export type InputMode = 'voice' | 'keyboard';

interface Options {
  scene: Phaser.Scene;
  mode: InputMode;
  speech: FrenchSpeechRecognition | null;
  /** Returns true while the game wants to accept input. */
  isAccepting: () => boolean;
  /** Returns the expected answer for voice matching, or null if N/A. */
  getExpectedAnswer: () => number | null;
}

type EventName = 'digit' | 'backspace' | 'submit' | 'voiceMatch' | 'voiceInterim';

export default class InputController {
  private scene: Phaser.Scene;
  private mode: InputMode;
  private speech: FrenchSpeechRecognition | null;
  private isAccepting: () => boolean;
  private getExpectedAnswer: () => number | null;

  private emitter = new Phaser.Events.EventEmitter();
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private backspaceHandler: (() => void) | null = null;
  private enterHandler: (() => void) | null = null;

  constructor(opts: Options) {
    this.scene = opts.scene;
    this.mode = opts.mode;
    this.speech = opts.speech;
    this.isAccepting = opts.isAccepting;
    this.getExpectedAnswer = opts.getExpectedAnswer;

    this.attachKeyboard();
    this.attachVoice();
  }

  on(event: EventName, fn: (...args: any[]) => void): this {
    this.emitter.on(event, fn);
    return this;
  }

  destroy(): void {
    if (this.keyboardHandler) {
      this.scene.input.keyboard?.off('keydown', this.keyboardHandler);
    }
    if (this.backspaceHandler) {
      this.scene.input.keyboard?.off('keydown-BACKSPACE', this.backspaceHandler);
    }
    if (this.enterHandler) {
      this.scene.input.keyboard?.off('keydown-ENTER', this.enterHandler);
    }
    if (this.speech?.supported) {
      this.speech.onNumberRecognized = null;
      this.speech.onInterimResult = null;
      this.speech.onError = null;
    }
    this.emitter.removeAllListeners();
  }

  // ─── Keyboard ───────────────────────────────────────────────────────

  private attachKeyboard(): void {
    // Keyboard input is only wired in keyboard mode. We deliberately do
    // NOT gate via isAccepting() here — the consumer can decide whether
    // digits buffered during the read-delay should count or be discarded.
    // Voice input is gated, because late callbacks during a transition
    // phase are common and need to be dropped at the source.
    if (this.mode !== 'keyboard') return;

    this.keyboardHandler = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9') {
        this.emitter.emit('digit', event.key);
      }
    };
    this.backspaceHandler = () => this.emitter.emit('backspace');
    this.enterHandler = () => this.emitter.emit('submit');

    this.scene.input.keyboard?.on('keydown', this.keyboardHandler);
    this.scene.input.keyboard?.on('keydown-BACKSPACE', this.backspaceHandler);
    this.scene.input.keyboard?.on('keydown-ENTER', this.enterHandler);
  }

  // ─── Voice ──────────────────────────────────────────────────────────

  private attachVoice(): void {
    if (this.mode !== 'voice' || !this.speech?.supported) return;

    this.speech.onNumberRecognized = (numbers: number[]) => {
      if (!this.isAccepting()) return;
      const expected = this.getExpectedAnswer();
      if (expected === null) return;

      // Only emit if the player actually said the right number. Wrong
      // utterances are silently ignored — the player keeps trying. This
      // is intentional: kids shouting random numbers shouldn't penalize
      // accuracy stats or trigger wrong-answer feedback.
      for (const n of numbers) {
        if (n === expected) {
          this.emitter.emit('voiceMatch', n);
          return;
        }
      }
    };

    this.speech.onInterimResult = (text: string) => {
      if (!this.isAccepting()) return;
      this.emitter.emit('voiceInterim', text);
    };

    this.speech.onError = (error: any) => {
      console.error('Speech error:', error);
    };

    this.speech.start();
  }
}
