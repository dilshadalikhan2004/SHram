import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Shield, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const OnboardPhone = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.startsWith('+91') ? phone : `+91${phone}` })
      });
      setOtpSent(true);
    } catch (e) {
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.startsWith('+91') ? phone : `+91${phone}`, otp })
      });
      if (!res.ok) throw new Error('Invalid OTP');

      // Save step
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'phone', data: { phone: phone.startsWith('+91') ? phone : `+91${phone}`, phone_verified: true } })
      });
      navigate('/worker/onboard/kyc');
    } catch (e) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Phone className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
          Verify Your Phone
        </h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium">
          We'll send a one-time code to verify your number
        </p>
      </div>

      <div className="space-y-4">
        {/* Phone Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Mobile Number</label>
          <div className="flex items-center gap-3">
            <div className="px-5 py-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-lg">+91</div>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              disabled={otpSent}
              className="flex-1 px-5 py-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-lg focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/30 disabled:opacity-50"
              placeholder="9876543210"
            />
          </div>
        </div>

        {/* OTP Input */}
        {otpSent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Enter OTP</label>
            <div className="flex gap-2 sm:gap-3 justify-center">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = otp.split('');
                    newOtp[i] = val;
                    const finalOtp = newOtp.join('').substring(0, 6);
                    setOtp(finalOtp);
                    if (val && i < 5) {
                      const next = e.target.parentNode.children[i + 1] || e.target.nextElementSibling;
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      const prev = e.target.parentNode.children[i - 1] || e.target.previousElementSibling;
                      if (prev) prev.focus();
                    }
                  }}
                  className="w-12 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/20 border border-white/10 text-center text-foreground font-black font-['Space_Grotesk'] text-xl sm:text-2xl focus:outline-none focus:border-primary/30"
                />
              ))}
            </div>
            <div className="flex justify-center mt-3">
              <button onClick={handleSendOtp} className="text-xs text-primary font-bold font-['Space_Grotesk'] uppercase tracking-widest hover:underline">
                Resend OTP
              </button>
            </div>
          </motion.div>
        )}

        {error && <p className="text-sm text-rose-500 font-['Space_Grotesk'] font-bold text-center">{error}</p>}
      </div>

      <button
        onClick={otpSent ? handleVerify : handleSendOtp}
        disabled={loading}
        className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : otpSent ? (
          <>Verify & Continue <ArrowRight className="w-5 h-5" /></>
        ) : (
          <>Send OTP <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );
};

export default OnboardPhone;
