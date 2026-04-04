import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ArrowRight, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SECTORS = [
  { id: 'construction', name: 'Construction', nameHi: 'निर्माण', icon: '🏗️' },
  { id: 'electrical', name: 'Electrical', nameHi: 'बिजली', icon: '⚡' },
  { id: 'plumbing', name: 'Plumbing', nameHi: 'प्लंबिंग', icon: '🔧' },
  { id: 'painting', name: 'Painting', nameHi: 'पेंटिंग', icon: '🎨' },
  { id: 'carpentry', name: 'Carpentry', nameHi: 'बढ़ईगीरी', icon: '🪚' },
  { id: 'welding', name: 'Welding', nameHi: 'वेल्डिंग', icon: '🔥' },
  { id: 'masonry', name: 'Masonry', nameHi: 'चिनाई', icon: '🧱' },
  { id: 'driving', name: 'Driving', nameHi: 'ड्राइविंग', icon: '🚗' },
  { id: 'cleaning', name: 'Cleaning', nameHi: 'सफाई', icon: '🧹' },
  { id: 'agriculture', name: 'Agriculture', nameHi: 'कृषि', icon: '🌾' },
  { id: 'delivery', name: 'Delivery', nameHi: 'डिलीवरी', icon: '📦' },
  { id: 'security', name: 'Security', nameHi: 'सुरक्षा', icon: '🛡️' },
  { id: 'cooking', name: 'Cooking', nameHi: 'खाना बनाना', icon: '👨‍🍳' },
  { id: 'tailoring', name: 'Tailoring', nameHi: 'सिलाई', icon: '🧵' },
  { id: 'other', name: 'Other', nameHi: 'अन्य', icon: '📋' },
];

const SECONDARY_SKILLS = [
  'Heavy Lifting', 'Machine Operation', 'Blueprint Reading', 'Safety Certified',
  'Team Leader', 'First Aid', 'Height Work', 'Night Shift', 'Tools Handling',
  'AC Repair', 'Tiling', 'Waterproofing', 'Scaffolding', 'Concrete Mix',
];

const OnboardSkills = () => {
  const navigate = useNavigate();
  const [primaryTrade, setPrimaryTrade] = useState('');
  const [secondarySkills, setSecondarySkills] = useState([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSecondary = (skill) => {
    setSecondarySkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleNext = async () => {
    if (!primaryTrade) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          step: 'skills',
          data: {
            category: primaryTrade,
            skills: [{ name: primaryTrade, years_experience: parseInt(experienceYears) || 1 }, ...secondarySkills.map(s => ({ name: s, years_experience: 0 }))],
            experience_years: parseInt(experienceYears) || 1
          }
        })
      });
    } catch (e) { console.warn(e); }
    setLoading(false);
    navigate('/worker/onboard/location');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Wrench className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Your Trade</h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium">Select your primary trade and secondary skills</p>
      </div>

      {/* Primary Trade */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Primary Trade *</label>
        <div className="grid grid-cols-3 gap-2">
          {SECTORS.map(s => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPrimaryTrade(s.id)}
              className={`p-4 rounded-2xl border-2 text-center transition-all relative ${
                primaryTrade === s.id
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-white/10 bg-muted/10 hover:border-white/20'
              }`}
            >
              {primaryTrade === s.id && <CheckCircle className="w-4 h-4 text-primary absolute top-2 right-2" />}
              <span className="text-2xl block mb-1">{s.icon}</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground font-['Space_Grotesk']">{s.name}</p>
              <p className="text-[8px] text-muted-foreground font-bold">{s.nameHi}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Years of Experience</label>
        <input
          type="number"
          min="0"
          max="50"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-lg focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/30"
          placeholder="e.g. 5"
        />
      </div>

      {/* Secondary Skills */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Secondary Skills (optional)</label>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_SKILLS.map(skill => (
            <button
              key={skill}
              onClick={() => toggleSecondary(skill)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border font-['Space_Grotesk'] ${
                secondarySkills.includes(skill)
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-muted/20 border-white/10 text-muted-foreground/60 hover:border-white/20'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!primaryTrade || loading}
        className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
};

export default OnboardSkills;
