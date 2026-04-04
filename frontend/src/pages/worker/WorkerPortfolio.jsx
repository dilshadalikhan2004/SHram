import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { portfolioApi } from '../../lib/api';
import { toast } from 'sonner';
import { parseApiError } from '../../utils/errorUtils';
import {
  Camera, Plus, Trash2, Award, ExternalLink, CheckCircle, Image, Share2, Copy
} from 'lucide-react';

const WorkerPortfolio = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const publicUrl = `${window.location.origin}/p/${user?.id || user?.user_id}`;

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await portfolioApi.getMine();
      setItems(res.data || []);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'work_photo');
        await portfolioApi.add(formData);
      }
      toast.success(`${files.length} photo(s) uploaded!`);
      fetchPortfolio();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to upload'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await portfolioApi.delete(itemId);
      toast.success('Photo removed');
      fetchPortfolio();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to delete'));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Profile link copied!');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Proof of Work</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Portfolio</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Photos</p>
          <p className="text-xl font-black text-foreground font-['Space_Grotesk']">{items.length}</p>
        </div>
      </div>

      {/* Public Link */}
      <div className="p-6 glass-card rounded-[2rem] border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Shareable Profile</p>
          <p className="text-sm text-muted-foreground font-['Space_Grotesk'] font-medium truncate max-w-sm">{publicUrl}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 transition-all font-['Space_Grotesk']">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button onClick={() => window.open(publicUrl, '_blank')} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-['Space_Grotesk']">
            <ExternalLink className="w-4 h-4" /> View
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <label className="block p-12 glass-card rounded-[2.5rem] border-dashed border-2 border-white/10 hover:border-primary/30 transition-all cursor-pointer group text-center">
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className="w-16 h-16 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
          {uploading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-8 h-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          )}
        </div>
        <p className="font-black text-lg text-foreground font-['Space_Grotesk'] uppercase tracking-tight">
          {uploading ? 'Uploading...' : 'Add Work Photos'}
        </p>
        <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-1 font-medium opacity-60">
          Upload photos of completed projects to showcase your work
        </p>
      </label>

      {/* Photo Gallery */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square rounded-3xl overflow-hidden border border-white/5 group"
              >
                <img src={item.url || item.file_url} alt={item.description || 'Work photo'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => handleDelete(item.id)} className="p-3 rounded-xl bg-red-500/80 text-white hover:bg-red-500 transition-colors active:scale-95">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {item.description && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white font-['Space_Grotesk'] font-bold truncate">{item.description}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="text-center py-16">
          <Image className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-['Space_Grotesk'] text-sm font-medium">No photos yet. Upload your best work to attract employers.</p>
        </div>
      )}

      {/* Skill Badges */}
      <div className="p-8 glass-card rounded-[2.5rem] border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20"><Award className="w-5 h-5 text-green-500" /></div>
          <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">Skill Badges</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/20 border border-white/10 text-muted-foreground/60 font-['Space_Grotesk']">
            Complete skill tests to earn badges
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkerPortfolio;
