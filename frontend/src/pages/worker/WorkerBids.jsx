import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import HandshakeControl from '../../components/HandshakeControl';
import TTSButton from '../../components/TTSButton';
import {
  Briefcase, Clock, MessageSquare, CheckCircle, Smartphone, Activity, Terminal
} from 'lucide-react';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const WorkerBids = () => {
  const navigate = useNavigate();
  const { applications, getStatusColor, getTimeAgo, handleRequestRelease, fetchData } = useWorkerData();
  const { setShowChat, setSelectedChatUserId } = useOutletContext();
  const [activeHandshakeJobId, setActiveHandshakeJobId] = React.useState(null);
  const [showHandshake, setShowHandshake] = React.useState(false);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Transmission Log</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">My Bids</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Active Bids</p>
          <p className="text-xl font-black text-foreground font-['Space_Grotesk']">{applications.length}/10</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">No Bids Yet</p>
            <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">Browse jobs and place your first bid to get started.</p>
            <button onClick={() => navigate('/worker/home')} className="mt-8 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white font-['Space_Grotesk'] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
              Browse Jobs
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => (
            <motion.div key={app.id} variants={itemVariants} className="group relative p-8 glass-card rounded-[2rem] border-white/5 hover:border-primary/30 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusColor(app.status)}`}>{app.status}</span>
                      <span className="text-[10px] font-black text-muted-foreground/40 font-['Space_Grotesk'] uppercase tracking-widest">ID: {app.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-2xl text-foreground font-['Space_Grotesk'] tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/worker/jobs/${app.job_id}`)}>
                        {app.job?.title || 'Job'}
                      </h3>
                      <TTSButton
                        variant="icon"
                        size="sm"
                        text={`${app.job?.title || 'Job'}. Status: ${app.status}`}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs font-bold text-muted-foreground font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-primary" /> {getTimeAgo(app.created_at)}
                      </p>
                    </div>
                  </div>

                  {app.match_score && (
                    <div className="inline-flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">Match Score</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <div className={`h-full rounded-full ${app.match_score >= 80 ? 'bg-green-500' : app.match_score >= 50 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${app.match_score}%` }} />
                          </div>
                          <span className={`text-xs font-black font-['Space_Grotesk'] ${app.match_score >= 80 ? 'text-green-500' : app.match_score >= 50 ? 'text-primary' : 'text-amber-500'}`}>{app.match_score}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(app.status === 'selected' || app.status === 'accepted' || app.status === 'pending') && (
                    <div className="pt-2 flex flex-wrap gap-3">
                      <button onClick={() => { setSelectedChatUserId(app.job?.employer_id); setShowChat(true); }} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all font-['Space_Grotesk']">
                        <MessageSquare className="w-4 h-4 text-primary" /> Chat with Employer
                      </button>
                      {app.status === 'selected' && (
                        <button onClick={() => handleRequestRelease(app.job_id)} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 bg-primary shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all font-['Space_Grotesk']">
                          <CheckCircle className="w-4 h-4" /> Request Payout
                        </button>
                      )}
                      {(app.status === 'accepted' || app.status === 'selected') && (
                        <button onClick={() => { setActiveHandshakeJobId(app.job_id); setShowHandshake(true); }} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:brightness-110 active:scale-95 transition-all font-['Space_Grotesk'] border border-emerald-500/30">
                          <Smartphone className="w-4 h-4" /> Check-In
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0">
                  {app.status === 'in_progress' ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-muted/20 border border-white/5 flex items-center justify-center text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                      <Terminal className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Handshake inline */}
      {showHandshake && activeHandshakeJobId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] border-white/5 p-8 overflow-hidden">
          <HandshakeControl role="worker" jobId={activeHandshakeJobId} onSuccess={() => { setShowHandshake(false); fetchData(); }} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default WorkerBids;
