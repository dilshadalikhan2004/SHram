import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import { useTranslation } from '../../context/TranslationContext';
import { Button } from '../../components/ui/button';
import JobMapView from '../../components/JobMapView';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import { ListPageSkeleton } from '../../components/loading/PageSkeletons';
import {
  Search, MapPin, IndianRupee, Briefcase, Building2, Star, Users,
  ChevronRight, Zap, LayoutDashboard, Bookmark, BookmarkCheck, Mic
} from 'lucide-react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const WorkerJobs = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const {
     filteredJobs, categories, searchQuery, setSearchQuery,
     appliedFilters, setAppliedFilters, clearFilters,
     calculateMatchScore, isSaved, handleSaveJob, loading,
     getMatchColor, getMatchBg
   } = useWorkerData();

  const [viewMode, setViewMode] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryName = (cat) => language === 'hi' ? (cat.name_hi || cat.name) : cat.name;

  const displayedJobs = selectedCategory === 'all'
    ? filteredJobs
    : filteredJobs.filter(j => j.category === selectedCategory);

  if (loading) return <ListPageSkeleton cards={4} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Discovery</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Browse Jobs</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-lg px-3 h-8 text-xs font-black uppercase tracking-widest">
            <LayoutDashboard className="w-4 h-4 mr-2" /> List
          </Button>
          <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className="rounded-lg px-3 h-8 text-xs font-black uppercase tracking-widest">
            <MapPin className="w-4 h-4 mr-2" /> Map
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            className="w-full pl-12 pr-14 py-4 rounded-2xl text-sm focus:outline-none bg-muted/20 border border-white/5 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40 focus:border-primary/30 transition-all"
            placeholder="Search by skill, location, trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <VoiceSearchButton onResult={(text) => setSearchQuery(text)} className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setSelectedCategory('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border font-['Space_Grotesk'] ${selectedCategory === 'all' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/20 text-muted-foreground/60 border-white/5 hover:border-primary/30'}`}>
            All Categories
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border font-['Space_Grotesk'] ${selectedCategory === cat.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/20 text-muted-foreground/60 border-white/5 hover:border-primary/30'}`}>
              {getCategoryName(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">{displayedJobs.length} jobs found</p>

      {/* Job Listing */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {displayedJobs.map(job => (
              <motion.div
                key={job.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.005 }}
                onClick={() => navigate(`/worker/jobs/${job.id}`)}
                className="bg-[#0D1117]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-xl hover:border-primary/30 p-8 space-y-5 transition-all duration-500 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-muted/20 border border-white/5 group-hover:bg-primary/20 transition-colors">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black font-['Space_Grotesk'] text-foreground group-hover:text-primary transition-colors tracking-tight">{job.title}</h3>
                      <p className="flex items-center gap-2 mt-1 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                        <Building2 className="w-3.5 h-3.5 text-primary" /> {job.company_name || 'Employer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getMatchBg(calculateMatchScore(job))} ${getMatchColor(calculateMatchScore(job))}`}>
                      {calculateMatchScore(job)}%
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }} className="p-2 rounded-xl hover:bg-primary/10 transition-all">
                      {isSaved(job.id) ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5 text-muted-foreground/40" />}
                    </button>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-primary" />
                    <span className="font-black text-lg text-foreground">₹{job.salary_paise ? job.salary_paise / 100 : job.pay_amount}</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">/{job.salary_type || job.pay_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-sm font-bold text-foreground">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-black tracking-widest">{job.applicant_count || 0} bids</span>
                  </div>
                  {(job.urgency === 'asap' || job.is_urgent) && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      <Zap className="w-3 h-3 fill-current" /> Urgent
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {displayedJobs.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Search className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <h3 className="text-xl font-bold text-foreground">No jobs found</h3>
              <p className="text-muted-foreground text-sm">Try changing your filters or search terms.</p>
              <Button variant="ghost" onClick={clearFilters} className="text-primary font-bold">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <JobMapView jobs={displayedJobs} onSelectJob={(job) => navigate(`/worker/jobs/${job.id}`)} />
      )}
    </motion.div>
  );
};

export default WorkerJobs;
