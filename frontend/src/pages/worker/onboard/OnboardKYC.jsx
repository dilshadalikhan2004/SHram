import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Camera, ArrowRight, SkipForward } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OnboardKYC = () => {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('aadhaar'); // aadhaar | otp | face
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendAadhaarOtp = async () => {
    if (aadhaar.replace(/\s/g, '').length !== 12) { setError('Enter a valid 12-digit Aadhaar number'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/kyc/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aadhaar_number: aadhaar.replace(/\s/g, '') })
      });
      setStep('otp');
    } catch (e) {
      setError('Failed to send Aadhaar OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError('Enter the OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/kyc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp })
      });
      setStep('face');
    } catch (e) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceMatch = async () => {
    // Face verification placeholder — navigates forward
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'kyc', data: { kyc_completed: true, aadhaar_verified: true } })
      });
    } catch (e) { console.warn(e); }
    navigate('/worker/onboard/skills');
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'kyc', data: { kyc_completed: false, kyc_skipped: true } })
      });
    } catch (e) { console.warn(e); }
    navigate('/worker/onboard/skills');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
          KYC Verification
        </h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium max-w-sm mx-auto">
          Verify your identity with Aadhaar to unlock all features and increase trust with employers.
        </p>
      </div>

      {step === 'aadhaar' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Aadhaar Number</label>
            <input
              type="text"
              maxLength={14}
              value={aadhaar}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                setAadhaar(val.replace(/(\d{4})/g, '$1 ').trim());
              }}
              className="w-full px-5 py-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-xl tracking-[0.3em] text-center focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/30"
              placeholder="XXXX XXXX XXXX"
            />
          </div>
          {error && <p className="text-sm text-rose-500 font-['Space_Grotesk'] font-bold text-center">{error}</p>}
          <button onClick={handleSendAadhaarOtp} disabled={loading} className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Aadhaar OTP'}
          </button>
        </motion.div>
      )}

      {step === 'otp' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Enter OTP sent to Aadhaar-linked phone</label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input key={i} type="text" maxLength={1} value={otp[i] || ''}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const n = otp.split(''); n[i] = v; setOtp(n.join('')); if (v && i < 5) e.target.nextElementSibling?.focus(); }}
                  className="w-12 h-14 rounded-xl bg-muted/20 border border-white/10 text-center text-foreground font-black font-['Space_Grotesk'] text-xl focus:outline-none focus:border-primary/30"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-rose-500 font-['Space_Grotesk'] font-bold text-center">{error}</p>}
          <button onClick={handleVerifyOtp} disabled={loading} className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </motion.div>
      )}

      {step === 'face' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
          <div className="w-64 h-64 mx-auto rounded-[3rem] bg-muted/20 border-2 border-dashed border-white/10 flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground font-['Manrope']">Position your face in the frame for verification</p>
          <button onClick={handleFaceMatch} className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-green-600 shadow-2xl shadow-green-600/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk']">
            <Camera className="w-5 h-5 inline mr-2" /> Capture & Verify
          </button>
        </motion.div>
      )}

      {/* Skip button */}
      <button onClick={handleSkip} className="w-full py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary transition-colors font-['Space_Grotesk'] uppercase tracking-widest flex items-center justify-center gap-2">
        <SkipForward className="w-4 h-4" /> Skip for Now
      </button>
    </div>
  );
};

export default OnboardKYC;
