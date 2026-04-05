import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import { useAuth } from '../../context/AuthContext';
import ReliabilityScore from '../../components/ReliabilityScore';
import PhoneVerification from '../../components/PhoneVerification';
import KYCPanel from '../../components/KYCPanel';
import VideoIntroRecorder from '../../components/VideoIntroRecorder';
import { toast } from 'sonner';
import {
  User, MapPin, IndianRupee, Video, CheckCircle,
  ChevronRight, Trash2, ShieldCheck, Star, BriefcaseBusiness, BadgeCheck, Image as ImageIcon
} from 'lucide-react';

const API_URL = "https://api.shramsetu.in";

const WorkerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, setProfile, stats, fetchData, loading } = useWorkerData();

  const verifiedSkills = Array.isArray(profile?.verified_skills) ? profile.verified_skills : [];
  const workPhotos = Array.isArray(profile?.work_photos) ? profile.work_photos : [];
  const workVideos = Array.isArray(profile?.work_videos) ? profile.work_videos : [];

  const completedJobs = profile?.total_jobs_completed ?? stats?.jobs_completed ?? 0;
  const avgRating = profile?.rating ?? stats?.avg_rating ?? 0;
  const reliabilityScore = profile?.reliability_score ?? 50;
  const rehireRate = profile?.rehire_rate ?? stats?.rehire_rate ?? null;

  // ✅ merged verification source
  const phoneVerified = Boolean(profile?.phone_verified ?? user?.phone_verified ?? false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-['Space_Grotesk']">Synchronizing Profile...</p>
      </div>
    );
  }

  if (!profile) return (
    <div className="text-center py-32 space-y-6">
      <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 max-w-md mx-auto">
        <h3 className="text-2xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter uppercase mb-2">
          Dossier Not Found
        </h3>
        <p className="text-sm text-muted-foreground mb-6 font-['Manrope']">
          Your profile data hasn&apos;t synchronized yet or is incomplete.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => fetchData()}
            className="w-full py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all font-['Space_Grotesk']"
          >
            Retry Synchronization
          </button>
          <button
            onClick={() => navigate('/worker/onboard')}
            className="w-full py-4 rounded-xl bg-muted/40 text-foreground font-black uppercase tracking-widest text-xs hover:bg-muted/60 transition-all font-['Space_Grotesk']"
          >
            Return to Onboarding
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-32">
      <div className="flex items-end justify-between mb-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Personnel Database</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Profile</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Status</p>
          <p className="text-xl font-black text-foreground font-['Space_Grotesk'] uppercase tracking-tight">
            {profile.verified ? 'Verified' : 'Pending'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-8">
          <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2rem] bg-muted/20 border border-white/10 flex items-center justify-center text-primary shadow-xl">
                  <User className="w-12 h-12" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">
                    {profile.full_name && !profile.full_name.startsWith('+') ? profile.full_name : (user?.full_name || 'Worker Resource')}
                  </h3>
                  <div className="flex flex-col gap-2 mt-1 items-center sm:items-start">
                    <p className="text-sm font-medium text-muted-foreground/60 font-['Space_Grotesk']">{profile.phone || user?.phone}</p>
                    <PhoneVerification
                      isVerified={phoneVerified}
                      onVerified={() => {
                        setProfile({ ...profile, phone_verified: true });
                        fetchData();
                      }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/worker/profile/edit')}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 transition-all font-['Space_Grotesk']"
              >
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 relative z-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map(skill => (
                    <span key={skill.name || skill} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 font-['Space_Grotesk']">
                      {typeof skill === 'string' ? skill : `${skill.name} (${skill.years_experience}Y)`}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Location</p>
                <p className="flex items-center gap-2 text-foreground font-black font-['Space_Grotesk'] text-lg">
                  <MapPin className="w-4 h-4 text-primary" /> {profile.location}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Daily Rate</p>
                <p className="flex items-center gap-2 text-foreground font-black text-2xl font-['Space_Grotesk'] tracking-tighter">
                  <IndianRupee className="w-5 h-5 text-primary" /> ₹{profile.daily_rate} <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 ml-1">/ DAY</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Experience</p>
                <p className="text-foreground font-black text-xl font-['Space_Grotesk'] tracking-tight">
                  {profile.experience_years} <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">Years</span>
                </p>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk'] mb-3">About</p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium font-['Manrope']">{profile.bio}</p>
              </div>
            )}
          </div>

          <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"><Video className="w-6 h-6 text-primary" /></div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 font-['Space_Grotesk']">Visual Verification</p>
                <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight italic">Video Introduction</h3>
              </div>
            </div>

            <div className="relative z-10 max-w-[860px] mx-auto">
              {profile.video_intro ? (
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/40 group/video shadow-2xl border border-white/5">
                  <video src={profile.video_intro?.startsWith('http') ? profile.video_intro : `${API_URL}${profile.video_intro}`} controls className="w-full h-full object-contain" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover/video:opacity-100 transition-opacity">
                    <button onClick={() => setProfile({ ...profile, video_intro: null })} className="p-3 rounded-xl bg-red-500 text-white shadow-xl active:scale-95 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden border border-dashed border-white/10 bg-muted/5 p-3 md:p-4">
                  <VideoIntroRecorder onComplete={(url) => { setProfile({ ...profile, video_intro: url }); toast.success('🎬 Video updated!'); }} />
                </div>
              )}
            </div>
          </div>

          <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">Certification</p>
                  <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">Skills & Work Proof</h3>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">Verified</p>
                <p className="text-lg font-black text-foreground font-['Space_Grotesk']">{verifiedSkills.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 relative z-10">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Jobs</p>
                <p className="text-lg font-black flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-primary" />{completedJobs}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Rating</p>
                <p className="text-lg font-black flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />{Number(avgRating || 0).toFixed(1)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Reliability</p>
                <p className="text-lg font-black flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400" />{Math.round(reliabilityScore)}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Samples</p>
                <p className="text-lg font-black flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />{workPhotos.length}
                  <span className="text-muted-foreground/60">/</span>
                  <Video className="w-4 h-4 text-primary" />{workVideos.length + (profile.video_intro ? 1 : 0)}
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap gap-3">
                {verifiedSkills.map(skill => (
                  <span key={skill} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 font-['Space_Grotesk']">
                    <CheckCircle className="w-3.5 h-3.5" /> {skill}
                  </span>
                ))}
                {verifiedSkills.length === 0 && (
                  <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 text-muted-foreground border border-white/10 font-['Space_Grotesk']">
                    No verified skills yet
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/worker/portfolio')}
                  className="w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-muted/30 border border-white/10 text-foreground hover:border-primary/40 transition-all font-['Space_Grotesk']"
                >
                  View Work Evidence <ChevronRight className="w-4 h-4 ml-2 inline" />
                </button>
                <button
                  onClick={() => navigate('/worker/skills-assessment')}
                  className="w-full py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] bg-primary shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk']"
                >
                  Take Skills Test <ChevronRight className="w-4 h-4 ml-2 inline" />
                </button>
              </div>

              {rehireRate !== null && rehireRate !== undefined && (
                <p className="text-xs text-muted-foreground font-['Manrope']">
                  Rehire rate: <span className="text-foreground font-bold">{Math.round(rehireRate)}%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-6 lg:p-8 glass-card rounded-[2.5rem] border-white/5">
            <ReliabilityScore
              score={profile.reliability_score || 50}
              jobsCompleted={profile.total_jobs_completed || 0}
              acceptanceRate={profile.acceptance_rate || 100}
              phoneVerified={phoneVerified}
            />
          </div>

          <div className="p-6 lg:p-8 glass-card rounded-[2.5rem] border-white/5 shadow-2xl relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
            <KYCPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkerProfile;
