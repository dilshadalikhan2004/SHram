import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Zap, ArrowRight, Award, Sparkles, Star } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { toast } from 'sonner';

const OnboardDone = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      await api.patch('/employer/profile/onboarding-progress', {
        step: 'done',
        data: { onboarding_completed: true }
      });
      updateUser({ profile_complete: true, onboarding_completed: true });
      toast.success("Enterprise Hub Operational");
      navigate('/employer/home');
    } catch (err) {
      toast.error("Failed to finalize hub. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 text-center py-10">
      <div className="relative inline-block">
        <motion.div 
          initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="w-32 h-32 rounded-[3.5rem] bg-emerald-500 flex items-center justify-center shadow-3xl shadow-emerald-500/40 relative z-10"
        >
          <CheckCircle className="w-16 h-16 text-white" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-emerald-500/40 blur-3xl -z-10 rounded-full"
        />
        {/* Decorative elements */}
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-6 -right-6 text-primary"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="space-y-2">
           <h2 className="text-5xl font-black font-['Space_Grotesk'] uppercase tracking-tight leading-none">
             HQ <span className="text-primary italic">Operational</span>
           </h2>
           <p className="text-sm font-black text-muted-foreground/60 uppercase tracking-[0.4em] font-['Space_Grotesk']">Initialize Enterprise Matrix Success</p>
        </div>

        <div className="max-w-md mx-auto grid grid-cols-1 gap-4 pt-6">
           <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                 <p className="font-black font-['Space_Grotesk'] text-sm uppercase tracking-wide">Enterprise Badge</p>
                 <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Active Verification Status</p>
              </div>
              <Star className="ml-auto w-4 h-4 text-emerald-500 opacity-30 group-hover:opacity-100 transition-opacity" />
           </div>

           <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                 <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                 <p className="font-black font-['Space_Grotesk'] text-sm uppercase tracking-wide">Smart Matching</p>
                 <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">AI Scouting Protocols Active</p>
              </div>
              <Award className="ml-auto w-4 h-4 text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      </motion.div>

      <div className="pt-10 max-w-sm mx-auto">
        <Button 
          onClick={handleLaunch} 
          disabled={loading}
          className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-widest shadow-3xl shadow-primary/30 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex items-center justify-center gap-4">
             {loading ? "SYNCHRONIZING..." : "LAUNCH CONTROL CENTER"}
             <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </div>
        </Button>
        <p className="mt-8 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">Operational Readiness Check: 100%</p>
      </div>
    </div>
  );
};

export default OnboardDone;
