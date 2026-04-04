import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, FileText, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import api from '../../../lib/api';
import { toast } from 'sonner';

const OnboardVerify = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleNext = async (isSkipping = false) => {
    if (!isSkipping && !gstNumber && !uploadedFile) {
      toast.error("Please provide GST or verify certification");
      return;
    }

    setLoading(true);
    try {
      await api.patch('/employer/profile/onboarding-progress', {
        step: 'verify',
        data: {
          gst_number: isSkipping ? null : gstNumber,
          verification_status: isSkipping ? 'skipped' : 'pending',
          verified_at: isSkipping ? null : new Date().toISOString()
        }
      });
      toast.success(isSkipping ? "Verification deferred. You can complete this later." : "Verification request transmitted.");
      navigate('/employer/onboard/phone');
    } catch (err) {
      toast.error("Failed to sync progress. Check your signal.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        setUploadedFile(file.name);
        setIsUploading(false);
        toast.success("Certificate uploaded successfully");
      }, 1500);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
          <ShieldCheck className="w-10 h-10 text-primary" />
          Strategic Verification
        </h2>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-60">
          Phase 02 / Operational Legitimacy
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 p-12 rounded-[3.5rem] bg-muted/10 border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Verification Options */}
        <div className="space-y-8">
           <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">GST Identification Number</Label>
              <div className="relative group">
                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="e.g. 29AAAAA0000A1Z5" 
                  className="h-16 pl-14 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 text-xl font-['Space_Grotesk'] font-bold tracking-widest uppercase"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-bold ml-4 italic">Automatically validates your enterprise across the Shram-Matrix</p>
           </div>

           <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground/30 font-black px-4 bg-transparent backdrop-blur-md italic">Or upload certification</div>
           </div>

           <div className="space-y-4">
              <div className={`p-10 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer group text-center flex flex-col items-center gap-4 ${uploadedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-white/5 hover:border-primary/30'}`}>
                 <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  disabled={isUploading || uploadedFile}
                 />
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${uploadedFile ? 'bg-emerald-500 text-white' : 'bg-muted/30 text-muted-foreground group-hover:text-primary group-hover:scale-110'}`}>
                    {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : uploadedFile ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                 </div>
                 {uploadedFile ? (
                   <div>
                      <p className="font-black font-['Space_Grotesk'] text-emerald-500 uppercase tracking-widest">CERTIFICATE SECURED</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{uploadedFile}</p>
                   </div>
                 ) : (
                   <div>
                      <p className="font-black font-['Space_Grotesk'] text-sm uppercase tracking-widest mb-1">Company Certificate / GST PDF</p>
                      <p className="text-[10px] text-muted-foreground font-bold opacity-60">Drag and drop or click to upload</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Warning card */}
        <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
           <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Notice for skip</p>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                Skipping verification restricts your profile to 'Unverified' status. Verified employers receive 3x more worker bids.
              </p>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-10">
        <Button 
          variant="ghost" 
          onClick={() => handleNext(true)}
          className="h-16 px-10 rounded-2xl font-black text-muted-foreground/40 hover:text-foreground transition-colors uppercase tracking-[0.2em] text-xs font-['Space_Grotesk']"
        >
          SKIP FOR NOW
        </Button>
        <Button 
          onClick={() => handleNext(false)} 
          disabled={loading || isUploading}
          className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 group"
        >
          {loading ? "VALIDATING..." : "CONFIRM & NEXT"}
          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardVerify;
