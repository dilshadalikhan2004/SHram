import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import useTTS from '../hooks/useTTS';
import { useTranslation } from '../context/TranslationContext';

/**
 * TTSButton – Tap to read any text aloud.
 *
 * Props:
 *   text      – The string to speak
 *   label     – Optional button label (defaults to icon-only)
 *   size      – 'sm' | 'md' | 'lg'
 *   variant   – 'pill' | 'icon' | 'inline'
 *   className – Additional classes
 */
const TTSButton = ({ text, label, size = 'md', variant = 'pill', className = '' }) => {
  const { language } = useTranslation();
  const { speak, stop, pause, resume, speaking, paused, supported } = useTTS(language);

  if (!supported) return null; // Gracefully hide if browser doesn't support

  const handleClick = (e) => {
    e.stopPropagation();
    if (speaking && !paused) {
      pause();
    } else if (paused) {
      resume();
    } else if (speaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const handleStop = (e) => {
    e.stopPropagation();
    stop();
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Icon-only compact button
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex ${className}`}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClick}
          title={speaking ? (paused ? 'Resume' : 'Pause') : 'Listen'}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 ${
            speaking
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-muted/20 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary border border-white/5'
          }`}
        >
          <AnimatePresence mode="wait">
            {speaking && !paused ? (
              <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Pause className={iconSize[size]} />
              </motion.div>
            ) : paused ? (
              <motion.div key="resume" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Play className={iconSize[size]} />
              </motion.div>
            ) : (
              <motion.div key="speak" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Volume2 className={iconSize[size]} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when speaking */}
          {speaking && !paused && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Stop button appears when speaking */}
        <AnimatePresence>
          {speaking && (
            <motion.button
              initial={{ scale: 0, x: -10, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0, x: -10, opacity: 0 }}
              onClick={handleStop}
              title="Stop"
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center ml-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors`}
            >
              <VolumeX className={iconSize[size]} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline text button
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors ${
            speaking
              ? 'text-primary'
              : 'text-muted-foreground/50 hover:text-primary'
          }`}
        >
          {speaking && !paused ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Volume2 className="w-3 h-3" />
          )}
          {label || (speaking ? (paused ? 'Resume' : 'Pause') : 'Listen')}
        </button>
        {speaking && (
          <button
            onClick={handleStop}
            className="ml-1 text-rose-500 hover:text-rose-400"
            title="Stop Reading"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Default: Pill button
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-['Space_Grotesk'] ${
          speaking
            ? 'bg-primary text-white shadow-lg shadow-primary/20 border border-primary'
            : 'bg-muted/20 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary border border-white/5 hover:border-primary/30'
        }`}
      >
        {speaking && !paused ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
            {/* Sound wave animation */}
            <div className="flex items-center gap-[2px] ml-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-[2px] bg-white rounded-full"
                  animate={{ height: ['4px', '12px', '4px'] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </>
        ) : paused ? (
          <>
            <Play className="w-3.5 h-3.5" /> <span>Resume</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" /> <span>{label || '🔊 Listen'}</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {speaking && (
          <motion.button
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            onClick={handleStop}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-colors font-['Space_Grotesk']"
          >
            <VolumeX className="w-3.5 h-3.5" /> Stop
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TTSButton;
