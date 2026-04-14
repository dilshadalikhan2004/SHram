import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Trash2, ArrowRight, SkipForward, Image } from 'lucide-react';
import { portfolioApi } from '../../../lib/api';
import { toast } from 'sonner';
import { parseApiError } from '../../../utils/errorUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const OnboardPortfolio = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedPhotos = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'work_photo');
        const res = await portfolioApi.add(formData);
        uploadedPhotos.push(res.data);
      }
      setPhotos([...photos, ...uploadedPhotos]);
      toast.success(`${files.length} photo(s) uploaded!`);
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to upload photo'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await portfolioApi.delete(itemId);
      setPhotos(photos.filter(p => p.id !== itemId));
    } catch (err) {
      toast.error('Failed to delete photo');
    }
  };

  const handleNext = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          step: 'portfolio',
          data: { has_portfolio: photos.length > 0 }
        })
      });
    } catch (e) {
      console.warn(e);
    }
    navigate('/worker/onboard/done');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Camera className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Show Case</h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium">Upload up to 3 photos of your past work (optional)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {photos.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 group"
            >
              <img src={p.url || p.file_url} alt="Work" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-2 right-2 p-2 rounded-xl bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 shadow-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {photos.length < 3 && (
          <label className="aspect-square rounded-[2rem] border-dashed border-2 border-white/10 hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center p-4">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <div className={`p-4 rounded-full bg-muted/20 text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-all ${uploading ? 'animate-spin' : ''}`}>
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 font-['Space_Grotesk']">ADD PHOTO</p>
          </label>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleNext}
          className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] flex items-center justify-center gap-3"
        >
          {photos.length > 0 ? 'Continue' : 'Skip & Continue'} <ArrowRight className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => navigate('/worker/onboard/done')}
          className="w-full py-4 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary transition-colors font-['Space_Grotesk'] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <SkipForward className="w-4 h-4" /> I'll do this later
        </button>
      </div>
    </div>
  );
};

export default OnboardPortfolio;
