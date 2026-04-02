import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Briefcase, Building2, ArrowRight, CheckCircle, Phone, 
  ShieldCheck, Target, Zap, MapPin, Search, ChevronRight,
  Globe, Users, Award, Sparkles, Building
} from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';
import OTPVerification from '../components/OTPVerification';
import { parseApiError } from '../utils/errorUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BUSINESS_TYPES = [
  'Construction', 'Real Estate', 'Manufacturing', 'Logistics', 
  'Hospitality', 'Retail', 'Agriculture', 'Technology', 'Other'
];

const EmployerProfileSetup = () => {
  const navigate = useNavigate();
  const { updateUser, user: authUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    document.title = 'Initialize Command | ShramSetu Employer';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Configure your ShramSetu corporate profile and prepare for workforce mission deployment.');
  }, []);

  const [profile, setProfile] = useState({
    company_name: '',
    business_type: '',
    location: '',
    latitude: null,
    longitude: null,
    description: '',
    company_logo: '',
    phone_verified: false,
    website: '',
    employee_count: '',
    founded_year: new Date().getFullYear()
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/api/employer/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setProfile(prev => ({ ...prev, ...res.data, phone_verified: true }));
          if (res.data.company_name || authUser?.profile_complete) {
            setStep(2);
          }
        }
      } catch (err) {
        console.log("No profile logic found. Defaulting to setup parameters.");
      }
    };
    fetchProfile();
  }, [authUser]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!profile.company_name || !profile.business_type || !profile.location) {
      toast.error('Please complete all required infrastructure fields');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/employer/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser({ profile_complete: true });
      toast.success('Employer Profile Saved');
      navigate('/employer');
    } catch (error) {
      toast.error(parseApiError(error, 'Save failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="employer-theme min-h-screen bg-background dark:bg-[#0A0A0B] text-foreground font-['Manrope'] selection:bg-primary/30 py-20 px-4 relative overflow-hidden">
      {/* Industrial Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="w-24 h-24 rounded-[3rem] bg-muted/30 border border-white/5 flex items-center justify-center mx-auto mb-6 glass-card shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Building2 className="w-12 h-12 text-primary relative z-10" />
            {profile.phone_verified && (
              <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-2 border-4 border-background dark:border-[#0A0A0B]">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none">
            Corporate <span className="text-primary">Command</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.4em] opacity-60 font-['Space_Grotesk']">Initialize Enterprise Architecture</p>
        </motion.div>

        {/* Progress Progress Tracks */}
        <div className="flex items-center justify-center gap-4 mb-16">
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative group">
              <motion.div
                initial={false}
                animate={{ 
                  width: s === step ? 64 : 16,
                  backgroundColor: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  opacity: s <= step ? 1 : 0.4
                }}
                className="h-3 rounded-full transition-all duration-700 ease-[0.22, 1, 0.36, 1]"
              />
              {s === step && (
                <motion.div 
                  layoutId="step-glow-employer"
                  className="absolute inset-0 bg-primary/40 blur-lg rounded-full -z-10"
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="glass-card border-white/5 shadow-3xl rounded-[3rem] overflow-hidden">
              <CardContent className="p-12">
                {step === 1 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Identity Verification
                      </h2>
                      <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Step 01 / Strategic Validation</p>
                    </div>

                    {!profile.phone_verified ? (
                      <div className="p-8 rounded-[2rem] bg-muted/20 border border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                            <Phone className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold font-['Space_Grotesk'] text-lg">Signal Validation Required</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Verify your direct line for platform access</p>
                          </div>
                        </div>
                        <OTPVerification 
                          phone={authUser?.phone} 
                          onVerified={() => setProfile({ ...profile, phone_verified: true })} 
                        />
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-10 rounded-[2.5rem] bg-orange-500/10 border-2 border-orange-500/20 flex flex-col items-center justify-center text-center space-y-4 py-16"
                      >
                        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/40">
                          <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold font-['Space_Grotesk']">Profile Verified</h3>
                        <p className="text-sm text-orange-400 font-medium uppercase tracking-[0.2em]">Setup is complete</p>
                        <Button onClick={nextStep} className="mt-8 bg-orange-500 hover:bg-orange-600 rounded-2xl h-14 px-10 font-bold uppercase tracking-widest">
                          Go to Dashboard
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
                        <Building className="w-8 h-8 text-primary" />
                        Infrastructure Setup
                      </h2>
                      <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Step 02 / Operational Core</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Enterprise Name</Label>
                        <div className="relative group">
                          <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input 
                            placeholder="e.g. Adani Group" 
                            className="h-16 pl-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner"
                            value={profile.company_name}
                            onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Sector Domain</Label>
                        <Select 
                          value={profile.business_type} 
                          onValueChange={(v) => setProfile({ ...profile, business_type: v })}
                        >
                          <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner">
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-white/5">
                            {BUSINESS_TYPES.map(type => (
                              <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Operational Base</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-5 top-5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input 
                            placeholder="Headquarters Location" 
                            className="h-16 pl-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 p-6 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Target className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-bold font-['Space_Grotesk']">Geospatial Precision</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl border border-white/10 hover:bg-primary/20 hover:text-primary transition-all font-bold uppercase text-[10px] tracking-widest"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setProfile({ ...profile, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                                toast.success('Coordinates Locked');
                              });
                            }
                          }}
                        >
                          Sync GPS Signal
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-10">
                      <Button onClick={prevStep} variant="ghost" className="h-16 rounded-2xl px-10 font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Back</Button>
                      <Button onClick={nextStep} className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 group">
                        Finalize Architecture
                        <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
                        <Zap className="w-8 h-8 text-primary" />
                        Final Initialization
                      </h2>
                      <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Step 03 / Command Ready</p>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Mission Statement (Bio)</Label>
                        <Textarea 
                          placeholder="Describe your organization's workforce requirements..." 
                          className="min-h-[160px] rounded-[2rem] bg-muted/30 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] shadow-inner p-6"
                          value={profile.description}
                          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Digital Protocol (Website)</Label>
                          <div className="relative group">
                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              placeholder="https://enterprise.com" 
                              className="h-16 pl-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50"
                              value={profile.website}
                              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Force Size (Employees)</Label>
                          <div className="relative group">
                            <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              placeholder="e.g. 50-100" 
                              className="h-16 pl-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50"
                              value={profile.employee_count}
                              onChange={(e) => setProfile({ ...profile, employee_count: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-10">
                      <Button onClick={prevStep} variant="ghost" className="h-16 rounded-2xl px-10 font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Back</Button>
                      <Button 
                        onClick={handleSubmit} 
                        className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 group relative overflow-hidden"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Initializing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            Launch Operational Hub
                            <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-4 text-muted-foreground/30 mb-4 scale-75">
            <ShieldCheck className="w-5 h-5" />
            <div className="h-px w-12 bg-current" />
            <Award className="w-5 h-5" />
            <div className="h-px w-12 bg-current" />
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground opacity-30">Industrial Security Protocol v4.0.2</p>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfileSetup;
