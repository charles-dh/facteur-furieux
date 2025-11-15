/**
 * French Speech Recognition System
 *
 * Uses Web Speech API to recognize spoken French numbers (2-100)
 * Provides voice-controlled answer input for multiplication problems
 *
 * Features:
 * - Continuous listening during gameplay
 * - French number parsing (text → numeric)
 * - Homophone handling (six/sis, cent/sang)
 * - Browser compatibility detection
 * - Microphone permission handling
 *
 * Limitations:
 * - Chrome/Edge only (Web Speech API support)
 * - Requires HTTPS in production (mic permissions)
 * - Recognition accuracy varies with microphone quality and accent
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

    console.log('FrenchSpeechRecognition initialized');
  }

  /**
   * Setup Web Speech API event handlers
   */
  setupEventHandlers() {
    this.recognition.onresult = (event) => {
      const timestamp = performance.now();

      // Check if we're in cooldown period (ignore all input)
      if (timestamp < this.ignoreUntil) {
        console.log(`[${timestamp.toFixed(2)}ms] SPEECH API: IGNORING input during cooldown (${(this.ignoreUntil - timestamp).toFixed(0)}ms remaining)`);
        return;
      }

      // Get the latest result
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim().toLowerCase();

      if (result.isFinal) {
        console.log(`[${timestamp.toFixed(2)}ms] SPEECH API: Final result received: "${transcript}"`);
        // Final result - parse as number
        const number = this.parseNumber(transcript);

        if (number !== null && this.onNumberRecognized) {
          // Only trigger if we haven't already recognized this number from interim
          const timeSinceLastRecognition = timestamp - this.lastRecognitionTime;
          if (number !== this.lastRecognizedNumber || timeSinceLastRecognition > 2000) {
            console.log(`[${performance.now().toFixed(2)}ms] SPEECH API: Calling onNumberRecognized(${number}) [FINAL]`);
            this.lastRecognizedNumber = number;
            this.lastRecognitionTime = timestamp;
            this.onNumberRecognized(number);
          } else {
            console.log(`[${performance.now().toFixed(2)}ms] SPEECH API: Skipping duplicate final result for ${number}`);
          }
        } else {
          console.log(`[${performance.now().toFixed(2)}ms] SPEECH API: Could not parse number from "${transcript}"`);
        }
      } else {
        // Interim result - try to parse as number for fast response
        console.log(`[${timestamp.toFixed(2)}ms] SPEECH API: Interim result: "${transcript}"`);

        // Try to parse interim result as number
        const number = this.parseNumber(transcript);

        if (number !== null && this.onNumberRecognized) {
          // Accept interim result if it's a valid number and different from last
          const timeSinceLastRecognition = timestamp - this.lastRecognitionTime;
          if (number !== this.lastRecognizedNumber || timeSinceLastRecognition > 2000) {
            console.log(`[${performance.now().toFixed(2)}ms] SPEECH API: Calling onNumberRecognized(${number}) [INTERIM - FAST]`);
            this.lastRecognizedNumber = number;
            this.lastRecognitionTime = timestamp;
            this.onNumberRecognized(number);
          }
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
      console.log('Speech recognition started');
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
    console.log('Speech recognition stopped');
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
    console.log(`Speech recognition cooldown set: ${cooldownMs}ms (keeping duplicate tracking)`);
  }

  /**
   * Set a cooldown period to ignore speech input
   * Useful after accepting an answer to prevent trailing audio from triggering
   *
   * @param {number} durationMs - Milliseconds to ignore speech input
   */
  setCooldown(durationMs) {
    this.ignoreUntil = performance.now() + durationMs;
    console.log(`Speech cooldown set: ${durationMs}ms`);
  }

  /**
   * Parse French number text to numeric value
   *
   * Handles:
   * - Numeric digits (24, 10, 9) - Chrome often returns these directly
   * - Basic numbers (deux → 2, dix → 10)
   * - Compound numbers (vingt-trois → 23)
   * - Special cases (soixante-dix → 70, quatre-vingt → 80)
   *
   * @param {string} text - Spoken text in French
   * @returns {number|null} Numeric value or null if not a valid number
   */
  parseNumber(text) {
    console.log('Parsing French text:', text);

    // Remove common noise words
    text = text.replace(/^(euh|heu|alors|donc)\s+/gi, '').trim();

    // Check if text is already a number (Chrome often converts speech to digits)
    const numericValue = parseInt(text, 10);
    if (!isNaN(numericValue) && numericValue >= 2 && numericValue <= 150) {
      console.log('Already numeric:', numericValue);
      return numericValue;
    }

    // French number mappings
    const numbers = {
      'zéro': 0, 'zero': 0,
      'un': 1, 'une': 1,
      'deux': 2,
      'trois': 3,
      'quatre': 4,
      'cinq': 5,
      'six': 6, 'sis': 6, // Homophone
      'sept': 7, 'set': 7,
      'huit': 8,
      'neuf': 9,
      'dix': 10, 'dis': 10,
      'onze': 11,
      'douze': 12,
      'treize': 13,
      'quatorze': 14,
      'quinze': 15,
      'seize': 16,
      'dix-sept': 17,
      'dix-huit': 18,
      'dix-neuf': 19,
      'vingt': 20,
      'trente': 30,
      'quarante': 40,
      'cinquante': 50,
      'soixante': 60,
      'soixante-dix': 70,
      'quatre-vingt': 80, 'quatre-vingts': 80,
      'quatre-vingt-dix': 90,
      'cent': 100, 'sang': 100 // Homophone
    };

    // Try exact match first
    if (numbers.hasOwnProperty(text)) {
      const result = numbers[text];
      console.log('Exact match found:', text, '→', result);
      return result;
    }

    // Handle compound numbers by splitting and adding
    let result = 0;
    const parts = text.split(/[\s\-]+/);

    console.log('Split into parts:', parts);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part === 'et') continue; // Skip "et" connector

      if (numbers.hasOwnProperty(part)) {
        const value = numbers[part];
        result += value;
      } else {
        console.log('Unknown part:', part);
      }
    }

    console.log('Compound number result:', result);

    // Validate result is in expected range (2-150 for multiplication results)
    if (result >= 2 && result <= 150) {
      console.log('Valid number parsed:', result);
      return result;
    }

    console.log('Invalid result or out of range:', result);
    return null;
  }
}
