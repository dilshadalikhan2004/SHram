import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, MapPin,
  Clock, CheckCircle,
  ShieldCheck, UserCheck,
  XCircle, Filter, Search, ExternalLink, Star, BadgeCheck, BriefcaseBusiness
} from 'lucide-react';
import axios from 'axios';
import { useEmployerData } from '../../context/EmployerDataContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { DetailPageSkeleton } from '../../components/loading/PageSkeletons';
import { toast } from 'sonner';
import { jobsApi } from '../../lib/api';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

// ✅ Normalize applicant payload from different backend shapes
const normalizeApplicant = (app = {}) => {
  const worker = app.worker || app.worker_profile || {};

  return {
    ...app,
    worker: {
      ...worker,
      full_name: worker.full_name || worker.name || 'Worker',
      primary_skill: worker.primary_skill || worker.category || 'General',
      verified: worker.verified === true || worker.phone_verified === true || app.verified === true,
      verified_skills: Array.isArray(worker.verified_skills)
        ? worker.verified_skills
        : (Array.isArray(app.verified_skills) ? app.verified_skills : []),
      rating: Number(worker.rating ?? app.rating ?? 0),
      total_jobs_completed: Number(worker.total_jobs_completed ?? app.total_jobs_completed ?? 0),
      reliability_score: Number(worker.reliability_score ?? app.reliability_score ?? 0),
      _id: worker._id || app.worker_id || app.workerId || null,
    },
    bid_amount: Number(app.bid_amount ?? app.bid_amount_paise ?? 0),
    status: app.status || 'pending',
  };
};

// ✅ Additive trust widget (no logic break, fallback-safe)
const WorkerTrustMini = ({ worker = {}, app = {} }) => {
  const verifiedSkills = Array.isArray(worker.verified_skills) ? worker.verified_skills.length : 0;
  const completedJobs = Number(worker.total_jobs_completed ?? app.total_jobs_completed ?? 0);
  const rating = Number(worker.rating ?? app.rating ?? 0);
  const reliability = Number(worker.reliability_score ?? app.reliability_score ?? 0);

  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Verified Skills</p>
        <p className="text-sm font-black">{verifiedSkills}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Rating</p>
        <p className="text-sm font-black flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          {rating > 0 ? rating.toFixed(1) : '—'}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Completed</p>
        <p className="text-sm font-black flex items-center gap-1">
          <BriefcaseBusiness className="w-3.5 h-3.5 text-primary" />
          {completedJobs}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Reliability</p>
        <p className="text-sm font-black flex items-center gap-1">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
          {reliability > 0 ? `${Math.round(reliability)}%` : '—'}
        </p>
      </div>
    </div>
  );
};

const EmployerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshData } = useEmployerData();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const [jobRes, appRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/jobs/${id}/applicants`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setJob(jobRes.data);

      const normalizedApplicants = (Array.isArray(appRes.data) ? appRes.data : []).map(normalizeApplicant);
      setApplicants(normalizedApplicants);
    } catch (err) {
      toast.error("Failed to retrieve mission data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplication = async (applicantId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/jobs/${id}/applicants/${applicantId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Personnel status updated to ${status.toUpperCase()}`);
      fetchJobDetail();
      refreshData();
    } catch (err) {
      toast.error("Status synchronization failed.");
    }
  };

  const handleCloseJob = async () => {
    if (!job) return;
    setIsClosing(true);
    try {
      await jobsApi.updateStatus(job.id || id, 'completed');
      toast.success("Job closed successfully");
      fetchJobDetail();
      refreshData();
    } catch (err) {
      toast.error("Failed to close job");
    } finally {
      setIsClosing(false);
    }
  };

  const [ratingModal, setRatingModal] = useState({ open: false, worker: null, score: 5, comment: '' });

  const handleRateWorker = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/ratings/bilateral`, {
        target_id: ratingModal.worker._id,
        job_id: id,
        score: ratingModal.score,
        comment: ratingModal.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Reliability score for ${ratingModal.worker.full_name} updated!`);
      setRatingModal({ open: false, worker: null, score: 5, comment: '' });
      fetchJobDetail();
    } catch (err) {
      toast.error("Feedback transmission failed.");
    }
  };

  if (loading) return <DetailPageSkeleton />;
  if (!job) return <div className="p-20 text-center uppercase tracking-widest text-rose-500 font-black">Mission Data Corrupted or Non-Existent</div>;

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const acceptedApplicants = applicants.filter(a => a.status === 'accepted');
  const isClosed = job.status && job.status !== 'open';

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-black/20 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(-1)} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:text-primary transition-all group">
            <ArrowLeft className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest">{job.category}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 font-['Space_Grotesk']">Ref: {id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className="text-4xl font-black font-['Space_Grotesk'] uppercase tracking-tight">{job.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6 border-l border-white/5 pl-8">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mb-2">Escrow Protected Payout</p>
            <p className="text-3xl font-black text-emerald-500 font-['Space_Grotesk']">
              ₹{((job.salary_paise || 0) / 100).toLocaleString()}
              <span className="text-xs text-muted-foreground/40"> / Unit</span>
            </p>
          </div>
          <Button
            onClick={handleCloseJob}
            disabled={isClosed || isClosing}
            className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground font-black text-[10px] uppercase tracking-widest"
          >
            {isClosed ? 'Job Closed' : isClosing ? 'Closing...' : 'Close Job'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* LEFT */}
        <div className="xl:col-span-1 space-y-8">
          <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 font-['Space_Grotesk']">Technical Specifications</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Users className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Required Units</p>
                    <p className="font-black font-['Space_Grotesk'] uppercase">{job.team_size || 1} {job.hire_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500"><MapPin className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Geo Coordinates</p>
                    <p className="font-black font-['Space_Grotesk'] truncate uppercase">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500"><Clock className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Duration Estimated</p>
                    <p className="font-black font-['Space_Grotesk'] uppercase">{job.estimated_duration || 'Scheduled'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 font-['Space_Grotesk']">Mission Directives</h3>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">
                {job.description || "No specific technical directives provided for this deployment."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-2 space-y-8">
          <Tabs defaultValue="pending" className="space-y-8">
            <div className="flex items-center justify-between px-10 py-6 bg-black/20 rounded-[2.5rem] border border-white/5">
              <TabsList className="bg-transparent gap-8 h-auto p-0">
                <TabsTrigger value="pending" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-primary">
                  Incoming Signals ({pendingApplicants.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-emerald-400">
                  Deployed Personnel ({acceptedApplicants.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                  <Search className="w-4 h-4 mr-3 text-muted-foreground/40" />
                  <input className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest w-32" placeholder="Search force..." />
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl border border-white/5"><Filter className="w-4 h-4 text-muted-foreground" /></Button>
              </div>
            </div>

            <TabsContent value="pending" className="grid grid-cols-1 gap-6 pt-0">
              {pendingApplicants.map((app, i) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary font-black text-2xl font-['Space_Grotesk'] uppercase border-2 border-white/10">
                          {app.worker?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-4 border-background shadow-lg">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-['Space_Grotesk'] uppercase tracking-tight">{app.worker?.full_name}</h4>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">
                          <span className="text-primary italic">{app.worker?.primary_skill || 'Laborer'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {app.worker?.verified ? 'Verified' : 'General'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="px-6 text-center border-r border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Proposed Signal</p>
                        <p className="text-xl font-black text-white font-['Space_Grotesk']">₹{((app.bid_amount || 0) / 100).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleApplication(app._id, 'accepted')} className="h-14 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> Recruit
                        </Button>
                        <Button onClick={() => handleApplication(app._id, 'rejected')} variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-rose-500/10 hover:text-rose-500">
                          <XCircle className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-white/10"
                          onClick={() => app.worker?._id && navigate(`/worker/profile/${app.worker._id}`)}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Trust proof strip */}
                  <WorkerTrustMini worker={app.worker || {}} app={app} />
                </motion.div>
              ))}

              {pendingApplicants.length === 0 && (
                <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5">
                  <Users className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">
                    No Active Signal Transmissions Detected
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="accepted" className="grid grid-cols-1 gap-6 pt-0">
              {acceptedApplicants.map((app, i) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black uppercase">{app.worker?.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{app.worker?.primary_skill || 'Worker'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={() => setRatingModal({ open: true, worker: app.worker, score: 5, comment: '' })}
                        className="h-10 px-4 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest"
                      >
                        Rate Deployment
                      </Button>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Accepted
                      </span>
                    </div>
                  </div>
                  <WorkerTrustMini worker={app.worker || {}} app={app} />
                </motion.div>
              ))}
              {acceptedApplicants.length === 0 && (
                <div className="p-16 text-center rounded-[2rem] border border-dashed border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-muted-foreground/40 font-black">
                  No accepted personnel yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-black font-['Space_Grotesk'] uppercase italic">Rate Deployment Performance</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Operator: {ratingModal.worker?.full_name}</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setRatingModal({ ...ratingModal, score: star })}
                    className={`transition-all ${ratingModal.score >= star ? 'text-amber-400 scale-110' : 'text-white/10'}`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>

              <textarea 
                className="w-full h-32 bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-primary/50 transition-all text-sm font-bold"
                placeholder="Technical feedback (optional)..."
                value={ratingModal.comment}
                onChange={(e) => setRatingModal({ ...ratingModal, comment: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setRatingModal({ ...ratingModal, open: false })} variant="ghost" className="flex-1 h-12 rounded-xl border border-white/5 font-black uppercase text-[10px]">Abort</Button>
              <Button onClick={handleRateWorker} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-[10px] tracking-widest">Transmit Rating</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployerJobDetail;
