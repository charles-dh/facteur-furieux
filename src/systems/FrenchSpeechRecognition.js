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

    // Setup event handlers
    this.setupEventHandlers();

    console.log('FrenchSpeechRecognition initialized');
  }

  /**
   * Setup Web Speech API event handlers
   */
  setupEventHandlers() {
    this.recognition.onresult = (event) => {
      // Get the latest result
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim().toLowerCase();

      if (result.isFinal) {
        // Final result - parse as number
        const number = this.parseNumber(transcript);

        if (number !== null && this.onNumberRecognized) {
          this.onNumberRecognized(number);
        }
      } else {
        // Interim result - for visual feedback
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
