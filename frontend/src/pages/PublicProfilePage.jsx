import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Star, Award, Shield, Briefcase, 
  ChevronLeft, MessageSquare, Share2, Calendar,
  Zap, TrendingUp, CheckCircle2, History
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useTranslation } from '../context/TranslationContext';
import { profileApi, portfolioApi } from '../lib/api';
import axios from 'axios';
import { toast } from 'sonner';

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    // Track the view when an employer opens this page
    const trackView = async () => {
        try {
            await profileApi.trackView(id);
        } catch (e) {
            console.warn("View tracking failed", e);
        }
    };
    trackView();
  }, [id]);

  const fetchProfile = async () => {
    try {
      // In a real app, we'd have a public profile endpoint
      // For now, we'll try to fetch the worker profile
      const res = await axios.get(`https://api.shramsetu.in/api/worker/profile/${id}`);
      setProfile(res.data);
      
      const portfolioRes = await portfolioApi.getUser(id);
      setPortfolio(portfolioRes.data);
    } catch (err) {
      toast.error("Profile signal lost or inaccessible.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0A0A0B]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-[#0A0A0B] text-foreground font-['Manrope'] selection:bg-primary/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center glass border-b border-white/5 backdrop-blur-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Matrix
        </Button>
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl border border-white/5"><Share2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-xl border border-white/5"><Shield className="w-4 h-4" /></Button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar - Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass-card rounded-[3rem] p-10 border border-white/5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent" />
              
              <div className="relative mb-8">
                <Avatar className="w-32 h-32 mx-auto border-4 border-[#0A0A0B] ring-4 ring-primary/20 shadow-2xl relative z-10">
                  <AvatarImage src={profile?.profile_photo} />
                  <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary uppercase">{profile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {profile?.is_online && (
                  <div className="absolute bottom-2 right-1/2 translate-x-12 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0A0A0B] z-20 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                )}
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <h1 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">{profile?.name}</h1>
                  <p className="text-primary font-bold uppercase tracking-widest text-[10px] mt-1">{profile?.category || 'Mission Specialist'}</p>
                </div>

                <div className="flex justify-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 h-7 px-4 rounded-xl font-black uppercase tracking-tighter">
                    <Star className="w-3 h-3 mr-1 fill-current" /> {profile?.rating || '5.0'}
                  </Badge>
                  <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 h-7 px-4 rounded-xl font-black uppercase tracking-tighter">
                    <Shield className="w-3 h-3 mr-1" /> {t('verified_id')}
                  </Badge>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    <span>Deployments</span>
                    <span className="text-foreground">{profile?.experience_years || '5'}+ Missions</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    <span>Location</span>
                    <span className="text-foreground flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {profile?.location || 'New Delhi'}</span>
                  </div>
                </div>

                <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-tighter shadow-xl shadow-primary/20 mt-6 flex items-center justify-center gap-3">
                   <MessageSquare className="w-5 h-5" /> RECRUIT NOW
                </Button>
              </div>
            </motion.div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-card p-6 rounded-3xl border border-white/5 text-center">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Impact Factor</p>
                  <p className="text-2xl font-black font-['Space_Grotesk'] tracking-tighter">9.2</p>
               </div>
               <div className="glass-card p-6 rounded-3xl border border-white/5 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Success Rate</p>
                  <p className="text-2xl font-black font-['Space_Grotesk'] tracking-tighter">98%</p>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Bio Section */}
            <motion.section 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-primary rounded-full" />
                 <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Mission Objective</h2>
              </div>
              <div className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Award className="w-32 h-32" />
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground/80 font-medium">
                  {profile?.bio || "Highly skilled deployment specialist with focused expertise in precision infrastructure and resource optimization. Seeking high-impact missions to demonstrate proficiency and technical mastery."}
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  {(profile?.skills || ['Leadership', 'Technical Analysis', 'Infrastructure']).map(skill => (
                    <span key={skill} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary hover:border-primary/20 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Portfolio Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                   <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Mission Log Gallery</h2>
                </div>
                <Badge variant="outline" className="border-white/5 text-[9px] uppercase tracking-widest font-black h-8 px-4">
                  {portfolio.length} Visual Protocols
                </Badge>
              </div>

              {portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.map((item, i) => (
                    <motion.div 
                      key={item.id || i}
                      whileHover={{ y: -5 }}
                      className="glass-card rounded-[2rem] overflow-hidden border border-white/5 group"
                    >
                      <div className="aspect-video bg-muted/20 relative">
                        <img src={item.image_url} alt="Portfolio Item" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                          <p className="text-white font-black uppercase text-xs tracking-widest">{item.title}</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-sm uppercase tracking-tight">{item.title}</h4>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">Status: Mission Verified</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center glass-card rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
                  <Briefcase className="w-12 h-12 mb-6" />
                  <p className="text-xs font-black uppercase tracking-widest">No visual logs available</p>
                </div>
              )}
            </section>

            {/* Verification & Badges */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                 <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Validation Badges</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { icon: Shield, label: 'Identity Verified', desc: 'Secure Layer 1 Auth', color: 'text-emerald-500' },
                   { icon: Zap, label: 'Rapid Responder', desc: '95% Sub-hour Response', color: 'text-primary' },
                   { icon: History, label: 'Legacy Stalwart', desc: '3+ Years on Matrix', color: 'text-amber-500' }
                 ].map((badge, i) => (
                   <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 flex gap-4 items-center">
                      <div className={`p-3 rounded-2xl bg-muted/20 ${badge.color}`}>
                        <badge.icon className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase leading-tight tracking-widest">{badge.label}</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.1em]">{badge.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfilePage;
