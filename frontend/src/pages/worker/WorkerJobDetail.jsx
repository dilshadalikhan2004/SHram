import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useWorkerData } from '../../context/WorkerDataContext';
import { Button } from '../../components/ui/button';
import MatchScoreCard from '../../components/MatchScoreCard';
import BidSuggestion from '../../components/BidSuggestion';
import BiddingModal from '../../components/BiddingModal';
import { DetailPageSkeleton } from '../../components/loading/PageSkeletons';
import {
  MapPin, IndianRupee, Building2, Zap, Star, Users, ArrowLeft, Bookmark, BookmarkCheck
} from 'lucide-react';

const API_URL = "https://api.shramsetu.in";

const WorkerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    profile, jobs, fetchData, hasApplied, isSaved, handleSaveJob, handleApply,
    getMatchColor, getMatchBg, calculateMatchScore
  } = useWorkerData();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);

  useEffect(() => {
    const findInLocal = (jobId) =>
      (jobs || []).find(
        (j) =>
          String(j?.id) === String(jobId) ||
          String(j?._id) === String(jobId)
      );

    const fetchJob = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');

      try {
        // 1) Try in-memory list first (fast, avoids unnecessary 404)
        const localMatch = findInLocal(id);
        if (localMatch) {
          setJob(localMatch);
          return;
        }

        // 2) Try API with route param id
        try {
          const res = await axios.get(`${API_URL}/api/jobs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res?.data) {
            setJob(res.data);
            return;
          }
        } catch (_) {
          // continue fallback
        }

        // 3) Refresh worker data once and try local again
        await fetchData();
        const refreshedLocal = findInLocal(id);
        if (refreshedLocal) {
          setJob(refreshedLocal);
          return;
        }

        // 4) If route id is Mongo _id but job has business id, try mapping via list
        const candidate = (jobs || []).find(
          (j) => String(j?._id) === String(id) || String(j?.id) === String(id)
        );
        if (candidate?.id && String(candidate.id) !== String(id)) {
          try {
            const byBusinessId = await axios.get(`${API_URL}/api/jobs/${candidate.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (byBusinessId?.data) {
              setJob(byBusinessId.data);
              return;
            }
          } catch (_) {}
        }

        setJob(null);
      } catch (err) {
        console.error('Failed to fetch job:', err);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, jobs, fetchData]);

  if (loading) return <DetailPageSkeleton />;

  if (!job) return (
    <div className="text-center py-32">
      <h2 className="text-2xl font-black font-['Space_Grotesk'] text-foreground mb-4">Job Not Found</h2>
      <Button onClick={() => navigate('/worker/jobs')} variant="ghost" className="text-primary">← Back to Jobs</Button>
    </div>
  );

  const matchScore = calculateMatchScore(job);
  const jobRef = job.id || job._id; // single safe id reference for child actions/components

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-[0.2em] font-['Space_Grotesk']">Back</span>
      </button>

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
                <Building2 className="w-4 h-4 text-primary" /> {job.company_name || 'Employer'}
              </p>
            </div>
            <span className={`inline-flex items-center px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest ${getMatchBg(matchScore)} ${getMatchColor(matchScore)}`}>
              {matchScore}% Match
            </span>
          </div>

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
                {job.experience_required || 0} <span className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Years+</span>
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

      {job.description && (
        <div className="p-10 glass-card rounded-[2.5rem] border-white/5 space-y-4">
          <p className="text-muted-foreground leading-relaxed font-medium font-['Manrope'] px-2">{job.description}</p>
        </div>
      )}

      <div className="p-10 glass-card rounded-[2.5rem] border-white/5 space-y-6">
        <div className="flex flex-wrap gap-2.5">
          {(job.skills_required || job.requirements || []).map(skill => (
            <span key={skill} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-white/10 text-foreground font-['Space_Grotesk']">
              {skill}
            </span>
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

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[2rem] overflow-hidden glass border border-white/5 shadow-inner">
            <MatchScoreCard jobId={jobRef} />
          </div>
          <div className="rounded-[2rem] overflow-hidden bg-muted/10 border border-white/5 p-1">
            <BidSuggestion jobId={jobRef} />
          </div>
        </div>
      )}

      <div className="sticky bottom-24 md:bottom-8 z-30 p-6 glass-card rounded-[2rem] border-white/5 shadow-2xl backdrop-blur-2xl flex gap-4">
        {!hasApplied(jobRef) ? (
          <>
            <Button
              onClick={() => setIsBiddingOpen(true)}
              className="flex-1 rounded-2xl h-14 bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Place Bid
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSaveJob(jobRef)}
              className="w-14 h-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10"
            >
              {isSaved(jobRef) ? <BookmarkCheck className="w-6 h-6 text-primary" /> : <Bookmark className="w-6 h-6" />}
            </Button>
          </>
        ) : (
          <button disabled className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 font-['Space_Grotesk'] cursor-not-allowed">
            Already Applied
          </button>
        )}
      </div>

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
