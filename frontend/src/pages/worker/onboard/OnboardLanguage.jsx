import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

const OnboardLanguage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(localStorage.getItem('shram_full_name') || '');
  const [selected, setSelected] = useState(localStorage.getItem('shram_language') || 'en');

  const handleNext = async () => {
    if (!fullName.trim()) return alert('Please enter your full name');
    localStorage.setItem('shram_full_name', fullName.trim());
    localStorage.setItem('shram_language', selected);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          step: 'language', 
          data: { 
            preferred_language: selected,
            full_name: fullName.trim()
          } 
        })
      });
    } catch (e) { console.warn('Failed to save onboarding step:', e); }
    navigate('/worker/onboard/phone');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
          Choose Your Language
        </h1>
        <p className="text-lg text-muted-foreground font-['Manrope'] font-medium">
          अपनी भाषा चुनें और अपना नाम बताएं · Select your name & language
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk'] ml-1">Full Name</label>
        <input 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Rahul Kumar"
          className="w-full p-5 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-['Space_Grotesk'] font-bold text-lg focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 transition-all"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk'] ml-1">Preferred Language</h2>
        <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map(lang => (
          <motion.button
            key={lang.code}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(lang.code)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selected === lang.code
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-white/10 bg-muted/10 hover:border-white/20'
            }`}
          >
            <span className="text-2xl mb-2 block">{lang.flag}</span>
            <p className="font-black text-xl text-foreground font-['Space_Grotesk'] tracking-tight">{lang.native}</p>
            <p className="text-xs text-muted-foreground font-['Space_Grotesk'] font-bold uppercase tracking-widest mt-1">{lang.label}</p>
          </motion.button>
        ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk']"
      >
        Continue →
      </button>
    </div>
  );
};

export default OnboardLanguage;
