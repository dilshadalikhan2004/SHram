import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, IndianRupee, MessageSquare, Zap, Sparkles, 
  ChevronRight, AlertCircle, ShieldCheck, ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTranslation } from '../context/TranslationContext';
import { bidSuggestionApi } from '../lib/api';

const BiddingModal = ({ job, isOpen, onClose, onApply }) => {
  const { t } = useTranslation();
  const [bidAmount, setBidAmount] = useState(job?.salary_paise ? job.salary_paise / 100 : job?.pay_amount || '');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (isOpen && job) {
      setBidAmount(job.salary_paise ? job.salary_paise / 100 : job.pay_amount || '');
      fetchSuggestion();
    }
  }, [isOpen, job]);

  const fetchSuggestion = async () => {
    try {
      const res = await bidSuggestionApi.get(job.id);
      setSuggestion(res.data);
    } catch (err) {
      console.warn("Could not fetch bid suggestion");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onApply({
        job_id: job.id,
        bid_amount_paise: parseInt(bidAmount) * 100,
        proposal_message: proposal,
        quick_apply: false
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-card border border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">Mission Proposal</span>
                  {job.is_urgent && <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-500 uppercase tracking-widest">Urgent</span>}
                </div>
                <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tight uppercase">{job.title}</h2>
                <p className="text-muted-foreground text-sm font-medium mt-1">Configure your deployment terms for this mission.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Bid Amount */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground font-['Space_Grotesk']">Your Proposed Pay (₹)</label>
                  {suggestion && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      <Sparkles className="w-3 h-3" /> Market Suggestion: ₹{suggestion.recommended_pay}
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary transition-colors group-focus-within:text-foreground" />
                  <input 
                    type="number"
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-muted/20 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-2xl font-black font-['Space_Grotesk'] focus:outline-none focus:border-primary/40 transition-all"
                    placeholder="Enter amount..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">/{job.salary_type || 'day'}</div>
                </div>
                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider">Default mission rate: ₹{job.salary_paise ? job.salary_paise / 100 : job.pay_amount}</p>
              </div>

              {/* Proposal Message */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground font-['Space_Grotesk'] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Proposal Briefing
                </label>
                <textarea 
                  required
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  className="w-full bg-muted/20 border border-white/5 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-primary/40 transition-all min-h-[120px] resize-none"
                  placeholder="Tell the employer why you're the best fit (e.g., 'Available immediately, expert in electrical wiring'...)"
                />
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-foreground leading-tight tracking-wider">Secure Escrow</p>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Payment Protection Active</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-foreground leading-tight tracking-wider">Fast Track</p>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Direct Signal to Employer</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-xl font-black uppercase tracking-tighter shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? 'Transmitting Signal...' : (
                  <>
                    Initialize Deployment <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BiddingModal;
