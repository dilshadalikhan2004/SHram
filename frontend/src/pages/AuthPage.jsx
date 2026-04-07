import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sun, Moon, Briefcase, HardHat, ArrowRight, Mail, Lock, User, Phone, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import RegistrationSuccess from '../components/RegistrationSuccess';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, sendOtp, isAuthenticated, user: authUser, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [role, setRole] = useState('worker');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Login States
  const [loginData, setLoginData] = useState({ identifier: '', password: '', phone: '' });
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState(1); // 1: Input, 2: OTP (for workers)
  const [showPassword, setShowPassword] = useState(false);

  // Register States
  const [regStep, setRegStep] = useState(1); // 1: Info, 2: OTP (for workers)
  const [regData, setRegData] = useState({ name: '', phone: '', email: '', password: '', company: '' });
  const [regOtp, setRegOtp] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    document.title = 'Access Portal | ShramSetu';
  }, []);

  // Update defaults when role changes
  useEffect(() => {
    setLoginStep(1);
    setRegStep(1);
    setLoginData({ identifier: '', password: '', phone: '' });
    setRegData({ name: '', phone: '', email: '', password: '', company: '' });
  }, [role]);

  const handleWorkerLogin = async (e) => {
    e.preventDefault();
    if (loginStep === 1) {
      if (!loginData.phone) return toast.error('Enter phone number');
      setIsLoading(true);
      try {
        await sendOtp(loginData.phone);
        toast.success('Verification code sent');
        setLoginStep(2);
      } catch (err) { toast.error(parseApiError(err, 'Failed to send code')); }
      finally { setIsLoading(false); }
    } else {
      setIsLoading(true);
      try {
        await login({ phone: loginData.phone, otp: loginOtp });
        toast.success('Welcome back!');
        navigate('/worker');
      } catch (err) { toast.error(parseApiError(err, 'Login failed')); }
      finally { setIsLoading(false); }
    }
  };

  const handleEmployerLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const id = loginData.identifier.trim();
      const payload = {
        email: id.includes('@') ? id : null,
        phone: id.includes('@') ? null : id,
        password: loginData.password
      };
      await login(payload);
      toast.success('Access granted');
      navigate('/employer');
    } catch (err) { toast.error(parseApiError(err, 'Authentication failed')); }
    finally { setIsLoading(false); }
  };

  const handleWorkerRegister = async (e) => {
    e.preventDefault();
    if (regStep === 1) {
      if (!regData.phone || !regData.name) return toast.error('Check all fields');
      setIsLoading(true);
      try {
        await sendOtp(regData.phone);
        toast.success('Verification code sent');
        setRegStep(2);
      } catch (err) { toast.error(parseApiError(err, 'Failed to send code')); }
      finally { setIsLoading(false); }
    } else {
      setIsLoading(true);
      try {
        // We use login as registration for workers (backend creates if not exists)
        // If they provide a name, we'll update it post-login logic in context or backend
        // Actually, let's use the register endpoint with the phone + name
        await register({ name: regData.name, phone: regData.phone, role: 'worker', otp: regOtp });
        setIsSuccess(true);
      } catch (err) { toast.error(parseApiError(err, 'Registration failed')); }
      finally { setIsLoading(false); }
    }
  };

  const handleEmployerRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ 
        full_name: regData.name, 
        email: regData.email, 
        password: regData.password, 
        role: 'employer',
        name: regData.company 
      });
      setIsSuccess(true);
    } catch (err) { toast.error(parseApiError(err, 'Registration failed')); }
    finally { setIsLoading(false); }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-white/5">
          <RegistrationSuccess role={role} onComplete={() => navigate(role === 'worker' ? '/worker' : '/employer')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel: Brand Narrative */}
      <div className="lg:w-1/2 bg-background dark:bg-slate-950 p-6 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.15),transparent_70%)]" />
        
        <div className="relative z-10 py-4 lg:py-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-12 lg:mb-24">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
              <HardHat className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ShramSetu</h1>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-3xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
              India's Digital<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Workforce</span><br />
              Infrastructure.
            </h2>
            <p className="mt-4 lg:mt-8 text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-sm lg:max-w-md leading-relaxed font-['Space_Grotesk'] opacity-80 lg:opacity-100">
              Connecting high-craft skilled workers with high-speed projects. Verified. Secured. AI-Assisted.
            </p>
          </motion.div>
        </div>

        <div className="hidden lg:flex items-center gap-12 text-slate-600 dark:text-white/50 text-xs font-bold uppercase tracking-widest mt-12">
          <span>Skilled Workforce</span>
          <span>Escrow Protection</span>
          <span>Live Ops Control</span>
        </div>
      </div>

      {/* Right Panel: Operations Matrix */}
      <div className="lg:w-1/2 p-6 lg:p-20 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-8">
          {/* Role Access Selector */}
          {isAuthenticated && authUser ? (
            <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] p-8 border border-primary/20 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/20 p-1 border-2 border-primary animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    {authUser.profile_photo ? (
                      <img src={authUser.profile_photo} alt={authUser.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-3xl font-black text-primary">{authUser.full_name?.charAt(0) || 'U'}</div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">Welcome Back, {authUser.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground font-mono uppercase tracking-[0.2em] mt-2">Active {authUser.role} Session</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={() => navigate(authUser.role === 'employer' ? '/employer' : '/worker')}
                  className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/30"
                >
                  Continue to Mission Control
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-grow bg-muted/30" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Or</span>
                  <div className="h-[1px] flex-grow bg-muted/30" />
                </div>
                <Button 
                  onClick={logout}
                  variant="ghost" 
                  className="h-14 rounded-2xl border-2 border-dashed border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-xs"
                >
                  Sign Out & Switch Path
                </Button>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 md:mb-4 text-center">Select Your Path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button 
                onClick={() => setRole('worker')}
                className={`group p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-4 ${role === 'worker' ? 'border-primary bg-primary/10' : 'border-muted/50 hover:border-primary/40'}`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors ${role === 'worker' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}>
                  <HardHat className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="text-center">
                  <p className={`font-bold text-xs md:text-sm tracking-widest uppercase ${role === 'worker' ? 'text-primary' : 'text-muted-foreground'}`}>I am a Worker</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1 font-medium italic">FIND SKILLED WORK</p>
                </div>
              </button>
              
              <button 
                onClick={() => setRole('employer')}
                className={`group p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-4 ${role === 'employer' ? 'border-cyan-500 bg-cyan-500/10' : 'border-muted/50 hover:border-cyan-500/40'}`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors ${role === 'employer' ? 'bg-cyan-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-cyan-500/20 group-hover:text-cyan-500'}`}>
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="text-center">
                  <p className={`font-bold text-xs md:text-sm tracking-widest uppercase ${role === 'employer' ? 'text-cyan-500' : 'text-muted-foreground'}`}>I am an Employer</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1 font-medium italic">HIRE THE FORCE</p>
                </div>
              </button>
            </div>
          </div>
          )}

          {!isAuthenticated && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-10">
              <TabsList className="grid w-full grid-cols-2 mb-10 h-16 bg-muted/40 p-1.5 rounded-[1.5rem]">
                <TabsTrigger value="login" className="text-sm font-bold uppercase tracking-widest rounded-2xl transition-all data-[state=active]:bg-foreground data-[state=active]:text-background">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-bold uppercase tracking-widest rounded-2xl transition-all data-[state=active]:bg-foreground data-[state=active]:text-background">Create Account</TabsTrigger>
              </TabsList>
  
              <TabsContent value="login">
                {/* ... (existing login content) */}
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="text-center pb-8 px-0">
                    <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
                    <CardDescription className="text-sm">Sign in to your {role} mission control.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {role === 'worker' ? (
                      <form onSubmit={handleWorkerLogin} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              placeholder="99999 00000" 
                              className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg" 
                              value={loginData.phone} 
                              onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} 
                              required 
                            />
                          </div>
                        </div>
                        
                        {loginStep === 2 && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Verification Code</Label>
                            <div className="relative group">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="0 0 0 0 0 0" 
                                className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg tracking-[0.5em] font-bold" 
                                value={loginOtp}
                                onChange={(e) => setLoginOtp(e.target.value)}
                                maxLength={6}
                                required 
                              />
                            </div>
                          </motion.div>
                        )}
  
                        <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/20" disabled={isLoading}>
                          {isLoading ? 'Verifying...' : (loginStep === 1 ? 'Send Code' : 'Access Dashboard')}
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleEmployerLogin} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input 
                              placeholder="ceo@company.com" 
                              className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg" 
                              value={loginData.identifier}
                              onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                              required 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                            <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">Lost Password?</button>
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="••••••••" 
                              className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg" 
                              value={loginData.password}
                              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                              required 
                            />
                          </div>
                        </div>
                        <Button type="submit" size="lg" className="w-full h-16 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-bold uppercase tracking-widest transition-all active:scale-95" disabled={isLoading}>
                          {isLoading ? 'Decrypting...' : 'Sign In Now'}
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
  
              <TabsContent value="register">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="text-center pb-8 px-0">
                    <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                    <CardDescription className="text-sm">Join the next-gen {role} ecosystem.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {role === 'worker' ? (
                      <form onSubmit={handleWorkerRegister} className="space-y-6">
                        {regStep === 1 ? (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                              <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                  placeholder="E.g. Rajesh Kumar" 
                                  className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg" 
                                  value={regData.name}
                                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                              <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                  placeholder="99887 76655" 
                                  className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg" 
                                  value={regData.phone}
                                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                                  required 
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Verify Phone (6-Digits)</Label>
                            <div className="relative group">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="0 0 0 0 0 0" 
                                className="pl-12 h-16 rounded-2xl bg-muted/30 border-0 text-lg tracking-[0.5em] font-bold" 
                                value={regOtp}
                                onChange={(e) => setRegOtp(e.target.value)}
                                maxLength={6}
                                required 
                              />
                            </div>
                          </div>
                        )}
                        
                        <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/20" disabled={isLoading}>
                          {isLoading ? 'Processing...' : (regStep === 1 ? 'Verify Phone' : 'Complete Setup')}
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleEmployerRegister} className="space-y-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input placeholder="Your Name" className="pl-12 h-14 rounded-xl bg-muted/30 border-0" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Company / Group Name</Label>
                          <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input placeholder="Enter Enterprise Name" className="pl-12 h-14 rounded-xl bg-muted/30 border-0" value={regData.company} onChange={(e) => setRegData({ ...regData, company: e.target.value })} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Work Email</Label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input placeholder="you@company.com" className="pl-12 h-14 rounded-xl bg-muted/30 border-0" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                            <Input type="password" placeholder="Create Password" className="pl-12 h-14 rounded-xl bg-muted/30 border-0" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} required />
                          </div>
                        </div>
                        <Button type="submit" size="lg" className="w-full h-16 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/10 mt-2" disabled={isLoading}>
                          {isLoading ? 'Initializing...' : 'Hire the Force'}
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
