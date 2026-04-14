import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useTTS – a lightweight React hook for browser-native Text-to-Speech.
 *
 * Features:
 *  • Auto-selects the correct voice for Hindi / Odia / English
 *  • Supports pause / resume / stop
 *  • Exposes speaking / paused state for UI binding
 *  • Gracefully degrades when the Web Speech API is unavailable
 *
 * Usage:
 *   const { speak, stop, pause, resume, speaking, paused, supported } = useTTS();
 *   speak("Hello world!");
 */

const LANG_MAP = {
  en: 'en-IN',   // Indian English
  hi: 'hi-IN',   // Hindi
  or: 'or-IN',   // Odia
};

export default function useTTS(language = 'en') {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  // Check browser support
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // Load available voices (async on some browsers)
  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [supported]);

  // Find the best voice for the current language
  const pickVoice = useCallback(() => {
    const langCode = LANG_MAP[language] || 'en-IN';
    const prefix = langCode.split('-')[0]; // 'hi', 'en', 'or'

    // Priority: exact match → prefix match → any available
    return (
      voices.find(v => v.lang === langCode) ||
      voices.find(v => v.lang.startsWith(prefix)) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0]
    );
  }, [voices, language]);

  const speak = useCallback((text, options = {}) => {
    if (!supported || !text) return;

    // Eagerly update UI state so button feels instantly responsive 
    // instead of waiting for network latency or TTS engine warmup
    setSpeaking(true);
    setPaused(false);

    // Cancel any ongoing speech first
    if (utteranceRef.current instanceof Audio) {
      utteranceRef.current.pause();
      utteranceRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();

    const langCode = LANG_MAP[language] || 'en-IN';
    const prefix = langCode.split('-')[0];
    const exactVoice = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith(prefix));

    // Fallback: If no native voice exists for Odia or Hindi, use Google Cloud TTS polyfill
    if (!exactVoice && (language === 'or' || language === 'hi')) {
      // Free unofficial TTS endpoint (max ~200 chars, perfect for chatbot)
      // We chunk to 200 chars if needed, but our chatbot is instructed to be 2-3 sentences.
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=${language}&client=tw-ob`;
      const audio = new Audio(url);
      
      audio.onplay = () => { setSpeaking(true); setPaused(false); };
      audio.onended = () => { setSpeaking(false); setPaused(false); };
      audio.onpause = () => setPaused(true);
      audio.onerror = (e) => {
        console.error('Cloud TTS fallback failed', e);
        setSpeaking(false);
      };

      utteranceRef.current = audio;
      audio.play().catch(e => {
        console.error('Audio auto-play blocked', e);
        setSpeaking(false);
      });
      return;
    }

    // Native Speech Synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.lang = langCode;
    utterance.rate = options.rate ?? 0.95;   // slightly slower for clarity
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    utterance.onstart = () => { setSpeaking(true); setPaused(false); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); };
    utterance.onpause = () => setPaused(true);
    utterance.onresume = () => setPaused(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [supported, language, pickVoice, voices]);

  const stop = useCallback(() => {
    if (utteranceRef.current instanceof Audio) {
      utteranceRef.current.pause();
      utteranceRef.current.currentTime = 0;
      setSpeaking(false);
      setPaused(false);
      return;
    }
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  const pause = useCallback(() => {
    if (utteranceRef.current instanceof Audio) {
      utteranceRef.current.pause();
      return;
    }
    if (!supported) return;
    window.speechSynthesis.pause();
  }, [supported]);

  const resume = useCallback(() => {
    if (utteranceRef.current instanceof Audio) {
      utteranceRef.current.play().catch(e => console.error(e));
      setPaused(false);
      return;
    }
    if (!supported) return;
    window.speechSynthesis.resume();
  }, [supported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { speak, stop, pause, resume, speaking, paused, supported };
}
