import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for the Web Speech API (SpeechRecognition).
 * Supports multilingual recognition for ShramSetu's target languages.
 *
 * Key features:
 *   - Uses native Web Speech API for instantaneous results.
 *   - continuous = true  → keeps listening through natural pauses.
 *   - Auto-stops after ~2.5s of silence so user doesn't need to manually tap stop.
 *   - Accumulates all final results across multiple onresult events.
 *
 * Language mapping:
 *   en → en-IN (English India)
 *   hi → hi-IN (Hindi)
 *   or → or-IN (Odia)
 */

const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  or: 'or-IN',
};

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// How long to wait after the last speech before auto-stopping (ms)
const SILENCE_TIMEOUT_MS = 1500;

export default function useSpeechRecognition(appLanguage = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // We don't use Gemini anymore, so this is always false.
  // Kept here to not break the UI components that still reference it.
  const isProcessing = false;

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const accumulatedRef = useRef(''); // accumulates final text across result events
  const manualStopRef = useRef(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Clear the silence auto-stop timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Reset the auto-stop timer (called each time we get speech input)
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after silence
      if (recognitionRef.current) {
        manualStopRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (_) { /* noop */ }
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  // Build / rebuild the recognition instance whenever the language changes
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[appLanguage] || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;     // ← keep listening through pauses
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      accumulatedRef.current = '';
    };

    recognition.onresult = (event) => {
      let interim = '';
      let allFinal = '';

      // Re-read ALL results from the beginning to build the full transcript
      for (let i = 0; i < event.results.length; i++) {
        const seg = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          allFinal += seg;
        } else {
          interim += seg;
        }
      }

      // Store accumulated final text
      if (allFinal) {
        accumulatedRef.current = allFinal.trim();
        // Update the transcript immediately for snappy UX!
        setTranscript(allFinal.trim());
      }

      setInterimTranscript(interim);

      // Reset the silence timer every time we get new speech activity
      resetSilenceTimer();
    };

    recognition.onspeechend = () => {
      // Speech has stopped — start a shorter timer to auto-stop
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      clearSilenceTimer();
      // "aborted" is expected when we call stop() manually
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      setInterimTranscript('');

      // Commit the accumulated transcript as the final result again just in case
      const finalText = accumulatedRef.current.trim();
      if (finalText) {
        setTranscript(finalText);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimer();
      try {
        recognition.abort();
      } catch (_) { /* noop */ }
    };
  }, [appLanguage, resetSilenceTimer, clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    accumulatedRef.current = '';
    manualStopRef.current = false;

    try {
      recognitionRef.current.start();
      // NOTE: We do NOT start the silence timer here anymore.
      // We wait patiently for them to start speaking. The timer will kick in
      // immediately after they say their first word (inside onresult).
    } catch (e) {
      // Already started — ignore
      console.warn('SpeechRecognition start failed:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (!recognitionRef.current) return;
    manualStopRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch (_) { /* noop */ }
  }, [clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedRef.current = '';
  }, []);

  return {
    isListening,
    isProcessing, // Stays false so UI doesn't spin
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
