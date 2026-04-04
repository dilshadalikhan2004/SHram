import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, ArrowRight, Upload, Camera, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import api from '../../../lib/api';
import { toast } from 'sonner';

const OnboardProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    bio: '',
    company_logo: null,
    site_photos: []
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleNext = async () => {
    if (!profile.bio) {
      toast.error("Please provide a brief mission statement (bio).");
      return;
    }

    setLoading(true);
    try {
      await api.patch('/employer/profile/onboarding-progress', {
        step: 'profile',
        data: profile
      });
      navigate('/employer/onboard/done');
    } catch (err) {
      toast.error("Failed to sync progress. Check your signal.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setProfile({ ...profile, company_logo: file.name });
        setIsUploading(false);
        toast.success("Enterprise Logo synchronized");
      }, 1000);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setProfile({ 
          ...profile, 
          site_photos: [...profile.site_photos, ...files.map(f => f.name)].slice(0, 3) 
        });
        setIsUploading(false);
        toast.success(`${files.length} site photos secured`);
      }, 1200);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
          <User className="w-10 h-10 text-primary" />
          Enterprise Profile
        </h2>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-60">
          Phase 04 / Command Visualization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 p-12 rounded-[3.5rem] bg-muted/10 border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Core Profile Branding */}
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
           <div className="relative group">
              <div className={`w-40 h-40 rounded-[2.5rem] flex items-center justify-center transition-all bg-black/40 border-2 border-white/5 overflow-hidden group-hover:border-primary/50 ${profile.company_logo ? 'border-emerald-500/50' : 'border-dashed'}`}>
                 <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                  onChange={handleLogoUpload}
                 />
                 {profile.company_logo ? (
                   <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                      <Building2 className="w-16 h-16 text-emerald-500" />
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2 text-muted-foreground/30 animate-pulse">
                      <Camera className="w-10 h-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Add Logo</p>
                   </div>
                 )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                 <Camera className="w-5 h-5" />
              </div>
           </div>

           <div className="flex-1 space-y-6 w-full">
              <div className="space-y-3">
                 <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Mission Statement (Bio)</Label>
                 <Textarea 
                   placeholder="Briefly describe your workforce goals and project scope..." 
                   className="min-h-[160px] rounded-[2.5rem] bg-black/40 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] font-bold p-8 leading-relaxed shadow-inner"
                   value={profile.bio}
                   onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                 />
              </div>
           </div>
        </div>

        {/* Site Photos Visualization */}
        <div className="space-y-6 pt-6 border-t border-white/5">
           <div className="flex justify-between items-center px-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Site Photos (Max 3)</Label>
              <p className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest">{profile.site_photos.length} secured</p>
           </div>
           
           <div className="grid grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all bg-black/40 border-2 ${profile.site_photos[i] ? 'border-emerald-500/30' : 'border-dashed border-white/5 group hover:border-primary/30 cursor-pointer'}`}
                >
                   {profile.site_photos[i] ? (
                     <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                        <p className="text-[8px] text-muted-foreground font-bold truncate max-w-full italic uppercase">{profile.site_photos[i]}</p>
                     </div>
                   ) : (
                     <>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          multiple 
                          onChange={handlePhotoUpload}
                          disabled={isUploading}
                        />
                        <Upload className="w-8 h-8 text-muted-foreground/20" />
                        <p className="text-[8px] text-muted-foreground/30 font-black uppercase mt-2">Upload site</p>
                     </>
                   )}
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="flex justify-between pt-10">
        <Button 
          variant="ghost" 
          onClick={handleNext} 
          className="h-16 px-10 rounded-2xl font-black text-muted-foreground/40 hover:text-foreground transition-colors uppercase tracking-[0.2em] text-xs font-['Space_Grotesk']"
        >
          SKIP PROFILE DETAILS
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={loading || isUploading}
          className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 group"
        >
          {loading ? "SAVING..." : "FINALIZE HUB"}
          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardProfile;
