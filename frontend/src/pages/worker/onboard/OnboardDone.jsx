import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Zap, Target, ShieldCheck } from 'lucide-react';
// import confetti from 'canvas-confetti';

const OnboardDone = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finalizeOnboarding = async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in"}/api/worker/profile/onboarding-progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ step: 'done', data: {} })
        });
      } catch (e) {
        console.warn('Final onboarding signal failed:', e);
      }
    };
    finalizeOnboarding();
  }, []);

  return (
    <div className="space-y-10 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-32 h-32 rounded-[2.5rem] bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.2)]"
      >
        <CheckCircle className="w-16 h-16 text-green-500" />
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-5xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter uppercase italic">
          Profile Live!
        </h1>
        <p className="text-xl text-muted-foreground font-['Manrope'] font-medium max-w-sm mx-auto">
          Your dossier is complete. You are now visible to employers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
        <div className="p-6 glass-card rounded-3xl border border-white/5 flex items-center gap-4 text-left">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm text-foreground font-['Space_Grotesk']">AI Matching Active</p>
            <p className="text-xs text-muted-foreground font-['Manrope']">Jobs are already being scored for you</p>
          </div>
        </div>
        <div className="p-6 glass-card rounded-3xl border border-white/5 flex items-center gap-4 text-left">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm text-foreground font-['Space_Grotesk']">Radius Scan Online</p>
            <p className="text-xs text-muted-foreground font-['Manrope']">Monitoring jobs in your area</p>
          </div>
        </div>
        <div className="p-6 glass-card rounded-3xl border border-white/5 flex items-center gap-4 text-left">
          <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm text-foreground font-['Space_Grotesk']">Signal Transmission Logged</p>
            <p className="text-xs text-muted-foreground font-['Manrope']">Authentication handshake recorded</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/worker/home')}
        className="w-full py-6 rounded-[2rem] font-black text-white text-xl uppercase tracking-[0.4em] bg-primary shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] group"
      >
        Enter Dashboard <ArrowRight className="w-6 h-6 inline ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default OnboardDone;
