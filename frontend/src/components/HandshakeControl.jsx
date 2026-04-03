import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCcw, CheckCircle2, AlertCircle, Copy, Share2, Smartphone } from 'lucide-react';
import { handshakeApi } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

/**
 * HandshakeControl handles the secure physical check-in process.
 * Roles: 
 * - Worker: Generates a 4-digit code to show the employer.
 * - Employer: Enters the 4-digit code to verify the worker has arrived.
 */
const HandshakeControl = ({ role, jobId, onSuccess }) => {
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, generating, generated, verifying, success, error
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    if (role === 'worker' && status === 'idle') {
      handleGenerateCode();
    }
  }, [role, status]);

  useEffect(() => {
    let timer;
    if (status === 'generated' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setStatus('generating');
    try {
      const res = await handshakeApi.generate(jobId);
      setCode(res.data.code);
      setStatus('generated');
    } catch (err) {
      setStatus('error');
      toast.error('Failed to generate handshake code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (inputCode.length !== 4) return toast.error('Check 4-digit code');
    setIsLoading(true);
    setStatus('verifying');
    try {
      await handshakeApi.verify({ job_id: jobId, code: inputCode });
      setStatus('success');
      toast.success('Handshake Verified! Mission Started.');
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      setStatus('generated'); // back to input state
      toast.error('Invalid or Expired Code');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 md:p-10 text-center font-['Manrope']">
      <AnimatePresence mode="wait">
        {status === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <RefreshCcw className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Initializing Handshake Protocol...</p>
          </motion.div>
        )}

        {status === 'generated' && role === 'worker' && (
          <motion.div 
            key="worker-code"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">On-Site Verification</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                Show this code to the employer at the mission site to secure your check-in.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/10 blur-xl rounded-[2rem] group-hover:bg-primary/20 transition-all" />
              <div className="relative text-7xl md:text-8xl font-black font-['Space_Grotesk'] tracking-[0.2em] text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
                {code}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-muted/40 border border-white/5 flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Expires in: {formatTime(countdown)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }}><Copy className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => toast.info('Share integration ready post-deployment.')}><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>

            <p className="text-[10px] uppercase font-black tracking-widest text-green-500 flex items-center justify-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Waiting for employer verification...
            </p>
          </motion.div>
        )}

        {status === 'generated' && role === 'employer' && (
          <motion.div 
            key="employer-verify"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Verify Worker Arrival</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                Enter the 4-digit code from the worker's device to secure the check-in.
              </p>
            </div>

            <div className="space-y-6 max-w-xs mx-auto">
              <Input 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0 0 0 0"
                className="h-20 text-center text-4xl font-black tracking-[0.5em] bg-muted/30 border-0 rounded-2xl font-['Space_Grotesk']"
              />
              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading || inputCode.length < 4}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {isLoading ? 'Decrypting...' : 'Verify & Start Mission'}
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> Trusted Check-in Active
            </div>
          </motion.div>
        )}

        {status === 'verifying' && (
          <motion.div 
            key="verifying"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-10"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-6" />
            <p className="font-black text-lg uppercase tracking-tight">Validating Secure Handshake...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            key="success"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-2xl shadow-green-500/20">
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                 <CheckCircle2 className="w-12 h-12 text-green-500" />
               </motion.div>
            </div>
            <h3 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-green-500">Secure Check-in</h3>
            <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest">Mission Matrix Synced</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="font-bold text-foreground uppercase tracking-tight">Handshake Failed</p>
            <Button variant="link" className="text-primary font-bold" onClick={handleGenerateCode}>Retry Protocol</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HandshakeControl;
