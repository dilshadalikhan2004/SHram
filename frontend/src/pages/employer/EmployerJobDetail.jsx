import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Briefcase, MapPin, 
  IndianRupee, Clock, Zap, CheckCircle,
  MoreVertical, ShieldCheck, UserCheck, 
  XCircle, Filter, Search, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useEmployerData } from '../../context/EmployerDataContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshData } = useEmployerData();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setApplicants(appRes.data);
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

  if (loading) return <div className="p-20 text-center animate-pulse uppercase tracking-[0.4em] font-black text-[10px] text-muted-foreground/30">Syncing Mission Intelligence...</div>;
  if (!job) return <div className="p-20 text-center uppercase tracking-widest text-rose-500 font-black">Mission Data Corrupted or Non-Existent</div>;

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
              <p className="text-3xl font-black text-emerald-500 font-['Space_Grotesk']">₹{(job.salary_paise / 100).toLocaleString()}<span className="text-xs text-muted-foreground/40"> / Unit</span></p>
           </div>
           <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground font-black text-[10px] uppercase tracking-widest">Terminate Mission</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* LEFT: MISSION SPECS */}
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

        {/* RIGHT: PERSONNEL TRACKING */}
        <div className="xl:col-span-2 space-y-8">
           <Tabs defaultValue="pending" className="space-y-8">
              <div className="flex items-center justify-between px-10 py-6 bg-black/20 rounded-[2.5rem] border border-white/5">
                 <TabsList className="bg-transparent gap-8 h-auto p-0">
                    <TabsTrigger value="pending" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-primary transition-all relative overflow-visible h-10">
                       Incoming Signals ({applicants.filter(a => a.status === 'pending').length})
                       <motion.div className="absolute -bottom-4 left-0 right-0 h-1 bg-primary rounded-full hidden data-[state=active]:block" layoutId="tab-underline" />
                    </TabsTrigger>
                    <TabsTrigger value="accepted" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-emerald-500 transition-all relative overflow-visible h-10">
                       Deployed Personnel ({applicants.filter(a => a.status === 'accepted').length})
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
                 {applicants.filter(a => a.status === 'pending').map((app, i) => (
                    <motion.div 
                      key={app._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group flex flex-col md:flex-row items-center justify-between gap-8"
                    >
                       <div className="flex items-center gap-6">
                          <div className="relative">
                             <div className="w-20 h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary font-black text-2xl font-['Space_Grotesk'] uppercase border-2 border-primary/20 overflow-hidden">
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
                                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {app.worker?.verified ? 'Verified' : 'General'}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="px-6 text-center border-r border-white/5">
                             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Proposed Signal</p>
                             <p className="text-xl font-black text-white font-['Space_Grotesk']">₹{(app.bid_amount / 100).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                             <Button onClick={() => handleApplication(app._id, 'accepted')} className="h-14 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-emerald-500/10"><UserCheck className="w-4 h-4" /> Recruit</Button>
                             <Button onClick={() => handleApplication(app._id, 'rejected')} variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-rose-500/10 hover:text-rose-500"><XCircle className="w-5 h-5" /></Button>
                             <Button variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-white/10" onClick={() => navigate(`/worker/profile/${app.worker?._id}`)}><ExternalLink className="w-5 h-5" /></Button>
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 {applicants.filter(a => a.status === 'pending').length === 0 && (
                    <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5">
                       <Users className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">No Active Signal Transmissions Detected</p>
                    </div>
                 )}
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobDetail;
