import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import OTPVerification from '../../../components/OTPVerification';
import { toast } from 'sonner';

const OnboardPhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!isVerified) {
      toast.error("Please verify your direct signal first.");
      return;
    }

    setLoading(true);
    try {
      await api.patch('/employer/profile/onboarding-progress', {
        step: 'phone',
        data: { contact_phone: user?.phone, phone_verified: true }
      });
      navigate('/employer/onboard/profile');
    } catch (err) {
      toast.error("Failed to sync progress. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
          <Phone className="w-10 h-10 text-primary" />
          Signal Validation
        </h2>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-60">
          Phase 03 / Direct Command Line
        </p>
      </div>

      <div className="p-12 rounded-[3.5rem] bg-muted/10 border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isVerified ? (
            <motion.div 
              key="verify-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="flex items-center gap-6 p-6 rounded-3xl bg-primary/5 border border-primary/10 mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                 </div>
                 <div>
                    <p className="font-black font-['Space_Grotesk'] text-lg tracking-tight uppercase">2-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60">Verify your registered corporate line</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Registered Phone</Label>
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl font-black text-white/40 font-['Space_Grotesk']">+91</span>
                    <span className="text-xl font-black text-white tracking-widest font-['Space_Grotesk']">{user?.phone || 'XXXXXXXXXX'}</span>
                  </div>
                </div>

                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                  <OTPVerification 
                    phone={user?.phone} 
                    onVerified={() => {
                      setIsVerified(true);
                      toast.success("Operational Signal Verified");
                    }} 
                  />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                 <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                 <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                   Required for real-time alerts. All workforce mission updates will be transmitted to this verified signal.
                 </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="verified-success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-16 text-center space-y-8 flex flex-col items-center"
            >
               <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-white" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Signal Locked</h3>
                 <p className="text-sm text-muted-foreground tracking-[0.2em] font-black uppercase opacity-60 italic">Your direct mission line is now active</p>
               </div>
               <Button 
                onClick={handleNext}
                disabled={loading}
                className="h-16 px-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-emerald-500/20 group"
               >
                 {loading ? "SAVING PROGRESS..." : "PROCEED TO PROFILE"}
                 <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardPhone;
