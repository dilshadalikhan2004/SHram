import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { useWorkerData } from '../../context/WorkerDataContext';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import MatchScoreCard from '../../components/MatchScoreCard';
import BidSuggestion from '../../components/BidSuggestion';
import LiveMissionTracker from '../../components/LiveMissionTracker';
import BiddingModal from '../../components/BiddingModal';
import JobMapView from '../../components/JobMapView';
import {
  Briefcase, MapPin, IndianRupee, ChevronRight, Building2, Star,
  Users, Search, Zap, Sparkles, Plus, Activity, Target, ShieldCheck,
  TrendingUp, Rocket, User, LayoutDashboard, BookmarkCheck, Bookmark,
  CheckCircle, XCircle
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const WorkerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    profile, filteredJobs, applications, stats, workerStats,
    isOnline, handleToggleOnline, profileStrength, loading,
    calculateMatchScore, hasApplied, isSaved, handleSaveJob, handleApply,
    getMatchColor, getMatchBg, getPhotoUrl,
    categories, searchQuery, setSearchQuery, appliedFilters, setAppliedFilters, clearFilters
  } = useWorkerData();

  const [viewMode, setViewMode] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [bidTargetJob, setBidTargetJob] = useState(null);
  const { setShowChat, setSelectedChatUserId } = useOutletContext();

  const { language } = useTranslation();
  const getCategoryName = (cat) => language === 'hi' ? (cat.name_hi || cat.name) : language === 'or' ? (cat.name_or || cat.name) : cat.name;

  const openBiddingFlow = (job) => { setBidTargetJob(job); setIsBiddingModalOpen(true); };

  // ── Onboarding Guard Removed ──
  // Redirection is now handled centrally by ProtectedRoute in App.js
  // to avoid infinite loops and maintain a single source of truth.

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* Hero / Pulse Monitor */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-12 rounded-[2.5rem] overflow-hidden p-10 xl:p-14 min-h-[350px] flex flex-col justify-end border border-white/10 glass-card shadow-3xl group"
      >
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
              <Rocket className="w-3.5 h-3.5" /> {t('high_pulse') || 'High Pulse'}
            </motion.div>
            <h1 className="text-5xl xl:text-7xl font-black tracking-tighter leading-[0.85] font-['Space_Grotesk'] text-foreground uppercase">
              {t('welcome_back') || 'Welcome Back'},<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-500">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xl text-muted-foreground/60 font-['Space_Grotesk'] font-medium lowercase tracking-tight">
              {t('deployment_matrix_init') || 'Deployment Matrix initialized.'} <span className="text-primary font-bold">{filteredJobs.length} {t('active_nodes') || 'active nodes'}</span> {t('detected_in_range') || 'detected in range.'}
            </p>
          </div>

          <div className="flex items-center gap-6 p-5 rounded-[2rem] glass border border-white/5 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col items-center gap-1 border-r border-white/5 pr-6 mr-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t('profile_views') || 'Profile Views'}</span>
              <span className="text-xl font-black font-['Space_Grotesk'] text-primary">{workerStats.profile_views || 0}</span>
            </div>
            <div className="relative">
              <div className={`absolute -inset-1 rounded-full blur-md bg-primary opacity-20 ${isOnline ? 'animate-pulse' : 'hidden'}`} />
              <Avatar className="w-16 h-16 border-2 border-white/10 ring-4 ring-primary/20 ring-offset-4 ring-offset-background/50">
                <AvatarImage src={getPhotoUrl(profile?.profile_photo)} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black font-['Space_Grotesk']">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOnline && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0D1117] shadow-[0_0_15px_rgba(34,197,94,0.8)]" />}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground font-['Space_Grotesk'] opacity-50">{t('signal_status') || 'Signal Status'}</p>
              <p className={`text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                {isOnline ? (t('active_pulse') || 'Active') : (t('signal_offline') || 'Offline')}
              </p>
              <button
                onClick={handleToggleOnline}
                className={`mt-2 w-14 h-7 rounded-full relative flex items-center px-1.5 transition-all duration-500 shadow-inner ${isOnline ? 'bg-primary' : 'bg-muted/40'}`}
              >
                <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`w-4 h-4 bg-white rounded-full shadow-lg ${isOnline ? 'ml-auto' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tight uppercase">{t('recommended_deployments') || 'Recommended Jobs'}</h2>
              <div className="h-1 w-20 bg-primary rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-lg px-3 h-8">
                <LayoutDashboard className="w-4 h-4 mr-2" /> List
              </Button>
              <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className="rounded-lg px-3 h-8">
                <MapPin className="w-4 h-4 mr-2" /> Map
              </Button>
            </div>
          </div>

          {/* LIVE MISSION MONITOR */}
          {applications.some(app => app.status === 'in_progress') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-primary font-['Space_Grotesk']">Active Mission Telemetry</h3>
              </div>
              {applications.filter(app => app.status === 'in_progress').map(app => (
                <LiveMissionTracker key={app.job_id} jobId={app.job_id} role="worker" isActive={true} />
              ))}
            </motion.div>
          )}

          {/* Search mobile */}
          <div className="lg:hidden flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none bg-muted/20 border border-white/5 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40" placeholder="SEARCH JOBS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                {t('category_all') || 'All'}
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

          {/* ─── JOB GRID / MAP ─── */}
          <div className="space-y-6 flex-1 flex justify-center">
            {viewMode === 'list' ? (
              <div className="w-full max-w-3xl flex flex-col gap-10 pb-20">
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-[#0D1117]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-primary/30 p-8 space-y-6 transition-all duration-500 group cursor-pointer relative overflow-hidden"
                      onClick={() => navigate(`/worker/jobs/${job.id}`)}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="relative z-10 flex justify-between items-start mb-2">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 group-hover:bg-primary/20 transition-colors shadow-inner">
                            <Briefcase className="w-8 h-8 text-primary shadow-sm" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black font-['Space_Grotesk'] leading-tight text-foreground group-hover:text-primary transition-colors tracking-tight">{job.title}</h3>
                            <p className="flex items-center gap-2 mt-1 text-muted-foreground font-black text-xs uppercase tracking-widest opacity-80">
                              <Building2 className="w-4 h-4 text-primary" /> {job.company_name || 'Verified Mission'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getMatchBg(calculateMatchScore(job))} ${getMatchColor(calculateMatchScore(job))}`}>
                            {calculateMatchScore(job)}% Match
                          </span>
                          {(job.urgency === 'asap' || job.is_urgent) && (
                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                              <Zap className="w-3 h-3 mr-1.5 fill-current" /> Urgent
                            </span>
                          )}
                        </div>
                      </div>

                      {job.description && (
                        <p className="relative z-10 text-muted-foreground/80 font-medium font-['Manrope'] line-clamp-3 leading-relaxed text-sm pr-4">{job.description}</p>
                      )}

                      <div className="relative z-10 flex flex-wrap gap-6 py-6 border-y border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10"><IndianRupee className="w-5 h-5 text-primary" /></div>
                          <div>
                            <p className="font-black text-2xl tracking-tighter text-foreground">{job.salary_paise ? job.salary_paise / 100 : job.pay_amount}</p>
                            <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-60">/{job.salary_type || job.pay_type}</p>
                          </div>
                        </div>
                        <div className="w-[1px] h-12 bg-white/5 hidden sm:block" />
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/20"><MapPin className="w-5 h-5 text-muted-foreground" /></div>
                          <div>
                            <p className="font-black text-base text-foreground max-w-[150px] truncate">{job.location}</p>
                            <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Location</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex justify-between items-center pt-2">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground/60" />
                            <span className="text-xs font-black tracking-widest bg-muted/20 px-2 py-1 rounded-md">{job.applicant_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                            <span className="text-xs font-black tracking-widest text-amber-500">{job.employer_rating || 4.5}</span>
                          </div>
                        </div>
                        <Button variant="default" size="lg" className="rounded-xl font-black uppercase tracking-widest h-12 px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs">
                          View Details <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <JobMapView jobs={filteredJobs} onSelectJob={(job) => navigate(`/worker/jobs/${job.id}`)} />
            )}
            {filteredJobs.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6"><Search className="w-8 h-8 text-muted-foreground/40" /></div>
                <h3 className="text-xl font-bold">No jobs match your criteria</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your filters or expanding your search.</p>
                <Button variant="ghost" onClick={clearFilters} className="text-primary font-bold">Clear Filters</Button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Stats & Insights ─── */}
        <div className="lg:col-span-4 space-y-10">
          {/* AI Smart Tips */}
          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="rounded-[2rem] p-8 relative overflow-hidden glass-card border-white/5 group">
            <div className="absolute top-0 right-0 w-32 h-32 blur-[100px] -mr-12 -mt-12 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30"><Sparkles className="w-5 h-5 text-primary animate-pulse" /></div>
              <h3 className="font-black text-xl text-foreground font-['Space_Grotesk'] tracking-tight uppercase">{t('diagnostic_insights') || 'AI Insights'}</h3>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4 group/tip">
                <div className="w-[1px] shrink-0 bg-primary/30 h-auto self-stretch rounded-full group-hover/tip:bg-primary transition-colors" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 font-['Space_Grotesk']">{t('optimization_01') || 'Optimization'}</p>
                  <p className="text-sm leading-relaxed font-['Space_Grotesk'] text-muted-foreground font-medium">{t('complete_profile_tip') || 'Complete your profile to increase match accuracy.'}</p>
                </div>
              </div>
              <div className="flex gap-4 group/tip">
                <div className="w-[1px] shrink-0 bg-green-500/30 h-auto self-stretch rounded-full group-hover/tip:bg-green-500 transition-colors" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">{t('status_alert') || 'Status'}</p>
                  <p className="text-sm leading-relaxed font-['Space_Grotesk'] text-muted-foreground font-medium">{t('reliability_index') || 'Reliability index'} at <span className="text-foreground font-bold">{stats?.reliability_score || 50}%</span></p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Profile Strength */}
          <div className="p-8 glass-card rounded-[2rem] border-white/5">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Profile Integrity</p>
              <motion.div animate={{ rotate: profileStrength === 100 ? [0, 10, -10, 0] : 0 }} transition={{ repeat: Infinity, duration: 3 }}><Target className={`w-4 h-4 ${profileStrength >= 80 ? 'text-green-500' : 'text-primary'}`} /></motion.div>
            </div>
            <div className="relative">
              <div className="w-full h-3 rounded-full mb-3 bg-muted/20 border border-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${profileStrength}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={`h-full rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] ${profileStrength >= 80 ? 'bg-green-500' : profileStrength >= 50 ? 'bg-primary' : 'bg-amber-500'}`} />
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
                  <motion.circle cx="80" cy="80" r="72" fill="transparent" stroke="hsl(var(--primary))" strokeWidth="10" strokeDasharray="452.4" initial={{ strokeDashoffset: 452.4 }} animate={{ strokeDashoffset: 452.4 - (452.4 * (stats?.reliability_score || 50) / 100) }} transition={{ duration: 2, ease: "easeOut" }} strokeLinecap="round" />
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
              <div className={`px-3 py-1 rounded-lg border ${(stats?.earnings_growth_pct || 0) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className={`text-[10px] font-black font-['Space_Grotesk'] tracking-widest ${(stats?.earnings_growth_pct || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.max(heightPct, 3)}%` }} transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }} className={`flex-1 rounded-t-xl transition-all duration-500 relative ${isMax ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : amount > 0 ? 'bg-primary/40' : 'bg-muted/20'}`}>
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

      {/* Bidding Modal */}
      <BiddingModal
        isOpen={isBiddingModalOpen}
        onClose={() => setIsBiddingModalOpen(false)}
        job={bidTargetJob}
        onSubmit={(payload) => { handleApply(payload); setIsBiddingModalOpen(false); }}
      />
    </>
  );
};

export default WorkerHome;
