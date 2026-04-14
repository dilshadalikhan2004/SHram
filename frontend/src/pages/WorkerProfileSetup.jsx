import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { WORK_SECTORS, SECTOR_COLORS } from '../lib/constants';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardHat, MapPin, Plus, X, ArrowRight, IndianRupee, Phone, CheckCircle, 
  Video, Loader2, Search, Briefcase, Home, Users, Truck, Sprout, Settings,
  ChevronRight, Sparkles, Clock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

import SectorIcon from '../components/SectorIcon';
import OTPVerification from '../components/OTPVerification';
import LocationPicker from '../components/LocationPicker';
import VideoIntroRecorder from '../components/VideoIntroRecorder';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi'];

const WorkerProfileSetup = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSector, setSelectedSector] = useState(null);
  const [profile, setProfile] = useState({
    skills: [],
    experience_years: 0,
    daily_rate: '',
    hourly_rate: '',
    location: '',
    latitude: null,
    longitude: null,
    bio: '',
    availability: 'available',
    languages: ['Hindi'],
    profile_photo: '',
    video_intro_url: '',
    phone_verified: false,
  });

  const [newSkill, setNewSkill] = useState({ name: '', years_experience: 0, proficiency: 'intermediate' });

  const addSkill = () => {
    if (newSkill.name && !profile.skills.find(s => s.name === newSkill.name)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, { ...newSkill }]
      });
      setNewSkill({ name: '', years_experience: 0, proficiency: 'intermediate' });
    }
  };

  const removeSkill = (skillName) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s.name !== skillName)
    });
  };

  const toggleLanguage = (lang) => {
    if (profile.languages.includes(lang)) {
      setProfile({
        ...profile,
        languages: profile.languages.filter(l => l !== lang)
      });
    } else {
      setProfile({
        ...profile,
        languages: [...profile.languages, lang]
      });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile({
            ...profile,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success('Location detected!');
        },
        (error) => {
          toast.error(parseApiError(error, 'Could not detect location'));
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (profile.skills.length === 0) {
      toast.error('Add at least one skill');
      return;
    }
    if (!profile.location && !profile.latitude) {
      toast.error(parseApiError(null, 'Enter your location'));
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...profile,
        skills: profile.skills.map(s => typeof s === 'string' ? s : s.name),
        user_id: authUser?.id || authUser?.user_id || "unknown",
        full_name: authUser?.full_name || authUser?.name || "Worker",
        location: profile.location || (profile.latitude ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : 'Remote'),
        lat: profile.latitude || null,
        lng: profile.longitude || null,
        daily_rate: parseFloat(profile.daily_rate) || 0,
        hourly_rate: parseFloat(profile.hourly_rate) || 0,
        experience_years: parseInt(profile.experience_years) || 0,
        video_intro: profile.video_intro_url || '',
      };
      
      await axios.post(`${API_URL}/api/worker/profile`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser({ profile_complete: true });
      toast.success('Profile created successfully!');
      navigate('/worker');
    } catch (error) {
      console.error('Profile save error:', error.response?.data || error.message);
      toast.error(parseApiError(error, 'Failed to create profile'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 selection:bg-primary selection:text-white relative overflow-hidden font-['Manrope']">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-[2rem] bg-muted/30 border border-white/5 flex items-center justify-center mx-auto mb-6 glass-card shadow-2xl"
          >
            <HardHat className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold font-['Space_Grotesk'] tracking-tighter"
          >
            Complete Your Profile
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-3 font-medium uppercase tracking-[0.2em] text-xs"
          >
            Initialize high-precision industrial data
          </motion.p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="relative group">
              <motion.div
                initial={false}
                animate={{ 
                  width: s === step ? 48 : 12,
                  backgroundColor: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  opacity: s <= step ? 1 : 0.4
                }}
                className="h-3 rounded-full transition-all duration-500"
              />
              {s === step && (
                <motion.div 
                  layoutId="step-glow"
                  className="absolute inset-0 bg-primary/40 blur-md rounded-full -z-10"
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >

        {/* Step 1: Phone Verification */}
        {step === 1 && (
          <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
            <Card className="border-0 bg-transparent overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10 px-8">
                <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
                  <Phone className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Verify Your Identity</CardTitle>
                <CardDescription className="text-base font-['Space_Grotesk'] pt-2">Regulate access with a high-security mobile handshake</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <OTPVerification 
                  phoneNumber={authUser?.phone || ""} 
                  onVerified={() => {
                     setProfile({...profile, phone_verified: true});
                     setStep(2);
                  }} 
                />
                <div className="text-center">
                  <button 
                    onClick={() => setStep(2)} 
                    className="text-xs font-bold text-muted-foreground/60 hover:text-primary uppercase tracking-widest transition-all hover:underline"
                  >
                    Skip to manual configuration
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
            <Card className="border-0 bg-transparent overflow-hidden">
              <CardHeader className="px-8 pt-10 pb-6">
                <CardTitle className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Core Capabilities</CardTitle>
                <CardDescription className="text-base font-['Space_Grotesk'] pt-1">Map your skill matrix across industrial sectors</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                {/* Added Skills List */}
                <div className="flex flex-wrap gap-2.5 min-h-[64px] p-5 bg-muted/20 rounded-[1.5rem] border border-dashed border-white/10">
                  {profile.skills.length === 0 ? (
                    <p className="text-muted-foreground text-sm font-medium flex items-center gap-2 italic font-['Space_Grotesk']">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Sector matrix empty. Initialize skills below.
                    </p>
                  ) : (
                    profile.skills.map((skill) => (
                      <Badge key={skill.name} variant="secondary" className="pl-4 pr-2 py-2 gap-3 glass-card bg-primary/5 border-primary/20 hover:border-primary/40 transition-all rounded-xl">
                        <span className="font-bold text-primary font-['Space_Grotesk'] tracking-wide">{skill.name}</span>
                        <span className="text-[10px] bg-primary/20 px-2 py-0.5 rounded-lg text-primary font-bold">
                          {skill.years_experience}Y • {skill.proficiency.toUpperCase()}
                        </span>
                        <button onClick={() => removeSkill(skill.name)} className="hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full p-1 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                {/* Sector Selection Grid */}
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">1. Sector Protocol</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {WORK_SECTORS.map((sector) => (
                      <button
                        key={sector.id}
                        onClick={() => setSelectedSector(sector)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden ${
                          selectedSector?.id === sector.id 
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                            : 'border-white/5 hover:border-primary/30 bg-muted/20'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                           selectedSector?.id === sector.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20'
                        }`}>
                          <SectorIcon name={sector.iconName} className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-[11px] leading-tight font-['Space_Grotesk'] uppercase tracking-wider">{sector.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Selection within Sector */}
                {selectedSector && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 glass-card relative overflow-hidden">
                      <Label className="text-sm font-bold font-['Space_Grotesk'] text-primary mb-4 block uppercase tracking-widest">2. Specific Deployment: {selectedSector.label}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select value={newSkill.name} onValueChange={(value) => setNewSkill({ ...newSkill, name: value })}>
                          <SelectTrigger className="h-14 rounded-xl bg-muted/30 border-white/5 font-['Space_Grotesk']">
                            <SelectValue placeholder="Job Role..." />
                          </SelectTrigger>
                          <SelectContent className="glass-card rounded-xl">
                            {selectedSector.skills.filter(s => !profile.skills.find(ps => ps.name === s)).map((skill) => (
                              <SelectItem key={skill} value={skill} className="rounded-lg">{skill}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2.5">
                          <div className="flex-1">
                            <Input type="number" placeholder="Years" min="0" value={newSkill.years_experience || ''} onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 0 })} className="h-14 rounded-xl bg-muted/30 border-white/5" />
                          </div>
                          <Select value={newSkill.proficiency} onValueChange={(value) => setNewSkill({ ...newSkill, proficiency: value })}>
                            <SelectTrigger className="h-14 w-28 rounded-xl bg-muted/30 border-white/5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card rounded-xl">
                              <SelectItem value="beginner">BEG</SelectItem>
                              <SelectItem value="intermediate">INT</SelectItem>
                              <SelectItem value="expert">EXP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button type="button" onClick={addSkill} disabled={!newSkill.name} className="w-full mt-6 h-14 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                        <Plus className="w-5 h-5 mr-3" /> Add {newSkill.name || 'Skill'}
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Total Industrial Seniority</Label>
                  <div className="group relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                     <Input type="number" min="0" placeholder="Combined years of experience..." value={profile.experience_years || ''} onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })} className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-[1.25rem] text-muted-foreground font-bold hover:bg-muted/50 transition-all uppercase tracking-widest">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={profile.skills.length === 0} className="flex-[2] h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                    Continue <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Location & Rate */}
        {step === 3 && (
          <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
            <Card className="border-0 bg-transparent overflow-hidden">
              <CardHeader className="px-8 pt-10 pb-6">
                <CardTitle className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Deployment Zone</CardTitle>
                <CardDescription className="text-base font-['Space_Grotesk'] pt-1">Define your industrial radius and rate protocols</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Geo-Location Signal</Label>
                  <LocationPicker
                    value={profile.location}
                    onChange={(loc) => setProfile({ ...profile, location: loc })}
                    onCoordinatesChange={(lat, lon) => setProfile({ ...profile, latitude: lat, longitude: lon })}
                  />
                  {profile.latitude && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-primary flex items-center gap-2 mt-2 uppercase tracking-widest">
                      <CheckCircle className="w-3.5 h-3.5" /> PRECISION LOCATED: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Daily Protocol (INR)</Label>
                    <div className="group relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input type="number" placeholder="800" value={profile.daily_rate} onChange={(e) => setProfile({ ...profile, daily_rate: e.target.value })} className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Hourly Log (INR)</Label>
                    <div className="group relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input type="number" placeholder="100" value={profile.hourly_rate} onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })} className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Linguistic Modules</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <Button
                        key={lang}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleLanguage(lang)}
                        className={`h-11 px-6 rounded-xl font-bold font-['Space_Grotesk'] tracking-wider border-white/5 transition-all active:scale-95 ${
                          profile.languages.includes(lang) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/20 hover:border-primary/30'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-16 rounded-[1.25rem] text-muted-foreground font-bold hover:bg-muted/50 transition-all uppercase tracking-widest">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!profile.location && !profile.latitude} className="flex-[2] h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                    Continue <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Bio & Availability */}
        {step === 4 && (
          <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
            <Card className="border-0 bg-transparent overflow-hidden">
              <CardHeader className="px-8 pt-10 pb-6">
                <CardTitle className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Identity & Status</CardTitle>
                <CardDescription className="text-base font-['Space_Grotesk'] pt-1">Establish your professional background and uptime</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Professional Bio-Scan</Label>
                  <Textarea
                    placeholder="Document your industrial achievements, past enterprises, and specialized workflows..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="rounded-[1.5rem] bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg p-5"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Availability Flux</Label>
                  <Select value={profile.availability} onValueChange={(value) => setProfile({ ...profile, availability: value })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-white/5 font-['Space_Grotesk'] text-lg px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl">
                      <SelectItem value="available">ACTIVE - Ready for Deployment</SelectItem>
                      <SelectItem value="busy">OCCUPIED - Currently Engaged</SelectItem>
                      <SelectItem value="unavailable">OFFLINE - Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(3)} className="flex-1 h-16 rounded-[1.25rem] text-muted-foreground font-bold hover:bg-muted/50 transition-all uppercase tracking-widest">
                    Back
                  </Button>
                  <Button onClick={() => setStep(5)} className="flex-[2] h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                    Continue <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Video Introduction */}
        {step === 5 && (
          <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
            <Card className="border-0 bg-transparent overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10 px-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                  <Video className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Visual Verification</CardTitle>
                <CardDescription className="text-base font-['Space_Grotesk'] pt-2">
                  A 30-second video uplink increases visibility by <span className="font-bold text-primary text-xl">70%</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <div className="glass-card rounded-[2rem] p-6 bg-muted/10 border-white/5">
                  <VideoIntroRecorder 
                    onComplete={(url) => {
                      setProfile({ ...profile, video_intro_url: url });
                    }} 
                  />
                </div>
                
                {profile.video_intro_url && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-3 text-primary font-bold font-['Space_Grotesk'] uppercase tracking-widest text-sm bg-primary/10 py-4 rounded-2xl border border-primary/20">
                    <CheckCircle className="w-6 h-6" /> Data Stream Verified & Secured
                  </motion.div>
                )}

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <Button variant="ghost" onClick={() => setStep(4)} className="flex-1 h-16 rounded-[1.25rem] text-muted-foreground font-bold hover:bg-muted/50 transition-all uppercase tracking-widest">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-[2] h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin w-5 h-5 mr-3" /> Initializing...</>
                    ) : (
                      'Initialize Dashboard'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <button 
                    onClick={handleSubmit} 
                    className="text-xs font-bold text-muted-foreground/60 hover:text-primary uppercase tracking-widest transition-all hover:underline"
                  >
                    Finalize without video uplink
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  </div>
</div>
);
};

export default WorkerProfileSetup;
