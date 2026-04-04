import React from 'react';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import {
  Bell, CheckCircle, IndianRupee, Briefcase, Star, ArrowUpRight, Zap, BookOpen
} from 'lucide-react';

const getIcon = (type) => {
  switch (type) {
    case 'bid_accepted': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'bid_rejected': return <Briefcase className="w-5 h-5 text-rose-500" />;
    case 'payment': return <IndianRupee className="w-5 h-5 text-green-500" />;
    case 'new_job': return <Zap className="w-5 h-5 text-primary" />;
    case 'upskill': return <BookOpen className="w-5 h-5 text-cyan-500" />;
    case 'rating': return <Star className="w-5 h-5 text-amber-500" />;
    default: return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
};

const getColor = (type) => {
  switch (type) {
    case 'bid_accepted': return 'border-green-500/20 bg-green-500/5';
    case 'bid_rejected': return 'border-rose-500/20 bg-rose-500/5';
    case 'payment': return 'border-green-500/20 bg-green-500/5';
    case 'new_job': return 'border-primary/20 bg-primary/5';
    case 'upskill': return 'border-cyan-500/20 bg-cyan-500/5';
    default: return 'border-white/5 bg-muted/5';
  }
};

const WorkerNotifications = () => {
  const { notifications, getTimeAgo } = useWorkerData();

  const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Alert Feed</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Notifications</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Unread</p>
          <p className="text-xl font-black text-primary font-['Space_Grotesk']">{notifications.filter(n => !n.read).length}</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">All Clear</p>
          <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">No notifications yet. We'll alert you when something happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((notif, i) => (
            <motion.div
              key={notif.id || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-2xl border transition-all hover:border-primary/20 ${!notif.read ? getColor(notif.type) : 'border-white/5 bg-transparent opacity-60'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl border ${!notif.read ? getColor(notif.type) : 'border-white/5 bg-muted/20'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-foreground font-['Space_Grotesk'] text-sm tracking-tight">{notif.title || notif.message}</p>
                      {notif.body && <p className="text-xs text-muted-foreground font-['Manrope'] mt-1 leading-relaxed">{notif.body}</p>}
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />}
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk'] mt-2">
                    {notif.created_at ? getTimeAgo(notif.created_at) : 'Just now'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WorkerNotifications;
