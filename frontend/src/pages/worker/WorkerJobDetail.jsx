import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useWorkerData } from '../../context/WorkerDataContext';
import { Button } from '../../components/ui/button';
import MatchScoreCard from '../../components/MatchScoreCard';
import BidSuggestion from '../../components/BidSuggestion';
import BiddingModal from '../../components/BiddingModal';
import {
  MapPin, IndianRupee, Building2, Zap, ChevronLeft, Star, Users,
  CheckCircle, Bookmark, BookmarkCheck, XCircle, Clock, ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WorkerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    profile, hasApplied, isSaved, handleSaveJob, handleApply,
    getMatchColor, getMatchBg, calculateMatchScore, getTimeAgo
  } = useWorkerData();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setJob(res.data);
      } catch (err) {
        console.error('Failed to fetch job:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!job) return (
    <div className="text-center py-32">
      <h2 className="text-2xl font-black font-['Space_Grotesk'] text-foreground mb-4">Job Not Found</h2>
      <Button onClick={() => navigate('/worker/home')} variant="ghost" className="text-primary">← Back to Home</Button>
    </div>
  );

  const matchScore = calculateMatchScore(job);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-[0.2em] font-['Space_Grotesk']">Back</span>
      </button>

      {/* Header */}
      <div className="p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              {job.is_boosted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20 font-['Space_Grotesk']">
                  <Zap className="w-3 h-3 fill-orange-500" /> High Demand
                </span>
              )}
              <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter leading-tight">{job.title}</h1>
              <p className="flex items-center gap-2 text-muted-foreground font-black font-['Space_Grotesk'] uppercase tracking-[0.1em] text-xs">
                <Building2 className="w-4 h-4 text-primary" /> {job.company_name}
              </p>
            </div>
            <span className={`inline-flex items-center px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest ${getMatchBg(matchScore)} ${getMatchColor(matchScore)}`}>
              {matchScore}% Match
            </span>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Pay Rate</p>
              <p className="text-3xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter flex items-center gap-1.5">
                <IndianRupee className="w-5 h-5 text-primary" /> ₹{job.pay_amount || (job.salary_paise ? job.salary_paise / 100 : 0)}
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-1">/ {job.pay_type || job.salary_type}</span>
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Location</p>
              <p className="text-xl font-black text-foreground font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> {job.location}
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Experience</p>
              <p className="text-2xl font-black text-[var(--color-primary)] font-['Space_Grotesk'] tracking-tighter italic">
                {job.experience_required} <span className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Years+</span>
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Vacancies</p>
              <p className="text-2xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter italic">
                {job.vacancies || 1} <span className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Open</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="p-10 glass-card rounded-[2.5rem] border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-white/5" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk'] whitespace-nowrap">Job Description</h4>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          <p className="text-muted-foreground leading-relaxed font-medium font-['Manrope'] px-2">{job.description}</p>
        </div>
      )}

      {/* Skills Required */}
      <div className="p-10 glass-card rounded-[2.5rem] border-white/5 space-y-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk']">Required Skills</h4>
        <div className="flex flex-wrap gap-2.5">
          {(job.skills_required || job.requirements || []).map(skill => (
            <span key={skill} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-white/10 text-foreground font-['Space_Grotesk'] hover:border-primary/40 transition-all">{skill}</span>
          ))}
        </div>

        <div className="flex items-center gap-6 py-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-xs font-black tracking-widest">{job.applicant_count || 0} bids placed</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span className="text-xs font-black tracking-widest text-amber-500">Employer: {job.employer_rating || 4.5}</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[2rem] overflow-hidden glass border border-white/5 shadow-inner">
            <MatchScoreCard jobId={job.id} />
          </div>
          <div className="rounded-[2rem] overflow-hidden bg-muted/10 border border-white/5 p-1">
            <BidSuggestion jobId={job.id} />
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="sticky bottom-24 md:bottom-8 z-30 p-6 glass-card rounded-[2rem] border-white/5 shadow-2xl backdrop-blur-2xl flex gap-4">
        {!hasApplied(job.id) ? (
          <>
            <Button
              onClick={() => setIsBiddingOpen(true)}
              className="flex-1 rounded-2xl h-14 bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Place Bid
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSaveJob(job.id)}
              className="w-14 h-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10"
            >
              {isSaved(job.id) ? <BookmarkCheck className="w-6 h-6 text-primary" /> : <Bookmark className="w-6 h-6" />}
            </Button>
          </>
        ) : (
          <button disabled className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 font-['Space_Grotesk'] cursor-not-allowed">
            Already Applied
          </button>
        )}
      </div>

      {/* Bidding Modal */}
      <BiddingModal
        isOpen={isBiddingOpen}
        onClose={() => setIsBiddingOpen(false)}
        job={job}
        onSubmit={(payload) => { handleApply(payload); setIsBiddingOpen(false); }}
      />
    </motion.div>
  );
};

export default WorkerJobDetail;
