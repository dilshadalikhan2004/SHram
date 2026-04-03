import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, HardHat, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

const RegistrationSuccess = ({ role, onComplete }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tighter mb-3">You're in!</h2>
        <p className="text-slate-500 max-w-xs mx-auto mb-10 leading-relaxed font-['Space_Grotesk']">
          Welcome to ShramSetu. Your {role} profile has been initialized with industrial precision.
        </p>

        <div className="bg-muted/30 p-6 rounded-3xl border border-white/5 mb-10 flex items-center gap-4 text-left glass-card">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            {role === 'worker' ? <HardHat className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
          </div>
          <div>
            <p className="font-bold text-sm tracking-widest uppercase text-foreground">Mission Control Ready</p>
            <p className="text-xs text-muted-foreground">Setup your details to start hired ops.</p>
          </div>
        </div>

        <Button 
          onClick={onComplete}
          className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 group"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
};

export default RegistrationSuccess;
