import React from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, Users, Briefcase, Zap, 
  TrendingUp, TrendingDown, Clock, ShieldCheck,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  UserCheck, AlertCircle, Sparkles, Building2
} from 'lucide-react';
import { useEmployerData } from '../../context/EmployerDataContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';

const EmployerHome = () => {
  const navigate = useNavigate();
  const { stats, loading, myJobs, applicants } = useEmployerData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-['Space_Grotesk'] uppercase tracking-widest font-black text-xs animate-pulse">Initializing Control Center...</p>
      </div>
    );
  }

  const quickStats = [
    { label: 'Active Missions', value: stats.active_jobs, icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'Deployed Force', value: stats.total_hired, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Pending Payouts', value: `₹${stats.pending_payments}`, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Attendance', value: `${stats.attendance_today}%`, icon: UserCheck, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  const recentActivity = [
    { id: 1, type: 'applicant', title: '5 New Tilers Applied', job: 'Noida Luxury Residences', time: '12m ago', status: 'new' },
    { id: 2, type: 'payment', title: 'Escrow Released', job: 'Gurgaon Metro Phase 2', time: '1h ago', status: 'confirmed' },
    { id: 3, type: 'attendance', title: 'Daily Check-in Complete', job: 'Multiple Sites', time: '3h ago', status: 'done' },
    { id: 4, type: 'alert', title: '3 Workers Churning', job: 'Borivali Express Hub', time: '5h ago', status: 'critical' },
  ];

  return (
    <div className="space-y-12">
      {/* Header section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
          >
            Mission <span className="text-primary italic">Control</span>
          </motion.h1>
          <div className="flex items-center gap-4 text-muted-foreground/60">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest uppercase italic">
                <Clock className="w-3 h-3 text-primary" />
                Live Feed Active
             </div>
             <p className="text-xs font-bold uppercase tracking-[0.2em] font-['Space_Grotesk']">Industrial HQ Operational Matrix</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
           <Button 
            onClick={() => navigate('/employer/jobs/new')}
            className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-3 shadow-3xl shadow-primary/20 group overflow-hidden relative"
           >
              <div className="absolute inset-0 bg-white/10 translate-y-16 group-hover:translate-y-0 transition-transform duration-500" />
              <PlusCircle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Post New Mission</span>
           </Button>
           <Button 
            variant="outline"
            className="h-16 px-10 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-foreground font-black text-xs uppercase tracking-widest gap-2 shadow-xl"
           >
              Release Bulk Payroll
           </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {quickStats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-10 rounded-[2.5rem] ${stat.bg} ${stat.border} border-2 flex flex-col justify-between group h-64 relative overflow-hidden`}
          >
            <div className="absolute -right-8 -bottom-8 opacity-5 transition-transform group-hover:scale-150 group-hover:rotate-12 duration-700">
               <stat.icon className="w-48 h-48" />
            </div>
            <div className="flex justify-between items-start">
               <div className={`p-4 rounded-2xl ${stat.bg} border-2 ${stat.border} shadow-xl shadow-black/20`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
               </div>
               <div className="bg-black/20 px-3 py-1 rounded-full flex items-center gap-1 border border-white/5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500">+12%</span>
               </div>
            </div>
            <div className="space-y-1">
               <h3 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight group-hover:translate-x-2 transition-transform duration-300">{stat.value}</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20">
        {/* Recent Activity */}
        <Card className="xl:col-span-2 glass-card border-white/5 rounded-[3rem] shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="p-10 flex flex-row items-center justify-between">
             <div className="space-y-1">
                <CardTitle className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Signal Feed</CardTitle>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Live Operational Stream</CardTitle>
             </div>
             <Button variant="ghost" className="rounded-xl font-black text-[10px] tracking-widest text-primary uppercase">Archives <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-4">
             {recentActivity.map((activity, i) => (
                <div key={activity.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group/item">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110 group-hover/item:rotate-3 ${
                      activity.status === 'critical' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' : 
                      activity.status === 'new' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {activity.type === 'alert' ? <AlertCircle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-black font-['Space_Grotesk'] text-lg uppercase tracking-tight">{activity.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        <span className="text-primary italic">{activity.job}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity"><ArrowUpRight className="w-5 h-5 text-primary" /></Button>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* AI Insight Stack */}
        <div className="space-y-6">
           <div className="p-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-10 -translate-y-10" />
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                    <Zap className="w-5 h-5 fill-white" />
                 </div>
                 <h3 className="text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight">AI Deployment Lead</h3>
              </div>
              <div className="space-y-4">
                 <p className="text-sm font-bold text-foreground leading-relaxed italic">
                   "Operational efficiency is dropping in 2 units. I recommend increasing the daily rate in <span className="text-primary font-black uppercase underline decoration-2 underline-offset-4 cursor-pointer">Sector 4</span> to re-attract verified laborers."
                 </p>
                 <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl overflow-hidden group-hover:scale-[1.02] transition-transform">
                    Execute Optimization
                 </Button>
              </div>
           </div>

           <Card className="glass-card border-white/5 rounded-[3rem] p-10 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Force Breakdown</h3>
                 <Users className="w-4 h-4 text-muted-foreground/20" />
              </div>
              <div className="space-y-6">
                 {[
                   { label: 'Masonry', count: 42, color: 'bg-primary' },
                   { label: 'Electrical', count: 28, color: 'bg-orange-400' },
                   { label: 'Plumbing', count: 15, color: 'bg-amber-500' }
                 ].map((unit, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span>{unit.label} ({unit.count})</span>
                          <span className="text-muted-foreground/40">{Math.round((unit.count / 85) * 100)}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(unit.count / 85) * 100}%` }}
                            transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                            className={`h-full ${unit.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployerHome;
