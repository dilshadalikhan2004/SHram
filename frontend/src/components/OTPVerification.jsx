import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2, ShieldCheck, Timer, Phone, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import api from '../lib/api';

const OTPVerification = ({ phoneNumber: initialPhone, onVerified, onCancel }) => {
  const [phone, setPhone] = useState(initialPhone || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(initialPhone ? 'otp' : 'phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sandbox, setSandbox] = useState(false);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    }
  }, [step]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error(parseApiError(null, 'Please enter a valid phone number'));
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const res = await api.post('/auth/send-otp', { phone: formattedPhone });
      
      if (res.data.sandbox) {
        setSandbox(true);
        toast.success('Sandbox Mode: Use code 123456');
      } else {
        toast.success('OTP sent to your phone!');
      }
      setStep('otp');
      setTimeLeft(60);
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      toast.error(parseApiError(null, 'Please enter the full 6-digit code'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { phone: formattedPhone, code });
      toast.success('Phone verified successfully! ✅');
      onVerified?.();
    } catch (error) {
      toast.error(parseApiError(error, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full font-['Manrope']">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary border border-primary/20 shadow-inner group">
                <Smartphone className="w-10 h-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase">Identify Module</h2>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-60">Mobile Handshake Protocol</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-muted/50 rounded-lg text-xs font-bold font-['Space_Grotesk'] border border-white/5 text-primary">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="000 000 0000"
                  value={phone.replace(/^\+91/, '')}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="h-16 pl-20 text-2xl font-black font-['Space_Grotesk'] bg-muted/20 border-white/5 rounded-2xl focus:border-primary/50 transition-all tracking-[0.2em]"
                />
              </div>
              
              <Button 
                onClick={handleSendOTP} 
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={loading || phone.replace(/^\+91/, '').length < 10}
              >
                {loading ? <><Loader2 className="animate-spin w-6 h-6 mr-3" /> Sending Signal...</> : 'Initialize Pulse'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-inner">
                <ShieldCheck className="w-10 h-10" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase">Decrypt Access</h2>
                <p className="text-muted-foreground text-sm font-medium"> 
                  Signal sent to: <span className="text-primary font-bold font-['Space_Grotesk']">+91 {phone.replace(/^\+91/, '')}</span>
                </p>
                {sandbox && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 py-1 px-4 bg-amber-500/10 border border-amber-500/20 rounded-full inline-block">
                     <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">TEST MODE: CODE 123456</p>
                   </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 px-2">
              {otp.map((digit, i) => (
                <motion.div key={i} whileFocus={{ scale: 1.05 }}>
                  <Input
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 sm:w-14 h-16 sm:h-20 text-center text-3xl font-black font-['Space_Grotesk'] bg-muted/20 border-white/5 border-2 rounded-[1.25rem] focus:border-primary/50 focus:bg-primary/5 transition-all shadow-xl"
                    maxLength={1}
                  />
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <Button 
                onClick={handleVerify} 
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? <><Loader2 className="animate-spin w-6 h-6 mr-3" /> Verifying Matrix...</> : 'Authenticate Pulse'}
              </Button>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={handleSendOTP}
                    disabled={timeLeft > 0 || resending}
                    className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors flex items-center gap-2 group"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> {resending ? 'Resending...' : 'Resend Code'}
                  </button>
                  
                  {timeLeft > 0 && (
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-white/5">
                      <Timer className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black font-['Space_Grotesk'] text-muted-foreground w-10">00:{timeLeft.toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 text-center">
                  <button 
                    onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3" /> Modify Identify Module
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OTPVerification;
