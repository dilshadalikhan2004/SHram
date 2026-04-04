import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Languages, Loader2, Square } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from '../context/TranslationContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

/* ───────────────────────────────────────────
 * Language labels shown inside the listening overlay
 * ─────────────────────────────────────────── */
const LANG_LABELS = {
  en: {
    label: 'Listening…',
    processing: 'Processing with AI…',
    hint: 'Say a job name like "Mason" or "Plumber"',
    stop: 'Tap to stop recording',
    lang: 'English',
  },
  hi: {
    label: 'सुन रहे हैं…',
    processing: 'AI से प्रोसेस हो रहा है…',
    hint: '"राजमिस्त्री" या "प्लम्बर" जैसी नौकरी बोलें',
    stop: 'रिकॉर्डिंग बंद करने के लिए टैप करें',
    lang: 'हिंदी',
  },
  or: {
    label: 'ଶୁଣୁଛି…',
    processing: 'AI ରେ ପ୍ରକ୍ରିୟା ହେଉଛି…',
    hint: '"ରାଜମିସ୍ତ୍ରୀ" କିମ୍ବା "ପ୍ଲମ୍ବର" ଭଳି ଚାକିରି କୁହନ୍ତୁ',
    stop: 'ରେକର୍ଡିଂ ବନ୍ଦ କରିବାକୁ ଟ୍ୟାପ କରନ୍ତୁ',
    lang: 'ଓଡ଼ିଆ',
  },
};

/* ───────────────────────────────────────────
 * Hindi / Odia → English job keyword mapping
 * ─────────────────────────────────────────── */
const TRANSLATION_MAP = {
  // Hindi → English
  'राजमिस्त्री': 'mason', 'मिस्त्री': 'mason', 'मेसन': 'mason',
  'प्लम्बर': 'plumber', 'प्लंबर': 'plumber', 'नलसाज': 'plumber',
  'बिजली': 'electrician', 'बिजलीवाला': 'electrician', 'इलेक्ट्रीशियन': 'electrician',
  'पेंटर': 'painter', 'रंगाई': 'painter',
  'बढ़ई': 'carpenter', 'कारपेंटर': 'carpenter',
  'वेल्डर': 'welder', 'वेल्डिंग': 'welding',
  'ड्राइवर': 'driver', 'चालक': 'driver',
  'सफाई': 'cleaner', 'सफाईकर्मी': 'cleaner', 'क्लीनर': 'cleaner',
  'गार्ड': 'guard', 'चौकीदार': 'guard', 'सिक्योरिटी': 'security',
  'कुक': 'cook', 'रसोइया': 'cook',
  'हेल्पर': 'helper', 'सहायक': 'helper',
  'मजदूर': 'labour', 'लेबर': 'labour',
  'मैकेनिक': 'mechanic', 'दर्जी': 'tailor', 'टेलर': 'tailor',
  'फिटर': 'fitter', 'टाइल्स': 'tiles', 'टाइल': 'tiles',
  'मिस्त्री': 'mistri', 'नौकरी': '', 'काम': '', 'चाहिए': '', 'ढूंढो': '', 'खोजो': '', 'दिखाओ': '',
  // Odia → English
  'ରାଜମିସ୍ତ୍ରୀ': 'mason', 'ମିସ୍ତ୍ରୀ': 'mason', 'ମେସନ': 'mason',
  'ପ୍ଲମ୍ବର': 'plumber', 'ନଳସାଜ': 'plumber',
  'ବିଜୁଳି': 'electrician', 'ଇଲେକ୍ଟ୍ରିସିଆନ': 'electrician',
  'ପେଣ୍ଟର': 'painter', 'ବଢ଼େଇ': 'carpenter', 'କାରପେଣ୍ଟର': 'carpenter',
  'ୱେଲ୍ଡର': 'welder', 'ଡ୍ରାଇଭର': 'driver', 'ଚାଳକ': 'driver',
  'ସଫାଇ': 'cleaner', 'ଗାର୍ଡ': 'guard', 'ସିକ୍ୟୁରିଟି': 'security',
  'ରୋଷେୟା': 'cook', 'ହେଲ୍ପର': 'helper', 'ସହାୟକ': 'helper',
  'ମଜୁର': 'labour', 'ଲେବର': 'labour', 'ମେକାନିକ': 'mechanic',
  'ଦରଜୀ': 'tailor', 'ଫିଟର': 'fitter', 'ଟାଇଲ୍ସ': 'tiles',
  'ଚାକିରି': '', 'କାମ': '', 'ଦରକାର': '', 'ଖୋଜ': '',
};

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'want', 'need', 'find', 'search', 'looking', 'for',
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'to', 'of', 'in', 'on',
  'please', 'can', 'you', 'show', 'get', 'give', 'hello', 'hi', 'hey',
  'job', 'jobs', 'work', 'kaam', 'chahiye', 'do', 'mujhe', 'mujhko',
  'some', 'any', 'this', 'that', 'it', 'like', 'near', 'nearby',
]);

function extractSearchKeywords(rawText) {
  if (!rawText) return '';
  const words = rawText.trim().split(/\s+/);
  const keywords = [];
  for (const word of words) {
    const lower = word.toLowerCase();
    if (TRANSLATION_MAP.hasOwnProperty(word)) {
      const mapped = TRANSLATION_MAP[word];
      if (mapped) keywords.push(mapped);
      continue;
    }
    if (TRANSLATION_MAP.hasOwnProperty(lower)) {
      const mapped = TRANSLATION_MAP[lower];
      if (mapped) keywords.push(mapped);
      continue;
    }
    if (STOP_WORDS.has(lower)) continue;
    keywords.push(lower);
  }
  return [...new Set(keywords)].join(' ');
}

/**
 * VoiceSearchButton — Records audio → sends to Gemini for transcription.
 * Shows live Web Speech preview while recording, then uses Gemini's result.
 */
const VoiceSearchButton = ({ onResult, className = '' }) => {
  const { language } = useTranslation();
  const {
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(language);

  const labels = LANG_LABELS[language] || LANG_LABELS.en;

  /* When Gemini returns the final transcript → extract keywords and push to parent */
  useEffect(() => {
    if (transcript) {
      const cleaned = extractSearchKeywords(transcript);
      onResult(cleaned || transcript);
    }
  }, [transcript]);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  if (!isSupported) return null;

  const isActive = isListening || isProcessing;

  return (
    <>
      {/* ── Mic trigger button ── */}
      <Button
        type="button"
        variant={isActive ? 'default' : 'outline'}
        size="icon"
        onClick={handleToggle}
        disabled={isProcessing}
        className={`
          relative overflow-hidden transition-all duration-300 shrink-0
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25'
            : isProcessing
            ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
            : 'hover:border-primary/60 hover:text-primary'
          }
          ${className}
        `}
        data-testid="voice-search-btn"
        aria-label={isListening ? 'Stop recording' : isProcessing ? 'Processing...' : 'Start voice search'}
      >
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-md animate-ping bg-red-400/40" />
            <span className="absolute inset-0 rounded-md animate-pulse bg-red-400/20" />
          </>
        )}

        {isProcessing ? (
          <Loader2 className="w-4 h-4 relative z-10 animate-spin" />
        ) : isListening ? (
          <Square className="w-3.5 h-3.5 relative z-10 fill-current" />
        ) : (
          <Mic className="w-4 h-4 relative z-10" />
        )}
      </Button>

      {/* ── Full-screen overlay ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={isListening ? stopListening : undefined} />

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="relative z-10 w-[90vw] max-w-md rounded-2xl overflow-hidden cursor-pointer"
              onClick={(e) => {
                // Prevent clicks on secondary buttons from bubbling up if they already have handlers
                if (isListening) {
                  stopListening();
                }
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,40,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(239,68,68,0.15)',
              }}
            >
              {/* Close button */}
              {isListening && (
                <button
                  onClick={stopListening}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="px-8 pt-10 pb-8 flex flex-col items-center">
                {/* Animated icon area */}
                <div className="relative mb-6">
                  {isListening && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full border-2 border-red-400/40"
                        style={{ margin: '-16px' }}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        className="absolute inset-0 rounded-full border-2 border-red-400/30"
                        style={{ margin: '-28px' }}
                      />
                      <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.1, 0, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                        className="absolute inset-0 rounded-full border border-red-400/20"
                        style={{ margin: '-42px' }}
                      />

                      {/* Sound wave bars */}
                      <div className="absolute -inset-8 flex items-center justify-center gap-[3px] pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ['8px', `${12 + Math.random() * 24}px`, '8px'] }}
                            transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
                            className="w-[2px] rounded-full bg-gradient-to-t from-red-500/60 to-red-300/80"
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Core icon */}
                  <motion.div
                    animate={isProcessing ? { rotate: 360 } : { scale: [1, 1.08, 1] }}
                    transition={isProcessing
                      ? { duration: 2, repeat: Infinity, ease: 'linear' }
                      : { duration: 1.2, repeat: Infinity }
                    }
                    className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: isProcessing
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      boxShadow: isProcessing
                        ? '0 0 40px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : '0 0 40px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </motion.div>
                </div>

                {/* Language badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs mb-4">
                  <Languages className="w-3 h-3" />
                  {labels.lang}
                  {isProcessing && (
                    <span className="ml-1 text-blue-300">• Gemini AI</span>
                  )}
                </div>

                {/* Status text */}
                <motion.p
                  key={isProcessing ? 'processing' : 'listening'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white text-xl font-semibold mb-1"
                >
                  {isProcessing ? labels.processing : labels.label}
                </motion.p>
                <p className="text-white/50 text-sm text-center mb-6">
                  {isProcessing
                    ? (language === 'hi' ? 'कृपया प्रतीक्षा करें…' :
                       language === 'or' ? 'ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ…' :
                       'Please wait…')
                    : labels.hint
                  }
                </p>

                {/* Live transcript / processing indicator */}
                <div className="w-full min-h-[56px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ width: ['20%', '80%', '60%', '90%', '100%'] }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                        className="h-1 bg-blue-400/60 rounded-full"
                        style={{ minWidth: '100px' }}
                      />
                    </div>
                  ) : interimTranscript ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white/90 text-center text-base leading-relaxed"
                    >
                      {interimTranscript}
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-5 bg-red-400 ml-1 align-middle"
                      />
                    </motion.p>
                  ) : transcript ? (
                    <div className="text-center">
                      <p className="text-green-400 text-base">✓ {transcript}</p>
                      {extractSearchKeywords(transcript) !== transcript.toLowerCase() && (
                        <p className="text-white/40 text-xs mt-1">
                          → {extractSearchKeywords(transcript)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [-3, 3, -3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-white/30"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recording timer */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-red-500"
                    />
                    <span className="text-white/50 text-xs">REC</span>
                  </motion.div>
                )}

                {/* Error display */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-red-400 text-xs text-center"
                  >
                    {error === 'not-allowed'
                      ? (language === 'hi' ? 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में सक्षम करें।' :
                         language === 'or' ? 'ମାଇକ୍ରୋଫୋନ ଅନୁମତି ନାହିଁ। ଦୟାକରି ବ୍ରାଉଜର ସେଟିଂସରେ ସକ୍ଷମ କରନ୍ତୁ।' :
                         'Microphone access denied. Please enable it in browser settings.')
                      : error === 'no-speech'
                      ? (language === 'hi' ? 'कोई आवाज़ नहीं मिली। कृपया फिर से बोलें।' :
                         language === 'or' ? 'କୌଣସି ସ୍ୱର ମିଳିଲା ନାହିଁ। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।' :
                         'No speech detected. Please try again.')
                      : error === 'transcription-failed'
                      ? (language === 'hi' ? 'ट्रांसक्रिप्शन विफल। कृपया पुनः प्रयास करें।' :
                         language === 'or' ? 'ଟ୍ରାନ୍ସକ୍ରିପସନ ବିଫଳ। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।' :
                         'Transcription failed. Please try again.')
                      : `Error: ${error}`}
                  </motion.p>
                )}

                {/* Bottom hint */}
                <p className="mt-5 text-white/30 text-xs">
                  {isListening ? labels.stop :
                   isProcessing ? '' :
                   (language === 'hi' ? 'बंद करने के लिए कहीं भी टैप करें' :
                    language === 'or' ? 'ବନ୍ଦ କରିବାକୁ ଯେକୌଣସି ସ୍ଥାନରେ ଟ୍ୟାପ କରନ୍ତୁ' :
                    'Tap anywhere to stop')}
                </p>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceSearchButton;
