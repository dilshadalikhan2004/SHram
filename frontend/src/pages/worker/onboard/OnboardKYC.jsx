import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Camera, ArrowRight, SkipForward, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const OnboardKYC = () => {
  const navigate = useNavigate();
  const [docType, setDocType] = useState('aadhar');
  const [docNumber, setDocNumber] = useState('');
  const [docPhotoUrl, setDocPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/upload/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setDocPhotoUrl(data.url);
        toast.success("Document uploaded successfully");
      }
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!docNumber) { setError('Enter document number'); return; }
    if (!docPhotoUrl) { setError('Upload a photo of your ID'); return; }
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/kyc/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          document_type: docType,
          document_number: docNumber,
          document_photo_url: docPhotoUrl
        })
      });
      toast.success("KYC Submitted for Review");
      navigate('/worker/onboard/skills');
    } catch (e) {
      setError('Failed to submit KYC');
    } finally {
      setLoading(false);
    }
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
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
          Trust Verification
        </h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium max-w-sm mx-auto">
          Upload your ID to get the "Verified" badge and secure more work.
        </p>
      </div>

      <div className="space-y-6">
        {/* Doc Type */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">ID Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['aadhar', 'pan', 'voter'].map(type => (
              <button
                key={type}
                onClick={() => setDocType(type)}
                className={`py-3 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] font-['Space_Grotesk'] transition-all ${
                  docType === type ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/5 text-muted-foreground'
                }`}
              >
                {type} Card
              </button>
            ))}
          </div>
        </div>

        {/* Doc Number */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">{docType} Number</label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-lg focus:outline-none focus:border-primary/30 outline-none"
            placeholder={`Enter ${docType} number`}
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">ID Photo (Front)</label>
          <div className="relative h-40 rounded-3xl bg-muted/10 border-2 border-dashed border-white/5 flex flex-col items-center justify-center overflow-hidden group">
            {docPhotoUrl ? (
              <>
                <img src={docPhotoUrl} alt="ID" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-white">Change Photo</label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2">
                {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Camera className="w-8 h-8 text-muted-foreground/30" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Tap to Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-bold font-['Space_Grotesk'] text-center">{error}</p>}

        <button 
          onClick={handleSubmit} 
          disabled={loading || isUploading} 
          className="w-full py-5 rounded-[2rem] font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? 'Submitting...' : <>Submit for Review <CheckCircle2 className="w-5 h-5" /></>}
        </button>

        <button onClick={handleSkip} className="w-full py-3 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors font-['Space_Grotesk'] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          <SkipForward className="w-4 h-4" /> Skip for Now
        </button>
      </div>
    </div>
  );
};

export default OnboardKYC;
