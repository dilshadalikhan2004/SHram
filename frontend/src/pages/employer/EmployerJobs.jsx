import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, PlusCircle, Search, Filter, 
  MapPin, Users, Zap, Clock, ChevronRight,
  MoreVertical, Edit3, Trash2, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployerData } from '../../context/EmployerDataContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const EmployerJobs = () => {
  const navigate = useNavigate();
  const { myJobs, loading } = useEmployerData();

  if (loading) return <div className="p-20 text-center animate-pulse uppercase tracking-[0.4em] font-black text-[10px] text-muted-foreground/30 italic">Decrypting Mission Logs...</div>;

  const JobCard = ({ job }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/10 text-muted-foreground'}`}>
                {job.status || 'ACTIVE'}
             </div>
             {job.is_urgent && <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-500"><Zap className="w-3 h-3 fill-orange-500" /> Urgent</div>}
          </div>
          <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/employer/jobs/${job._id}`)}>{job.title}</h3>
          <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
             <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /> {job.location || 'Remote'}</div>
             <div className="flex items-center gap-2"><Users className="w-3 h-3 text-primary" /> {job.team_size || 1} Person Unit</div>
             <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-primary" /> {job.estimated_duration || '3 Weeks'}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-l border-white/5 pl-6">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Assigned Budget</p>
              <p className="text-2xl font-black text-emerald-500 font-['Space_Grotesk']">₹{(job.salary_paise / 100).toLocaleString()}<span className="text-[10px] text-muted-foreground/30"> / day</span></p>
           </div>
           <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><ChevronRight className="w-6 h-6" /></Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
           <h1 className="text-5xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none">Mission <span className="text-primary italic">Ledger</span></h1>
           <p className="text-xs font-bold uppercase tracking-[0.2em] font-['Space_Grotesk'] text-muted-foreground/40 italic">Total Logged Deployments: {myJobs.length}</p>
        </div>
        <Button 
          onClick={() => navigate('/employer/jobs/new')}
          className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-primary/20"
        >
          <PlusCircle className="w-5 h-5" /> Deploy New Mission
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-10">
        <div className="flex items-center justify-between px-2 pt-2 pb-6 border-b border-white/5">
           <TabsList className="bg-transparent border-none gap-8 h-auto p-0">
              <TabsTrigger value="active" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-primary transition-all relative overflow-visible h-10">
                 Active Operations
                 <motion.div className="absolute -bottom-6 left-0 right-0 h-1 bg-primary rounded-full hidden data-[state=active]:block" layoutId="active-tab" />
              </TabsTrigger>
              <TabsTrigger value="closed" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-primary transition-all relative overflow-visible h-10">
                 Completed Missions
              </TabsTrigger>
              <TabsTrigger value="drafts" className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 data-[state=active]:text-primary transition-all relative overflow-visible h-10">
                 Unsent Transmissions
              </TabsTrigger>
           </TabsList>

           <div className="flex items-center gap-4">
              <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 focus-within:border-primary/30 transition-all group">
                 <Search className="w-4 h-4 mr-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                 <input className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-40" placeholder="Filter ID..." />
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl border border-white/5 hover:bg-white/5"><Filter className="w-4 h-4 text-muted-foreground" /></Button>
           </div>
        </div>

        <TabsContent value="active" className="space-y-6 pt-0">
           {myJobs.filter(j => j.status === 'active' || !j.status).map(job => (
              <JobCard key={job._id} job={job} />
           ))}
           {myJobs.filter(j => j.status === 'active' || !j.status).length === 0 && (
              <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5">
                 <Briefcase className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">No Active Deployments Detected</p>
              </div>
           )}
        </TabsContent>

        <TabsContent value="closed">
           <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">Mission Archives Encrypted</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerJobs;
