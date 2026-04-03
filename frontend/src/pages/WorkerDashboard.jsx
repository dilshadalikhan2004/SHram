import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  HardHat, Sun, Moon, LogOut, Search, MapPin, IndianRupee,
  Briefcase, Clock, Star, Bell, MessageSquare, User, ChevronRight,
  Filter, Building2, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Bookmark, BookmarkCheck, Zap, Sparkles, Shield, History, Rocket,
  Users, Wallet, Award, Video, Trash2, Wifi, Settings, LayoutDashboard,
  Mic, Plus, Activity, Target, ShieldCheck, Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import MatchScoreCard from '../components/MatchScoreCard';
import ChatPanel from '../components/ChatPanel';
import LanguageSelector from '../components/LanguageSelector';
import ReliabilityScore from '../components/ReliabilityScore';
import PhoneVerification from '../components/PhoneVerification';
import SquadsPanel from '../components/SquadsPanel';
import EarningsPanel from '../components/EarningsPanel';
import KYCPanel from '../components/KYCPanel';
import BidSuggestion from '../components/BidSuggestion';
import VideoIntroRecorder from '../components/VideoIntroRecorder';
import VoiceSearchButton from '../components/VoiceSearchButton';

import HandshakeControl from '../components/HandshakeControl';
import LiveMissionTracker from '../components/LiveMissionTracker';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Framer Motion Variants for Smooth Sequences
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
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

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useTranslation();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    const cached = localStorage.getItem('worker_is_online');
    return cached ? JSON.parse(cached) : false;
  });
  const [sidebarTab, setSidebarTab] = useState('dashboard');
  const [activeHandshakeJobId, setActiveHandshakeJobId] = useState(null);
  const [showHandshakeModal, setShowHandshakeModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'selected':
      case 'accepted':
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected':
      case 'declined': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shortlisted': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch each independently — one 404 must NOT kill the others
    const [jobsRes, appsRes, statsRes, notifRes, catRes, profileRes, savedRes] = await Promise.all([
      axios.get(`${API_URL}/api/jobs`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/api/applications/worker`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/api/stats/worker`, { headers }).catch(() => ({ data: null })),
      axios.get(`${API_URL}/api/notifications`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/api/categories`).catch(() => ({ data: { categories: [] } })),
      axios.get(`${API_URL}/api/worker/profile`, { headers }).catch(() => ({ data: null })),
      axios.get(`${API_URL}/api/jobs/saved`, { headers }).catch(() => ({ data: [] })),
    ]);

    setJobs(jobsRes.data || []);
    setApplications(appsRes.data || []);
    if (statsRes.data) setStats(statsRes.data);
    setNotifications(notifRes.data || []);
    setCategories(catRes.data?.categories || []);
    setSavedJobs(savedRes.data || []);

    // Restore online status: DB profile > localStorage fallback > default false
    if (profileRes.data) {
      setProfile(profileRes.data);
      const dbOnline = profileRes.data.is_online === true;
      setIsOnline(dbOnline);
      localStorage.setItem('worker_is_online', JSON.stringify(dbOnline));
    } else {
      // Profile not found (new user) — restore from localStorage
      const cached = localStorage.getItem('worker_is_online');
      if (cached !== null) setIsOnline(JSON.parse(cached));
    }

    setLoading(false);
  }, [API_URL]);

  useEffect(() => {
    document.title = 'Deployment Command | ShramSetu';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Access your industrial workforce mission board, manage your earnings, and view deployment analytics on ShramSetu.');
    fetchData();
  }, [fetchData]);

  const handleApply = async (jobId, quickApply = false) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/applications`, { job_id: jobId, quick_apply: quickApply }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(quickApply ? '⚡ Quick apply successful!' : '✅ Application submitted!');
      fetchData(); setSelectedJob(null);
    } catch (error) { toast.error(parseApiError(error, 'Failed to apply')); }
  };

  const handleRequestRelease = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/payment/escrow/request-release`, { jobId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("💰 Payment request sent to employer!"); fetchData();
    } catch (e) { toast.error(parseApiError(e, "Failed to request payment")); }
  };

  const handleSaveJob = async (jobId) => {
    const saved = savedJobs.some(j => j.id === jobId);
    try {
      const token = localStorage.getItem('token');
      if (saved) { await axios.delete(`${API_URL}/api/jobs/save/${jobId}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Removed from saved'); }
      else { await axios.post(`${API_URL}/api/jobs/save`, { job_id: jobId }, { headers: { Authorization: `Bearer ${token}` } }); toast.success('💾 Job saved!'); }
      fetchData();
    } catch (error) { toast.error(parseApiError(error, 'Failed to save job')); }
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    // Optimistically update UI + persist locally
    setIsOnline(newStatus);
    localStorage.setItem('worker_is_online', JSON.stringify(newStatus));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/worker/status`, { is_online: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(newStatus ? "🟢 You are now ONLINE! Employers can see you." : "You are now OFFLINE.");
    } catch (error) {
      // Revert on failure
      setIsOnline(!newStatus);
      localStorage.setItem('worker_is_online', JSON.stringify(!newStatus));
      toast.error(parseApiError(error, "Failed to update status"));
    }
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const calculateMatchScore = (job) => {
    if (!profile) return 0;
    let score = 0;
    if (profile.skills && job.requirements) {
      const sk = Array.isArray(profile.skills) ? profile.skills.map(s => typeof s === 'string' ? s : s.name) : [];
      score += job.requirements.filter(s => sk.includes(s)).length * 12;
    }
    if (profile.category && job.category === profile.category) score += 15;
    if (profile.location && job.location && job.location.toLowerCase() === profile.location.toLowerCase()) score += 10;
    return Math.min(score, 99);
  };

  const filteredJobs = jobs.filter(job => {
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
      const searchable = [job.title, job.location, job.description || '', job.category || '', ...(job.requirements || [])].join(' ').toLowerCase();
      matchesSearch = keywords.some(kw => searchable.includes(kw));
    }
    return matchesSearch && (selectedCategory === 'all' || job.category === selectedCategory);
  }).sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));

  const hasApplied = (jobId) => applications.some(app => app.job_id === jobId);
  const isSaved = (jobId) => savedJobs.some(j => j.id === jobId);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const getCategoryName = (cat) => language === 'hi' ? (cat.name_hi || cat.name) : language === 'or' ? (cat.name_or || cat.name) : cat.name;
  const getPhotoUrl = (path) => { if (!path) return null; return `${API_URL}/api/files/${path}?auth=${localStorage.getItem('token')}`; };
  const getTimeAgo = (d) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; };
  const profileStrength = profile ? [profile.skills?.length > 0 ? 20 : 0, profile.location ? 15 : 0, profile.bio ? 10 : 0, profile.phone_verified ? 15 : 0, profile.video_intro ? 15 : 0, profile.daily_rate ? 10 : 0, profile.experience_years ? 15 : 0].reduce((a, b) => a + b, 0) : 0;

  const getMatchColor = (s) => s >= 80 ? 'text-green-500' : s >= 50 ? 'text-primary' : 'text-amber-500';
  const getMatchBg = (s) => s >= 80 ? 'bg-green-500/10 border-green-500/20' : s >= 50 ? 'bg-primary/10 border-primary/20' : 'bg-amber-500/10 border-amber-500/20';

  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'applications', icon: Briefcase, label: t('my_applications') },
    { id: 'wallet', icon: Wallet, label: t('wallet_balance') },
    { id: 'saved', icon: Bookmark, label: t('saved') },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 precision-grid font-['Manrope'] relative">
      {/* ─── BACKGROUND DECOR ─── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      {/* ─── TOP NAV ─── */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center glass border-b border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-16">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-500 font-['Space_Grotesk'] tracking-tighter uppercase"
          >
            ShramSetu
          </motion.span>

        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center px-5 py-2 rounded-2xl bg-muted/20 border border-white/5 focus-within:border-primary/30 transition-all shadow-inner group">
            <Search className="w-4 h-4 mr-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              className="bg-transparent border-none focus:outline-none text-xs w-56 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40" 
              placeholder={t('search_matrix')} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <VoiceSearchButton onResult={(text) => { setSearchQuery(text); setSidebarTab('dashboard'); toast.success(`Diagnostic Search: "${text}"`); }} className="w-5 h-5 ml-3 opacity-60 hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center gap-2 h-10 px-1 rounded-xl bg-muted/20 border border-white/5">
            <LanguageSelector variant="ghost" />
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={() => setShowChat(!showChat)} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <MessageSquare className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
            <button className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <Bell className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
              {unreadNotifications > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />}
            </button>
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={handleLogout} className="p-2 rounded-lg transition-all hover:bg-destructive/10 group">
              <LogOut className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-destructive" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SIDEBAR (desktop) ─── */}
      <aside className="fixed left-0 top-0 h-full w-72 z-40 hidden lg:flex flex-col pt-28 pb-10 px-6 bg-background/50 border-r border-white/5 backdrop-blur-md">
        <div className="mb-12 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-primary font-['Space_Grotesk']">{t('operational_hub')}</h3>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">Protocol v4.0.2 / Precison Mode</p>
        </div>

        <nav className="space-y-2 flex-1">
          {sidebarItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setSidebarTab(item.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all text-left group relative overflow-hidden ${
                sidebarTab === item.id 
                ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5 border border-primary/20' 
                : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {sidebarTab === item.id && (
                <motion.div layoutId="nav-bg" className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full" />
              )}
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${sidebarTab === item.id ? 'fill-primary/20' : ''}`} />
              <span className="text-xs font-black uppercase tracking-widest font-['Space_Grotesk']">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="lg:ml-72 pt-28 pb-32 px-8 xl:px-16 max-w-[1600px] relative z-10">
        {/* ═══ DASHBOARD VIEW ═══ */}
        {sidebarTab === 'dashboard' && (
          <>
            {/* Hero / Pulse Monitor */}
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="relative mb-12 rounded-[2.5rem] overflow-hidden p-10 xl:p-14 min-h-[350px] flex flex-col justify-end border border-white/10 glass-card shadow-3xl group"
            >
              {/* Animated Background Pulse */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent z-0 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 rounded-full opacity-30 animate-pulse-glow" />
              
              <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-12">
                <div className="max-w-3xl space-y-4">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                  >
                    <Rocket className="w-3.5 h-3.5" /> {t('high_pulse')}
                  </motion.div>
                  <h1 className="text-5xl xl:text-7xl font-black tracking-tighter leading-[0.85] font-['Space_Grotesk'] text-foreground uppercase">
                    {t('welcome_back')},<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-500">{user?.name?.split(' ')[0]}</span>
                  </h1>
                  <p className="text-xl text-muted-foreground/60 font-['Space_Grotesk'] font-medium lowercase tracking-tight">
                    {t('deployment_matrix_init') || 'Deployment Matrix initialized.'} <span className="text-primary font-bold">{filteredJobs.length} {t('active_nodes') || 'active nodes'}</span> {t('detected_in_range') || 'detected in range.'}
                  </p>
                </div>

                <div className="flex items-center gap-6 p-5 rounded-[2rem] glass border border-white/5 shadow-2xl backdrop-blur-2xl">
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-full blur-md bg-primary opacity-20 ${isOnline ? 'animate-pulse' : 'hidden'}`} />
                    <Avatar className="w-16 h-16 border-2 border-white/10 ring-4 ring-primary/20 ring-offset-4 ring-offset-background/50">
                      <AvatarImage src={getPhotoUrl(profile?.profile_photo)} />
                      <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black font-['Space_Grotesk']">{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isOnline && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0D1117] shadow-[0_0_15px_rgba(34,197,94,0.8)]" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground font-['Space_Grotesk'] opacity-50">{t('signal_status')}</p>
                    <p className={`text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {isOnline ? t('active_pulse') : t('signal_offline')}
                    </p>
                    <button 
                      onClick={handleToggleOnline} 
                      className={`mt-2 w-14 h-7 rounded-full relative flex items-center px-1.5 transition-all duration-500 shadow-inner ${isOnline ? 'bg-primary' : 'bg-muted/40'}`}
                    >
                      <motion.div 
                        layout 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`w-4 h-4 bg-white rounded-full shadow-lg ${isOnline ? 'ml-auto' : ''}`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tight uppercase">{t('recommended_deployments')}</h2>
                    <div className="h-1 w-20 bg-primary rounded-full" />
                  </div>
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/20 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    <Activity className="w-3 h-3 text-primary" /> {t('matrix_filter_active')}
                  </div>
                </div>

                {/* LIVE MISSION MONITOR */}
                {applications.some(app => app.status === 'in_progress') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                      <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-primary font-['Space_Grotesk']">Active Mission Telemetry</h3>
                    </div>
                    {applications.filter(app => app.status === 'in_progress').map(app => (
                      <LiveMissionTracker key={app.job_id} jobId={app.job_id} role="worker" isActive={true} />
                    ))}
                  </motion.div>
                )}

                {/* Search (mobile) */}
                <div className="lg:hidden flex gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none bg-muted/20 border border-white/5 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40" placeholder="SEARCH DEPLOYMENTS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>

                {/* Category filter */}
                {categories.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
                    <button 
                      onClick={() => setSelectedCategory('all')} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border font-['Space_Grotesk'] ${
                        selectedCategory === 'all' 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-muted/20 text-muted-foreground/60 border-white/5 hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {t('category_all')}
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(cat.id)} 
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border font-['Space_Grotesk'] ${
                          selectedCategory === cat.id 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-muted/20 text-muted-foreground/60 border-white/5 hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Job Cards */}
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5">
                    <Briefcase className="w-16 h-16 mx-auto mb-6 text-muted-foreground/20 animate-pulse" />
                    <p className="font-black text-2xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">{t('zero_nodes')}</p>
                    <p className="text-muted-foreground/60 font-['Space_Grotesk'] mt-2">{t('no_jobs_found')}</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                    {filteredJobs.map((job, i) => {
                      const matchScore = calculateMatchScore(job);
                      return (
                        <motion.div 
                          key={job.id} 
                          variants={itemVariants}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          className="p-8 md:p-10 glass-card rounded-[2.5rem] relative group overflow-hidden cursor-pointer border-white/5 hover:border-primary/20"
                          onClick={() => setSelectedJob(job)}
                        >
                          {/* High-Precision AI Match Badge */}
                          {matchScore > 0 && (
                            <div className="absolute top-0 right-0 p-6 md:p-10">
                              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 backdrop-blur-xl transition-all duration-500 group-hover:scale-110 shadow-2xl ${
                                matchScore >= 80 ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                                matchScore >= 50 ? 'bg-primary/10 border-primary/30 text-primary' : 
                                'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  matchScore >= 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 
                                  matchScore >= 50 ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]' : 
                                  'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                                }`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-['Space_Grotesk']">{matchScore}% Accuracy</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-6 md:gap-10">
                            <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 bg-muted/20 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-inner overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <Building2 className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500 z-10" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-2 flex-wrap">
                                {job.is_boosted && (
                                  <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-orange-500/10 text-orange-500 border border-orange-500/20 font-['Space_Grotesk'] flex items-center gap-2">
                                    <Flame className="w-3 h-3" /> {t('priority_deployment') || 'Priority Deployment'}
                                  </span>
                                )}
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 font-['Space_Grotesk']">{job.company_name || 'Verified Employer'}</span>
                              </div>
                              
                              <h3 className="text-2xl md:text-4xl font-black mb-5 pr-32 text-foreground font-['Space_Grotesk'] tracking-tighter uppercase leading-[0.95] group-hover:text-primary transition-colors">
                                {job.title}
                              </h3>

                              <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-x-8 gap-y-4 mb-8">
                                <div className="flex items-center gap-2.5">
                                  <IndianRupee className="w-4 h-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground/40 font-black font-['Space_Grotesk']">{t('payrate')}</span>
                                    <span className="text-base font-black text-foreground font-['Space_Grotesk'] tracking-tight">₹{job.salary_paise ? job.salary_paise / 100 : 0}/{job.salary_type || 'daily'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground/40 font-black font-['Space_Grotesk']">{t('location')}</span>
                                    <span className="text-base font-black text-foreground font-['Space_Grotesk'] tracking-tight">{job.location}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground/40 font-black font-['Space_Grotesk']">{t('timestamp')}</span>
                                    <span className="text-base font-black text-foreground font-['Space_Grotesk'] tracking-tight">{getTimeAgo(job.posted_at)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {!hasApplied(job.id) ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleApply(job.id, true); }} 
                                    className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white bg-primary shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-['Space_Grotesk'] relative overflow-hidden group/btn"
                                  >
                                    <span className="relative z-10">{t('initialize_deployment')}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                  </button>
                                ) : (
                                  <div className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/30 font-['Space_Grotesk'] flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary" /> {t('applied_synced')}
                                  </div>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }} 
                                  className="p-4 rounded-2xl bg-muted/20 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group/save"
                                >
                                  {isSaved(job.id) ? 
                                    <BookmarkCheck className="w-6 h-6 text-primary fill-primary/20" /> : 
                                    <Bookmark className="w-6 h-6 text-muted-foreground/60 transition-colors group-hover/save:text-primary" />
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {/* ─── Right: Stats & Insights ─── */}
              <div className="lg:col-span-4 space-y-10">
                {/* AI Smart Tips */}
                <motion.section 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.4 }} 
                  className="rounded-[2rem] p-8 relative overflow-hidden glass-card border-white/5 group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[100px] -mr-12 -mt-12 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <h3 className="font-black text-xl text-foreground font-['Space_Grotesk'] tracking-tight uppercase">{t('diagnostic_insights')}</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 group/tip">
                      <div className="w-[1px] shrink-0 bg-primary/30 h-auto self-stretch rounded-full group-hover/tip:bg-primary transition-colors" />
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 font-['Space_Grotesk']">{t('optimization_01')}</p>
                        <p className="text-sm leading-relaxed font-['Space_Grotesk'] text-muted-foreground font-medium">
                          {t('complete_profile_tip') || 'Complete your digital profile to increase match accuracy.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 group/tip">
                      <div className="w-[1px] shrink-0 bg-green-500/30 h-auto self-stretch rounded-full group-hover/tip:bg-green-500 transition-colors" />
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">{t('status_alert')}</p>
                        <p className="text-sm leading-relaxed font-['Space_Grotesk'] text-muted-foreground font-medium">
                          {t('reliability_index') || 'Reliability index'} at <span className="text-foreground font-bold">{stats?.reliability_score || 50}%</span> — {t('top_tier_worker') || 'Top tier worker'}
                        </p>
                      </div>
                    </div>
                    {!profile?.skills?.length && (
                      <button 
                        onClick={() => setSidebarTab('profile')} 
                        className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-500 font-['Space_Grotesk'] shadow-lg"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />{t('skill_matrix')}
                      </button>
                    )}
                  </div>
                </motion.section>

                {/* Profile Strength */}
                <div className="p-8 glass-card rounded-[2rem] border-white/5">
                  <div className="flex justify-between items-center mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Profile Integrity</p>
                    <motion.div 
                      animate={{ rotate: profileStrength === 100 ? [0, 10, -10, 0] : 0 }} 
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Target className={`w-4 h-4 ${profileStrength >= 80 ? 'text-green-500' : 'text-primary'}`} />
                    </motion.div>
                  </div>
                  <div className="relative">
                    <div className="w-full h-3 rounded-full mb-3 bg-muted/20 border border-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${profileStrength}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] ${
                          profileStrength >= 80 ? 'bg-green-500' : 
                          profileStrength >= 50 ? 'bg-primary' : 
                          'bg-amber-500'
                        }`} 
                      />
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-4xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter">{profileStrength}%</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk'] mb-1">Operational</span>
                    </div>
                  </div>
                </div>

                {/* Reliability Score Gauge */}
                <div className="p-8 glass-card rounded-[2rem] border-white/5 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Reliability Grade</p>
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-center py-6 relative z-10">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <div className="absolute inset-4 rounded-full bg-primary/5 blur-2xl animate-pulse" />
                      <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
                        <circle cx="80" cy="80" r="72" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="10" strokeOpacity="0.1" />
                        <motion.circle 
                          cx="80" cy="80" r="72" 
                          fill="transparent" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth="10" 
                          strokeDasharray="452.4" 
                          initial={{ strokeDashoffset: 452.4 }}
                          animate={{ strokeDashoffset: 452.4 - (452.4 * (stats?.reliability_score || 50) / 100) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0">
                        <span className="text-5xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter leading-none">{stats?.reliability_score || 50}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk'] mt-1">
                          {(stats?.reliability_score || 50) >= 80 ? 'Grade-A' : (stats?.reliability_score || 50) >= 60 ? 'Grade-B' : (stats?.reliability_score || 50) >= 40 ? 'Grade-C' : 'Grade-D'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Earnings Matrix */}
                <div className="p-8 glass-card rounded-[2rem] border-white/5 group">
                  <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Yield Analytics</p>
                      <h4 className="text-xl font-black text-foreground font-['Space_Grotesk'] tracking-tight">Earnings Flow</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border ${
                      (stats?.earnings_growth_pct || 0) >= 0 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <span className={`text-[10px] font-black font-['Space_Grotesk'] tracking-widest ${
                        (stats?.earnings_growth_pct || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {(stats?.earnings_growth_pct || 0) >= 0 ? '+' : ''}{stats?.earnings_growth_pct || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-32 flex items-end gap-3 px-1 mb-8">
                    {(() => {
                      const daily = stats?.daily_earnings || [0,0,0,0,0,0,0];
                      const maxVal = Math.max(...daily, 1);
                      return daily.map((amount, i) => {
                        const heightPct = (amount / maxVal) * 100;
                        const isMax = amount === maxVal && amount > 0;
                        return (
                          <motion.div 
                            key={i} 
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(heightPct, 3)}%` }}
                            transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                            className={`flex-1 rounded-t-xl transition-all duration-500 relative ${
                              isMax ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : amount > 0 ? 'bg-primary/40' : 'bg-muted/20'
                            }`}
                          >
                            {isMax && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Total Yield (7D)</p>
                      <span className="text-4xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter">₹{stats?.weekly_earnings || '0'}</span>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary/20" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ APPLICATIONS VIEW ═══ */}
        {sidebarTab === 'applications' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex items-end justify-between mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Transmission Log</p>
                <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">My Applications</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Active Slots</p>
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
                  <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">System Idle</p>
                  <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">No active job transmissions detected.</p>
                  <button 
                    onClick={() => setSidebarTab('dashboard')} 
                    className="mt-8 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white font-['Space_Grotesk'] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    Scan For Work
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map(app => (
                  <motion.div 
                    key={app.id} 
                    variants={itemVariants} 
                    className="group relative p-8 glass-card rounded-[2rem] border-white/5 hover:border-primary/30 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/40 font-['Space_Grotesk'] uppercase tracking-widest">
                              ID: {app.id.slice(-8).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-black text-2xl text-foreground font-['Space_Grotesk'] tracking-tight group-hover:text-primary transition-colors">
                            {app.job?.title || 'System Resource'}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                             <p className="text-xs font-bold text-muted-foreground font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-1.5">
                               <Clock className="w-3 h-3 text-primary" /> {getTimeAgo(app.created_at)}
                             </p>
                             <div className="w-1 h-1 rounded-full bg-muted/40" />
                             <p className="text-xs font-bold text-muted-foreground font-['Space_Grotesk'] uppercase tracking-widest">
                               Applied
                             </p>
                          </div>
                        </div>

                        {app.match_score && (
                          <div className="inline-flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-white/5">
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">Alignment Index</p>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${getMatchBg(app.match_score).replace('bg-', 'bg-').replace('text-', 'bg-')}`} 
                                    style={{ width: `${app.match_score}%` }} 
                                  />
                                </div>
                                <span className={`text-xs font-black font-['Space_Grotesk'] ${getMatchBg(app.match_score).replace('bg-', 'text-')}`}>
                                  {app.match_score}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {(app.status === 'selected' || app.status === 'accepted' || app.status === 'pending') && (
                          <div className="pt-2 flex flex-wrap gap-3">
                            <button 
                              onClick={() => { setSelectedChatUserId(app.job?.employer_id); setShowChat(true); }} 
                              className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all font-['Space_Grotesk']"
                            >
                              <MessageSquare className="w-4 h-4 text-primary" /> Open Secure Channel
                            </button>
                             {app.status === 'selected' && (
                               <button 
                                 onClick={() => handleRequestRelease(app.job_id)} 
                                 className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 bg-primary shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all font-['Space_Grotesk']"
                               >
                                 <CheckCircle className="w-4 h-4" /> Request Payout
                               </button>
                             )}
                             {(app.status === 'accepted' || app.status === 'selected') && (
                               <button 
                                 onClick={() => { setActiveHandshakeJobId(app.job_id); setShowHandshakeModal(true); }} 
                                 className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:brightness-110 active:scale-95 transition-all font-['Space_Grotesk'] border border-emerald-500/30"
                               >
                                 <Smartphone className="w-4 h-4" /> Secure Check-In
                               </button>
                             )}
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0">
                         {app.status === 'in_progress' ? (
                           <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mission Active
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
          </motion.div>
        )}

        {/* ═══ WALLET VIEW ═══ */}
        {sidebarTab === 'wallet' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <div className="flex items-end justify-between mb-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Financial Terminal</p>
                <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Wallet & Earnings</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">Network Status</p>
                <p className="text-xl font-black text-green-500 font-['Space_Grotesk'] uppercase tracking-tight flex items-center gap-2 justify-end">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Secure
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 md:p-8 glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl relative">
                <EarningsPanel />
              </div>
              <div className="p-6 md:p-8 glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl relative">
                <SquadsPanel />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ SAVED VIEW ═══ */}
        {sidebarTab === 'saved' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex items-end justify-between mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Stored Protocols</p>
                <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Saved Opportunities</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Archived</p>
                <p className="text-xl font-black text-foreground font-['Space_Grotesk']">{savedJobs.length} Items</p>
              </div>
            </div>

            {savedJobs.length === 0 ? (
              <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
                    <Bookmark className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                  <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">Archive Empty</p>
                  <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">Bookmark jobs to store them in local memory.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedJobs.map(job => (
                  <motion.div 
                    key={job.id} 
                    variants={itemVariants} 
                    className="group relative p-8 glass-card rounded-[2rem] border-white/5 hover:border-primary/30 transition-all overflow-hidden cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start gap-6 relative z-10">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20">
                              Archived
                            </span>
                          </div>
                          <h3 className="font-black text-2xl text-foreground font-['Space_Grotesk'] tracking-tight group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-xs font-bold text-muted-foreground font-['Space_Grotesk'] uppercase tracking-[0.1em] flex items-center gap-1.5 mt-1">
                            <Building2 className="w-3 h-3 text-primary" /> {job.company_name}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-6 items-center">
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Deployment</p>
                            <span className="text-sm font-black text-foreground font-['Space_Grotesk'] flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-primary" /> {job.location}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Allocation</p>
                            <span className="text-sm font-black text-foreground font-['Space_Grotesk'] flex items-center gap-1.5">
                              <IndianRupee className="w-3 h-3 text-primary" /> ₹{job.salary_paise ? job.salary_paise / 100 : 0}/{job.salary_type || 'daily'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }} 
                        className="p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10 active:scale-95"
                      >
                        <BookmarkCheck className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ PROFILE VIEW ═══ */}
        {sidebarTab === 'profile' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <div className="flex items-end justify-between mb-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Personnel Database</p>
                <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Profile & Logistics</h2>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Dossier Status</p>
                 <p className="text-xl font-black text-foreground font-['Space_Grotesk'] uppercase tracking-tight">Verified</p>
              </div>
            </div>

            {profile ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-10 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-muted/20 border border-white/10 flex items-center justify-center text-primary shadow-xl">
                          <User className="w-12 h-12" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
                            {profile.full_name || 'Worker Resource'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                             <PhoneVerification isVerified={profile.phone_verified} onVerified={() => { setProfile({ ...profile, phone_verified: true }); fetchData(); }} />
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/worker/profile/edit')} 
                        className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 transition-all font-['Space_Grotesk']"
                      >
                        Modify Dossier
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Verified Skillsets</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills?.map(skill => (
                            <span key={skill.name || skill} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 font-['Space_Grotesk']">
                              {typeof skill === 'string' ? skill : `${skill.name} (${skill.years_experience}Y)`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Deployment Zone</p>
                        <p className="flex items-center gap-2 text-foreground font-black font-['Space_Grotesk'] text-lg">
                          <MapPin className="w-4 h-4 text-primary" /> {profile.location}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Operational Rate</p>
                        <p className="flex items-center gap-2 text-foreground font-black text-2xl font-['Space_Grotesk'] tracking-tighter">
                          <IndianRupee className="w-5 h-5 text-primary" /> ₹{profile.daily_rate} <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 ml-1">/ DAY</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Field Experience</p>
                        <p className="text-foreground font-black text-xl font-['Space_Grotesk'] tracking-tight">
                          {profile.experience_years} <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">CYCLES</span>
                        </p>
                      </div>
                    </div>
                    
                    {profile.bio && (
                      <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk'] mb-3">Resource Overview</p>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium font-['Manrope']">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Video Intro */}
                  <div className="p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 font-['Space_Grotesk']">Visual Verification</p>
                        <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight italic">Video Introduction</h3>
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      {profile.video_intro ? (
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/40 group/video shadow-2xl border border-white/5">
                          <video src={profile.video_intro?.startsWith('http') ? profile.video_intro : `${API_URL}${profile.video_intro}`} controls className="w-full h-full object-contain" />
                          <div className="absolute top-4 right-4 opacity-0 group-hover/video:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setProfile({...profile, video_intro: null})} 
                              className="p-3 rounded-xl bg-red-500 text-white shadow-xl active:scale-95 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-3xl overflow-hidden border border-dashed border-white/10 bg-muted/5">
                          <VideoIntroRecorder onComplete={(url) => { setProfile({...profile, video_intro: url}); toast.success('🎬 Video updated!'); }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills Assessment */}
                  <div className="p-10 glass-card rounded-[2.5rem] border-primary/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                            <Award className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">Intelligence Bureau</p>
                            <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">Skills Verification</h3>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right">
                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Verified Badges</p>
                           <p className="text-lg font-black text-foreground font-['Space_Grotesk']">{profile.verified_skills?.length || 0}</p>
                        </div>
                     </div>

                     <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap gap-3">
                          {profile.verified_skills?.map(skill => (
                            <span key={skill} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 font-['Space_Grotesk']">
                              <CheckCircle className="w-3.5 h-3.5" /> {skill}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => navigate('/worker/skills-assessment')} 
                          className="w-full py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] bg-primary shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk']"
                        >
                          Initiate Verification Protocol <ChevronRight className="w-4 h-4 ml-2 inline" />
                        </button>
                     </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <ReliabilityScore 
                    score={profile.reliability_score || 50} 
                    jobsCompleted={profile.total_jobs_completed || 0} 
                    acceptanceRate={profile.acceptance_rate || 100} 
                    phoneVerified={profile.phone_verified} 
                  />
                  <div className="glass-card rounded-[2.5rem] border-white/5 shadow-2xl relative group p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <KYCPanel />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-32 glass-card rounded-[3rem] border-white/5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10 max-w-md mx-auto px-6">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-muted/20 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden">
                       <User className="w-10 h-10 text-muted-foreground/30 relative z-10" />
                       <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    </div>
                    <h3 className="font-black text-3xl mb-3 text-foreground font-['Space_Grotesk'] tracking-tighter uppercase italic">Dossier Incomplete</h3>
                    <p className="mb-10 text-muted-foreground font-medium font-['Manrope'] leading-relaxed opacity-70">
                      Your operational profile has not been initialized. Synchronize your skills and experience to unlock premium job channels.
                    </p>
                    <button 
                      onClick={() => navigate('/worker/profile/setup')} 
                      className="w-full py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.97] transition-all font-['Space_Grotesk']"
                    >
                      Initialize Profile
                    </button>
                 </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-around items-center px-4 py-3 rounded-2xl glass border border-white/10 shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Home' }, { id: 'applications', icon: Briefcase, label: 'Apps' }, { id: 'saved', icon: Bookmark, label: 'Saved' }, { id: 'profile', icon: User, label: 'Profile' }].map(item => (
          <button key={item.id} onClick={() => setSidebarTab(item.id)} className="flex flex-col items-center justify-center transition-all active:scale-90">
            <item.icon className={`w-5 h-5 ${sidebarTab === item.id ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] uppercase tracking-widest mt-1 font-bold font-['Space_Grotesk'] ${sidebarTab === item.id ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ─── JOB DETAIL MODAL ─── */}
      <AnimatePresence mode="wait">
        {selectedJob && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedJob(null)}
          >
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 40 }} 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-2xl w-full max-h-[92vh] overflow-hidden rounded-[2.5rem] glass-card shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10 relative flex flex-col"
            >
              {/* Header Info */}
              <div className="relative p-8 pb-0 z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Opportunity Protocol</p>
                    {selectedJob.is_boosted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20 font-['Space_Grotesk']">
                        <Zap className="w-3 h-3 fill-orange-500" /> High Demand
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedJob(null)} 
                    className="p-3 rounded-2xl bg-muted/40 border border-white/5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all active:scale-95"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <h2 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter leading-[0.9] mb-4">
                  {selectedJob.title}
                </h2>
                <p className="flex items-center gap-2 text-muted-foreground font-black font-['Space_Grotesk'] uppercase tracking-[0.1em] text-xs">
                  <Building2 className="w-4 h-4 text-primary" /> {selectedJob.company_name}
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Key Diagnostics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Resource Allocation</p>
                    <p className="text-3xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter flex items-center gap-1.5">
                      <IndianRupee className="w-5 h-5 text-primary" /> ₹{selectedJob.pay_amount}
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-1">/ {selectedJob.pay_type}</span>
                    </p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Operational Zone</p>
                    <p className="text-xl font-black text-foreground font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-primary" /> {selectedJob.location}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/5" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk'] whitespace-nowrap">Briefing Overview</h4>
                      <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed font-medium font-['Manrope'] px-2">
                      {selectedJob.description}
                    </p>
                  </div>
                )}

                {/* Skills & Experience */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk']">Competency Requirements</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedJob.skills_required?.map(skill => (
                        <span key={skill} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-white/10 text-foreground font-['Space_Grotesk'] hover:border-primary/40 transition-all">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Exp. Requirement</p>
                      <p className="text-2xl font-black text-[var(--color-primary)] font-['Space_Grotesk'] tracking-tighter italic">
                        {selectedJob.experience_required} <span className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Cycles+</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Resource Slots</p>
                      <p className="text-2xl font-black text-foreground font-['Space_Grotesk'] tracking-tighter italic">
                        {selectedJob.vacancies} <span className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Open Ops</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Intelligence Modules */}
                {profile && (
                  <div className="space-y-6">
                    <div className="rounded-[2rem] overflow-hidden glass border border-white/5 shadow-inner">
                      <MatchScoreCard jobId={selectedJob.id} />
                    </div>
                    <div className="rounded-[2rem] overflow-hidden bg-muted/10 border border-white/5 p-1">
                      <BidSuggestion jobId={selectedJob.id} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-8 bg-background/50 backdrop-blur-xl border-t border-white/5 flex gap-4">
                {!hasApplied(selectedJob.id) ? (
                  <>
                    <button 
                      onClick={() => handleApply(selectedJob.id)} 
                      className="flex-[2] py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk']"
                    >
                      Initialize Application
                    </button>
                    <button 
                      onClick={() => handleApply(selectedJob.id, true)} 
                      className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-amber-500 text-black shadow-2xl shadow-amber-500/20 hover:brightness-110 active:scale-[0.95] transition-all font-['Space_Grotesk']"
                    >
                      <Zap className="w-4 h-4 fill-black" /> Quick
                    </button>
                  </>
                ) : (
                  <button disabled className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 font-['Space_Grotesk'] cursor-not-allowed">
                    Operational Status: Applied
                  </button>
                )}
                
                <button 
                  onClick={() => handleSaveJob(selectedJob.id)} 
                  className={`p-5 rounded-2xl border transition-all active:scale-[0.9] ${isSaved(selectedJob.id) ? 'bg-primary/10 border-primary text-primary shadow-inner shadow-primary/20' : 'bg-muted/40 border-white/10 text-muted-foreground hover:border-primary/40'}`}
                >
                  {isSaved(selectedJob.id) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CHAT PANEL ─── */}
      {showChat && <ChatPanel onClose={() => { setShowChat(false); setSelectedChatUserId(null); }} initialUserId={selectedChatUserId} />}
      {/* ─── HANDSHAKE MODAL ─── */}
      <Dialog open={showHandshakeModal} onOpenChange={setShowHandshakeModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#0D1117] border-white/5 rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="hidden">Secure Handshake</DialogTitle>
            <DialogDescription className="hidden">Verify your presence at the mission site.</DialogDescription>
          </DialogHeader>
          <HandshakeControl 
            role="worker" 
            jobId={activeHandshakeJobId} 
            onSuccess={() => {
              setShowHandshakeModal(false);
              fetchData();
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkerDashboard;
