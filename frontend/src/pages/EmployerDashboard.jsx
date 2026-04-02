import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  Building2, Sun, Moon, LogOut, Search, MapPin, IndianRupee, 
  Briefcase, Clock, Star, Bell, MessageSquare, User, ChevronRight,
  Filter, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Plus, Sparkles, Shield, Users, Wallet, Play, Zap, Target,
  LayoutDashboard, Activity, Terminal, ShieldCheck, Share2, FilterIcon,
  PlusSquare, FileText, BarChart3, Settings, Menu, X, ArrowUpRight,
  UserCheck, UserX, UserPlus, Clock4, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import SectorIcon from '../components/SectorIcon';
import ChatPanel from '../components/ChatPanel';
import LanguageSelector from '../components/LanguageSelector';
import EmployerAnalytics from '../components/EmployerAnalytics';
import LocationPicker from '../components/LocationPicker';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('dashboard');
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    category: '',
    skills_required: [],
    pay_type: 'daily',
    pay_amount: '',
    location: '',
    experience_required: 0,
    duration: '',
    vacancies: 1,
    is_asap: false,
    broadcast_radius: 5
  });

  useEffect(() => {
    document.title = t('hq_title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('hq_desc'));
  }, [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [jobsRes, profileRes, applicantsRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/employer`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/employer/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/applications/employer`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setJobs(jobsRes.data);
      setProfile(profileRes.data);
      setApplicants(applicantsRes.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: newJob.title,
        description: newJob.description || '',
        category: newJob.category || 'other',
        location: newJob.location || 'Remote',
        salary_paise: Math.round(parseFloat(newJob.pay_amount || 0) * 100),
        salary_type: newJob.pay_type || 'daily',
        requirements: newJob.skills_required || []
      };
      
      await axios.post(`${API_URL}/api/jobs`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Mission Deployed! Broadcast active.');
      setShowCreateJob(false);
      fetchData();
    } catch (error) {
      toast.error(parseApiError(error, 'Deployment failed'));
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/applications/${appId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Candidate status: ${status.toUpperCase()}`);
      if (selectedJob) fetchApplicants(selectedJob._id);
    } catch (error) {
      toast.error(parseApiError(error, 'Status update failed'));
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplicants(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('overview') },
    { id: 'jobs', icon: Briefcase, label: t('jobs') },
    { id: 'applicants', icon: Users, label: t('applicants_label') },
    { id: 'analytics', icon: BarChart3, label: t('analytics') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-[#0A0A0B]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Terminal className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="employer-theme min-h-screen bg-background dark:bg-[#0A0A0B] text-foreground font-['Manrope'] selection:bg-primary/30 relative">
      {/* ─── BACKGROUND MESH ─── */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      {/* ─── TOP NAV ─── */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex justify-between items-center glass border-b border-white/5 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-500 font-['Space_Grotesk'] tracking-tighter uppercase">
              SHRAMSETU<span className="text-foreground"> HQ</span>
            </h1>
          </motion.div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center h-11 px-4 rounded-xl bg-muted/20 border border-white/5 focus-within:border-primary/40 transition-all group">
            <Search className="w-4 h-4 mr-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              className="bg-transparent border-none focus:outline-none text-xs w-64 font-['Space_Grotesk'] font-bold tracking-widest placeholder:text-muted-foreground/30" 
              placeholder={t('query_logs')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 h-11 px-2 rounded-xl bg-muted/20 border border-white/5">
            <LanguageSelector variant="ghost" />
            <div className="w-px h-5 bg-white/5 mx-2" />
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-all hover:bg-white/5 group">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
            <button onClick={() => setShowChat(!showChat)} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </button>
            <div className="w-px h-5 bg-white/5 mx-2" />
            <button onClick={handleLogout} className="p-2 rounded-lg transition-all hover:bg-rose-500/10 group">
              <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-rose-500" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SIDEBAR ─── */}
      <aside className={`fixed left-0 top-0 h-full z-40 flex flex-col pt-28 pb-10 px-6 bg-background/80 dark:bg-[#0A0A0B]/80 border-r border-white/5 dark:border-white/5 border-black/5 backdrop-blur-3xl transition-all duration-500 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="mb-12 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]" />
            <h3 className={`text-[10px] uppercase font-black tracking-[0.4em] text-primary font-['Space_Grotesk'] transition-opacity duration-300 ${!isSidebarOpen && 'opacity-0'}`}>{t('dashboard')}</h3>
          </div>
          <p className={`text-[9px] uppercase tracking-[0.3em] text-muted-foreground/30 font-bold transition-opacity duration-300 ${!isSidebarOpen && 'opacity-0'}`}>{t('active_session')}</p>
        </div>

        <nav className="space-y-3 flex-1">
          {sidebarItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setSidebarTab(item.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all group relative overflow-hidden ${
                sidebarTab === item.id 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5' 
                : 'text-muted-foreground/40 hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {sidebarTab === item.id && (
                <motion.div layoutId="nav-bg-employer" className="absolute inset-y-0 left-0 w-1.5 bg-primary rounded-full" />
              )}
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${sidebarTab === item.id ? 'fill-primary/20' : ''}`} />
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] font-['Space_Grotesk'] transition-all duration-300 ${!isSidebarOpen ? 'opacity-0 translate-x-10' : 'opacity-100'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className={`mt-auto p-6 rounded-3xl bg-muted/20 border border-white/5 transition-all duration-500 ${!isSidebarOpen && 'opacity-0 scale-90'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border border-white/10">
              <AvatarImage src={profile?.company_logo} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">HQ</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate font-['Space_Grotesk'] uppercase">{profile?.company_name || 'Organization'}</p>
              <Badge variant="outline" className="text-[8px] h-4 font-black bg-primary/10 border-primary/20 text-primary uppercase">Verified Employer</Badge>
            </div>
          </div>
          <Button onClick={() => navigate('/employer/profile/edit')} variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest h-9 hover:bg-primary/10 hover:text-primary border border-white/5">Profile Config</Button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className={`transition-all duration-500 pt-32 pb-20 px-8 ${isSidebarOpen ? 'pl-80' : 'pl-32'}`}>
        <AnimatePresence mode="wait">
          {sidebarTab === 'dashboard' && (
            <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: t('active_jobs'), value: jobs.length, icon: Briefcase, color: 'text-primary' },
                  { label: t('total_applicants'), value: applicants.length, icon: Users, color: 'text-rose-400' },
                  { label: t('engagement_rate'), value: '92%', icon: Activity, color: 'text-amber-400' },
                  { label: t('reliability'), value: '4.9', icon: Star, color: 'text-amber-400' }
                ].map((stat, i) => (
                  <motion.div key={i} variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl bg-muted/30 group-hover:bg-primary/20 transition-colors`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-[0.3em] uppercase mb-1">{stat.label}</p>
                    <p className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Main Action Hub */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex justify-between items-end mb-2 px-2">
                    <div>
                      <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-1">{t('operational_matrix')}</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('active_deployments')}</p>
                    </div>
                    <Button onClick={() => setShowCreateJob(true)} className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-xl shadow-primary/20 group">
                      <PlusSquare className="w-5 h-5 mr-2" />
                      {t('initiate_mission')}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {jobs.length > 0 ? (
                      jobs.slice(0, 5).map((job, i) => (
                        <motion.div 
                          key={job._id} 
                          variants={itemVariants}
                          className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex items-center justify-between group cursor-pointer"
                          onClick={() => { setSelectedJob(job); setSidebarTab('jobs'); }}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all shadow-inner">
                              <SectorIcon sector={job.category} className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold font-['Space_Grotesk'] group-hover:text-primary transition-colors">{job.title}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                  <IndianRupee className="w-3.5 h-3.5" />
                                  {job.pay_amount}/{job.pay_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="rounded-lg h-9 px-4 font-bold border-white/5 bg-muted/20 text-xs tracking-widest uppercase">
                              {job.vacancies} OPENINGS
                            </Badge>
                            <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-20 text-center glass-card rounded-[3rem] border border-dashed border-white/10 opacity-40">
                        <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                        <p className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-[0.2em]">{t('no_transmissions')}</p>
                        <p className="text-[10px] uppercase tracking-widest mt-2">{t('init_mission_tip') || 'Initialize your first workforce request above'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="px-2">
                    <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-1">{t('applicants_label')}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('recent_apps') || 'Recent Applications'}</p>
                  </div>
                  <div className="glass-card rounded-[3rem] p-8 border border-white/5 min-h-[400px]">
                    <div className="space-y-6">
                      {applicants.length > 0 ? (
                        applicants.slice(0, 5).map((app, i) => (
                          <div key={app._id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="w-12 h-12 border-2 border-border/50">
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">WK</AvatarFallback>
                                </Avatar>
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-background dark:border-[#0A0A0B]" />
                              </div>
                              <div>
                                <p className="text-sm font-black font-['Space_Grotesk'] uppercase tracking-tight">{app.worker_name || t('candidate')}</p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{t('applied_label')}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center opacity-30">
                          <Users className="w-10 h-10 mx-auto mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">{t('no_applicants')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {sidebarTab === 'analytics' && (
             <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <EmployerAnalytics />
             </motion.div>
          )}
          
          {sidebarTab === 'jobs' && (
             <motion.div key="jobs" variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-1">{t('mission_log')}</h2>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('manage_workforce')}</p>
                 </div>
                 <Button onClick={() => setShowCreateJob(true)} className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-xl shadow-primary/20">
                   <PlusSquare className="w-5 h-5 mr-2" /> {t('create_new')}
                 </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {jobs.map((job) => (
                   <motion.div key={job._id || job.id} variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group flex flex-col">
                     <div className="flex items-start justify-between mb-4">
                       <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all shadow-inner">
                         <SectorIcon sector={job.category} className="w-6 h-6 text-primary" />
                       </div>
                       <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/5 bg-white/5 font-bold">
                         {job.status === 'open' ? <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {t('active_status')}</span> : <span className="text-muted-foreground">{job.status === 'closed' ? t('closed_status') : (job.status?.toUpperCase() || t('closed_status'))}</span>}
                       </Badge>
                     </div>
                     <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-2 flex-grow">{job.title}</h3>
                     
                     <div className="space-y-2 mt-4 mb-6">
                       <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                         <IndianRupee className="w-3.5 h-3.5" /> <span className="text-amber-400">{job.pay_amount}/{job.pay_type}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                         <MapPin className="w-3.5 h-3.5" /> {job.location}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                         <Users className="w-3.5 h-3.5" /> {job.vacancies} {t('openings_label')}
                       </div>
                     </div>
                     
                     <Button 
                       variant="ghost" 
                       className="w-full bg-white/5 hover:bg-primary/10 border border-white/5 text-[10px] font-black uppercase tracking-widest"
                       onClick={() => { setSelectedJob(job); fetchApplicants(job._id || job.id); setSidebarTab('applicants'); }}
                     >
                       VIEW APPLICANTS <ChevronRight className="w-3 h-3 ml-2" />
                     </Button>
                   </motion.div>
                 ))}
                 {jobs.length === 0 && (
                    <div className="col-span-full py-20 text-center glass-card rounded-[3rem] border border-dashed border-white/10 opacity-40">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                      <p className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-[0.2em]">No Missions Found</p>
                      <p className="text-[10px] uppercase tracking-widest mt-2">Initialize your first workforce request to see it here</p>
                    </div>
                 )}
               </div>
             </motion.div>
          )}

          {sidebarTab === 'applicants' && (
             <motion.div key="applicants" variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-1">{t('candidates')}</h2>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     {selectedJob ? `${t('for_mission') || 'For Mission'}: ${selectedJob.title}` : t('all_apps') || 'All incoming applications'}
                   </p>
                 </div>
                 {selectedJob && (
                   <Button variant="outline" onClick={() => { setSelectedJob(null); fetchData(); }} className="h-10 rounded-xl border-white/5 text-[10px] uppercase font-bold tracking-widest">
                     View All
                   </Button>
                 )}
               </div>
               
               <div className="glass-card rounded-[2rem] p-6 border border-white/5">
                  <div className="space-y-4">
                     {applicants.length > 0 ? applicants.map((app) => (
                       <motion.div key={app._id || app.id} variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-muted/20 border border-white/5 hover:border-primary/20 transition-all gap-4 group">
                         <div className="flex items-center gap-4">
                           <Avatar className="w-12 h-12 border-2 border-white/5 cursor-pointer" onClick={() => navigate(`/worker/profile/${app.worker_id}`)}>
                             <AvatarImage src={app.worker_profile?.avatar_url} />
                             <AvatarFallback className="bg-primary/10 text-primary font-bold">WK</AvatarFallback>
                           </Avatar>
                           <div>
                             <h4 
                               className="text-sm font-black font-['Space_Grotesk'] uppercase tracking-tight cursor-pointer hover:text-primary transition-colors"
                               onClick={() => navigate(`/worker/profile/${app.worker_id}`)}
                             >
                               {app.worker_name || app.worker_profile?.name || 'Unknown Candidate'}
                             </h4>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[200px]">
                               {app.job?.title || 'Unknown Mission'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[9px] uppercase tracking-widest font-bold border-white/5 ${
                               app.status === 'accepted' ? 'text-emerald-400 bg-emerald-400/10' :
                               app.status === 'rejected' ? 'text-rose-400 bg-rose-400/10' :
                               'text-amber-400 bg-amber-400/10'
                             }`}>
                               {app.status || 'Pending'}
                            </Badge>
                         </div>
                         
                         <div className="flex items-center gap-3">
                           {app.status !== 'accepted' && app.status !== 'rejected' && (
                             <>
                               <Button size="sm" onClick={() => updateApplicationStatus(app._id || app.id, 'accepted')} className="h-8 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase items-center gap-1">
                                 APPROVE
                               </Button>
                               <Button size="sm" onClick={() => updateApplicationStatus(app._id || app.id, 'rejected')} className="h-8 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase">
                                 REJECT
                               </Button>
                             </>
                           )}
                           <Button 
                             size="icon" 
                             variant="ghost" 
                             onClick={() => { setSelectedChatUserId(app.worker_id); setShowChat(true); }}
                             className="h-8 w-8 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary"
                           >
                             <MessageSquare className="w-4 h-4" />
                           </Button>
                         </div>
                       </motion.div>
                     )) : (
                       <div className="py-20 text-center opacity-40">
                         <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                         <p className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-[0.2em]">No Candidates Found</p>
                       </div>
                     )}
                  </div>
               </div>
             </motion.div>
          )}

          {sidebarTab === 'settings' && (
             <motion.div key="settings" variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
               <div className="mb-6">
                 <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-1">Configuration</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform Settings & Profile</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
                   <div className="flex items-center gap-4 mb-6">
                     <Settings className="w-6 h-6 text-primary" />
                     <h3 className="text-xl font-bold font-['Space_Grotesk'] uppercase">Organization Profile</h3>
                   </div>
                   
                   <div className="flex items-center gap-6">
                     <Avatar className="w-20 h-20 border border-white/10 p-2">
                       <AvatarImage src={profile?.company_logo} className="rounded-full object-cover" />
                       <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black rounded-full">HQ</AvatarFallback>
                     </Avatar>
                     <div>
                       <h4 className="text-lg font-black font-['Space_Grotesk'] uppercase">{profile?.company_name || 'Organization'}</h4>
                       <p className="text-xs text-muted-foreground font-bold mb-2">{profile?.industry || 'Industrial Sector'}</p>
                       <Button onClick={() => navigate('/employer/profile/edit')} variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-white/5 hover:bg-primary/10 hover:text-primary">
                         Edit Details
                       </Button>
                     </div>
                   </div>
                   
                   <div className="space-y-3 pt-6 border-t border-white/5">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Contact Email</span>
                       <span className="font-medium text-xs">{profile?.contact_email || 'Not configured'}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Phone Number</span>
                       <span className="font-medium text-xs">{profile?.contact_phone || 'Not configured'}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">GSTIN / Registration</span>
                       <span className="font-medium text-xs">{profile?.company_registration_number || 'Not provided'}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
                   <div className="flex items-center gap-4 mb-6">
                     <Shield className="w-6 h-6 text-primary" />
                     <h3 className="text-xl font-bold font-['Space_Grotesk'] uppercase">Security & Preferences</h3>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                       <div className="flex flex-col">
                         <span className="font-bold text-sm uppercase font-['Space_Grotesk']">Appearance</span>
                         <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Toggle dark/light mode</span>
                       </div>
                       <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-primary/20">
                         {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-primary" />}
                       </Button>
                     </div>
                     
                     <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                       <div className="flex flex-col">
                         <span className="font-bold text-sm uppercase font-['Space_Grotesk']">Language</span>
                         <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Current Interface Locale</span>
                       </div>
                       <LanguageSelector variant="outline" className="border-none bg-transparent hover:bg-primary/10" />
                     </div>
                     
                     <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                       <div className="flex flex-col">
                         <span className="font-bold text-sm uppercase font-['Space_Grotesk']">Secure Exit</span>
                         <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">End active session</span>
                       </div>
                       <Button onClick={handleLogout} variant="destructive" size="sm" className="h-8 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase">
                         LOGOUT
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
          )}
          
        </AnimatePresence>
      </main>

      {/* ─── CREATE MISSION DIALOG ─── */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="employer-theme max-w-2xl glass-card border-white/5 rounded-[3rem] p-12 backdrop-blur-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-4xl font-black font-['Space_Grotesk'] tracking-tighter uppercase mb-2">{t('initiate_mission')}</DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] font-['Space_Grotesk']">{t('protocol_desc') || 'Operational Deployment Protocol'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">{t('mission_designation')}</Label>
              <div className="relative group">
                <Input 
                  className="h-16 pl-6 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner"
                  placeholder="e.g. Masonry for Industrial Site #4"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">SPECIFIC SECTOR</Label>
              <Select onValueChange={(v) => setNewJob({...newJob, category: v})}>
                <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk']">
                  <SelectValue placeholder="DOMAIN SELECT" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/5">
                  <SelectItem value="construction">CONSTRUCTION</SelectItem>
                  <SelectItem value="logistics">LOGISTICS</SelectItem>
                  <SelectItem value="agriculture">AGRICULTURE</SelectItem>
                  <SelectItem value="hospitality">HOSPITALITY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">BASE COMPENSATION</Label>
              <div className="relative group">
                <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number"
                  className="h-16 pl-12 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner"
                  placeholder="AMOUNT"
                  value={newJob.pay_amount}
                  onChange={(e) => setNewJob({...newJob, pay_amount: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">MISSION PARAMETERS (DESCRIPTION)</Label>
              <Textarea 
                className="min-h-[140px] rounded-3xl bg-muted/30 border-white/5 focus:border-primary/50 p-6 text-lg"
                placeholder="List technical requirements, equipment, and duration..."
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreateJob(false)} className="h-16 px-10 rounded-2xl font-bold uppercase tracking-widest opacity-60 hover:opacity-100">{t('abort') || 'Abort'}</Button>
              <Button type="submit" className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20">
                {t('deploy_broadcast')}
                <Zap className="w-5 h-5 ml-3" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── SIDE PANEL (Chat) ─── */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 z-[60] bg-background/80 backdrop-blur-2xl border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.4)]"
          >
            <ChatPanel onClose={() => setShowChat(false)} receiverId={selectedChatUserId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;
