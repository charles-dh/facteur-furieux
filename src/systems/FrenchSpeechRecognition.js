import { parseSpokenNumbers } from './frenchNumberParser.js';

/**
 * French Speech Recognition wrapper around the Web Speech API.
 *
 * Responsibilities (this class):
 *  - Lifecycle: start/stop/auto-restart on transient errors
 *  - Cooldowns: ignore stale audio after a problem changes
 *  - Duplicate suppression: block repeat interim results within 500ms
 *
 * The actual text → number parsing lives in frenchNumberParser.ts so it
 * can be unit tested without mocking the browser API.
 *
 * Limitations:
 *  - Chrome/Edge only (Web Speech API support)
 *  - Requires HTTPS in production (mic permission)
 *  - Recognition accuracy varies with microphone quality and accent
 */
export default class FrenchSpeechRecognition {
  constructor() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SpeechRecognition();

    // Configure for French
    this.recognition.lang = 'fr-FR';

    // Continuous listening (doesn't stop after first result)
    this.recognition.continuous = true;

    // Get interim results (real-time feedback)
    this.recognition.interimResults = true;

    // Multiple interpretation alternatives
    this.recognition.maxAlternatives = 3;

    // Callbacks
    this.onNumberRecognized = null; // Callback when number detected
    this.onInterimResult = null;    // Callback for interim text display
    this.onError = null;             // Callback for errors

    // State
    this.isListening = false;
    this.lastRecognizedNumber = null; // Track last number to avoid duplicates
    this.lastRecognitionTime = 0; // Timestamp of last recognition
    this.ignoreUntil = 0; // Ignore speech input until this timestamp (for cooldown periods)

    // Setup event handlers
    this.setupEventHandlers();

  }

  /**
   * Setup Web Speech API event handlers
   */
  setupEventHandlers() {
    this.recognition.onresult = (event) => {
      const timestamp = performance.now();

      // Check if we're in cooldown period (ignore all input)
      if (timestamp < this.ignoreUntil) {
        return;
      }

      // Get the latest result
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim().toLowerCase();

      if (result.isFinal) {
        // Final result - parse as number(s)
        const numbers = this.parseNumber(transcript);

        if (numbers.length > 0 && this.onNumberRecognized) {
          // Call callback with array of numbers
          this.lastRecognitionTime = timestamp;
          this.onNumberRecognized(numbers);
        }
      } else {
        // Interim result - try to parse as number(s) for fast response
        const numbers = this.parseNumber(transcript);

        if (numbers.length > 0 && this.onNumberRecognized) {
          // Fix: Prevent duplicate interim results from triggering multiple recognitions
          // Check if this is a duplicate within a short time window
          const timeSinceLastRecognition = timestamp - this.lastRecognitionTime;

          if (timeSinceLastRecognition < 500) {
            // Same utterance window - check if it's the same number
            if (numbers.length > 0 && numbers[0] === this.lastRecognizedNumber) {
              // Show interim feedback but don't trigger recognition callback
              if (this.onInterimResult) {
                this.onInterimResult(transcript);
              }
              return;
            }
          }

          // New number or enough time has passed - accept it
          this.lastRecognitionTime = timestamp;
          this.lastRecognizedNumber = numbers[0];
          this.onNumberRecognized(numbers);
        }

        // Also show interim feedback
        if (this.onInterimResult) {
          this.onInterimResult(transcript);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (this.onError) {
        this.onError(event.error);
      }

      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are transient errors, restart automatically
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we're supposed to be listening
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  /**
   * Start listening
   */
  start() {
    if (!this.supported) {
      console.warn('Cannot start: Speech recognition not supported');
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.supported) return;

    this.isListening = false;
    this.recognition.stop();
  }

  /**
   * Reset recognition state (called when new problem starts)
   * Sets a cooldown to ignore lingering speech from previous problem
   *
   * Note: Does NOT reset lastRecognizedNumber/Time - this allows duplicate detection
   * to persist across problems and catch delayed interim results from previous answers
   *
   * @param {number} cooldownMs - Milliseconds to ignore speech input (default: 800ms)
   */
  reset(cooldownMs = 800) {
    // DO NOT reset lastRecognizedNumber/lastRecognitionTime here!
    // Keeping them allows us to catch delayed results from the previous problem
    // The 2-second timeout in the duplicate check handles legitimate repeated answers
    this.ignoreUntil = performance.now() + cooldownMs;
  }

  /**
   * Set a cooldown period to ignore speech input
   * Useful after accepting an answer to prevent trailing audio from triggering
   *
   * @param {number} durationMs - Milliseconds to ignore speech input
   */
  setCooldown(durationMs) {
    this.ignoreUntil = performance.now() + durationMs;
  }

  /**
   * Parse French number text into numeric value(s).
   * Delegates to the pure parseSpokenNumbers() helper — kept here as an
   * instance method for backward compat with existing call sites.
   *
   * @param {string} text - Spoken text in French
   * @returns {number[]} Array of numeric values (empty if no valid numbers found)
   */
  parseNumber(text) {
    return parseSpokenNumbers(text);
  }
}
