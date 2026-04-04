import React from 'react';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import HandshakeControl from '../../components/HandshakeControl';
import { Shield, MapPin, Clock } from 'lucide-react';

const WorkerHandshake = () => {
  const { applications, fetchData } = useWorkerData();
  const acceptedJobs = applications.filter(app => app.status === 'accepted' || app.status === 'selected');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Secure Check-In</p>
        <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Handshake</h2>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium">Enter the 4-digit code provided by your employer on-site to confirm attendance.</p>
      </div>

      {acceptedJobs.length === 0 ? (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">No Active Jobs</p>
          <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">Handshake is available when you have an accepted bid for today.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {acceptedJobs.map(app => (
            <div key={app.id} className="glass-card rounded-[2.5rem] border-white/5 p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-xl text-foreground font-['Space_Grotesk'] tracking-tight">{app.job?.title || 'Job'}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-['Space_Grotesk'] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {app.job?.location || 'On-site'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> Today</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  Ready
                </div>
              </div>
              <HandshakeControl role="worker" jobId={app.job_id} onSuccess={() => fetchData()} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WorkerHandshake;
