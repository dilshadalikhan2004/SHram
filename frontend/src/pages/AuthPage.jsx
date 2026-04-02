import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sun, Moon, Briefcase, HardHat, ArrowRight, Mail, Lock, User, Phone, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, sendOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    document.title = 'Secure Logic | ShramSetu Platform';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Access the ShramSetu operational matrix via secure Signal Code (OTP) or traditional authentication.');
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [role, setRole] = useState('worker');
  const [isOtpMode, setIsOtpMode] = useState(true); // Default workers to OTP
  const [otpStep, setOtpStep] = useState(1); // 1: Phone, 2: Code
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({ phone: '', email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code/NewPass
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetData, setResetData] = useState({ token: '', new_password: '' });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Build a clean payload based on the active login mode
      let payload;
      if (isOtpMode) {
        // OTP mode: phone + otp only
        payload = { phone: loginData.phone, otp: otp };
      } else {
        // Password mode: send identifier as both phone and email — backend tries both
        const id = loginData.email.trim();
        payload = {
          phone: id.includes('@') ? null : id,
          email: id.includes('@') ? id : null,
          password: loginData.password
        };
      }

      const user = await login(payload);
      toast.success('Welcome back!');
      
      const isSetupNeeded = !user.profile_complete;
      const primaryRole = user.role === 'both' ? 'worker' : user.role;
      
      if (isSetupNeeded) {
        navigate(primaryRole === 'worker' ? '/worker/profile/setup' : '/employer/profile/setup');
      } else {
        navigate(primaryRole === 'worker' ? '/worker' : '/employer');
      }
    } catch (error) {
      toast.error(parseApiError(error, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!loginData.phone) return toast.error('Enter phone number first');
    setIsLoading(true);
    try {
      await sendOtp(loginData.phone);
      toast.success('Signal sent! Check logs/phone.');
      setOtpStep(2);
    } catch (error) {
      toast.error(parseApiError(error, 'Signal failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await register({ ...registerData, role });
      toast.success('Account created successfully!');
      
      // New users always go to setup
      const primaryRole = user.role === 'both' ? 'worker' : user.role;
      navigate(primaryRole === 'worker' ? '/worker/profile/setup' : '/employer/profile/setup');
    } catch (error) {
      toast.error(parseApiError(error, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: forgotEmail });
      toast.success('Reset code sent!');
      setForgotStep(2);
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send reset code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email: forgotEmail,
        token: resetData.token,
        new_password: resetData.new_password
      });
      toast.success('Password updated! Please login.');
      setIsForgotMode(false);
      setForgotStep(1);
      setActiveTab('login');
      setLoginData({ ...loginData, email: forgotEmail });
    } catch (error) {
      toast.error(parseApiError(error, 'Reset failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      {/* ═══ LEFT PANEL: BRANDING ═══ */}
      <div className="lg:w-1/2 bg-slate-950 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-white/5">
        {/* Technical Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.15),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02]" />
        </div>
        
        {/* Animated Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
              <HardHat className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">ShramSetu</h1>
              <p className="text-primary text-xs font-bold tracking-[0.3em] uppercase">Refined Labor</p>
            </div>
          </motion.div>
          
          <div className="mt-12 lg:mt-32">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl lg:text-7xl font-bold text-white font-['Space_Grotesk'] leading-[1.1] tracking-tighter">
              Industrial<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Precision</span><br />
              In Hiring.
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 text-xl text-slate-400 max-w-md leading-relaxed font-['Space_Grotesk']">
              The next generation of India's labor marketplace. Powered by AI, built for high-craft reliability.
            </motion.p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10 hidden lg:flex items-center gap-8 mt-12">
          <div className="flex items-center gap-4 py-4 pr-8 border-r border-white/10">
            <div className="text-white">
              <p className="text-3xl font-bold font-['Space_Grotesk']">10k+</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Jobs Verified</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white">
              <p className="text-3xl font-bold font-['Space_Grotesk']">50k+</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Force</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="lg:w-1/2 p-6 lg:p-24 flex flex-col justify-center bg-background relative selection:bg-primary selection:text-white">
        {/* Toggle Theme */}
        <div className="absolute top-8 right-8">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-2xl glass-card w-12 h-12 hover:border-primary/50 transition-all active:scale-95">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-primary" />}
          </Button>
        </div>

        <div className="max-w-md mx-auto w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-10 h-14 bg-muted/30 p-1.5 rounded-2xl glass-card">
              <TabsTrigger value="login" className="text-sm font-bold uppercase tracking-widest rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-['Space_Grotesk']">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-sm font-bold uppercase tracking-widest rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-['Space_Grotesk']">Join Us</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 outline-none">
              <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
                <Card className="border-0 bg-transparent overflow-hidden">
                  <CardHeader className="pb-8 pt-10 px-8 text-center">
                    <CardTitle className="text-4xl font-bold font-['Space_Grotesk'] tracking-tighter text-foreground mb-2">
                      {isForgotMode ? 'Secure Recovery' : 'Precision Access'}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground font-['Space_Grotesk']">
                      {isForgotMode 
                        ? (forgotStep === 1 ? 'Verify identity to regain control' : 'Set your new high-security password')
                        : 'Welcome back to the industrial precision force.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-10">
                  {!isForgotMode ? (
                      <div className="space-y-6">
                        {/* OTP/Password Toggle */}
                        <div className="flex bg-muted/30 p-1 rounded-xl glass-card mb-4">
                          <button onClick={() => { setIsOtpMode(true); setOtpStep(1); }} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${isOtpMode ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>Signal Code (OTP)</button>
                          <button onClick={() => setIsOtpMode(false)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${!isOtpMode ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>Security Member</button>
                        </div>

                        {isOtpMode ? (
                          <form onSubmit={otpStep === 1 ? handleSendOtp : handleLogin} className="space-y-6">
                            <div className="space-y-2.5">
                              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                              <div className="group relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input type="text" placeholder="+91 00000 00000" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={loginData.phone} onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} required disabled={otpStep === 2} />
                              </div>
                            </div>

                            {otpStep === 2 && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2.5">
                                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Access Signal (6-Digit)</Label>
                                <div className="group relative">
                                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input type="text" placeholder="000000" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg tracking-[0.5em]" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
                                </div>
                                <button type="button" onClick={() => setOtpStep(1)} className="text-xs font-bold text-primary hover:underline ml-1 uppercase tracking-widest">Wrong Number?</button>
                              </motion.div>
                            )}

                            <Button type="submit" className="w-full h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                              {isLoading ? (otpStep === 1 ? 'Transmitting...' : 'Decrypting...') : (otpStep === 1 ? 'Request Signal' : 'Enter Command')}
                              {!isLoading && <ArrowRight className="w-5 h-5 ml-3" />}
                            </Button>
                          </form>
                        ) : (
                          <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2.5">
                              <Label htmlFor="login-email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone or Email</Label>
                              <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input id="login-email" type="text" placeholder="Phone number or email" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} required />
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="login-password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Security Key</Label>
                                <button type="button" onClick={() => setIsForgotMode(true)} className="text-xs font-bold text-primary hover:underline transition-opacity">LOST KEY?</button>
                              </div>
                              <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            <Button type="submit" className="w-full h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                              {isLoading ? 'Decrypting Access...' : 'Authenticate'}
                              {!isLoading && <ArrowRight className="w-5 h-5 ml-3" />}
                            </Button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {forgotStep === 1 ? (
                          <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div className="space-y-2.5">
                              <Label htmlFor="reset-email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Account Email</Label>
                              <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input id="reset-email" type="email" placeholder="you@enterprise.com" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <Button type="submit" className="w-full h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Request Reset Code'}
                              </Button>
                              <Button type="button" variant="ghost" onClick={() => setIsForgotMode(false)} className="w-full h-12 text-muted-foreground hover:text-foreground font-bold text-sm tracking-widest uppercase rounded-xl transition-all">
                                Back to Access
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2.5">
                              <Label htmlFor="reset-code" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Verification Code</Label>
                              <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input id="reset-code" type="text" placeholder="6-digit code" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={resetData.token} onChange={(e) => setResetData({ ...resetData, token: e.target.value })} required />
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <Label htmlFor="reset-password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">New Security Key</Label>
                              <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input id="reset-password" type="password" placeholder="Min. 8 characters" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg" value={resetData.new_password} onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })} required minLength={8} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <Button type="submit" className="w-full h-16 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update & Secure'}
                              </Button>
                              <div className="flex justify-between w-full px-2 mt-2">
                                <button type="button" onClick={() => toast.success('Signal resent! Check your phone.')} className="text-xs font-bold text-primary hover:underline transition-opacity uppercase tracking-widest">Resend Code</button>
                                <button type="button" onClick={() => { setIsForgotMode(false); setForgotStep(1); }} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-opacity uppercase tracking-widest">Cancel Recovery</button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                    

                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 outline-none">
              <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl">
                <Card className="border-0 bg-transparent overflow-hidden">
                  <CardHeader className="pb-8 pt-10 px-8 text-center">
                    <CardTitle className="text-4xl font-bold font-['Space_Grotesk'] tracking-tighter text-foreground mb-2">Join the Force</CardTitle>
                    <CardDescription className="text-base text-muted-foreground font-['Space_Grotesk']">Initialize your industrial profile</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-10">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button type="button" onClick={() => setRole('worker')} className={`group p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${role === 'worker' ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-primary/50'}`}>
                        <div className={`p-3 rounded-xl transition-colors ${role === 'worker' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}><HardHat className="w-6 h-6" /></div>
                        <div className="text-center">
                          <p className={`font-bold font-['Space_Grotesk'] text-sm tracking-widest uppercase ${role === 'worker' ? 'text-primary' : 'text-muted-foreground'}`}>Worker</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Find Work</p>
                        </div>
                      </button>
                      <button type="button" onClick={() => setRole('employer')} className={`group p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${role === 'employer' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 hover:border-cyan-500/50'}`}>
                        <div className={`p-3 rounded-xl transition-colors ${role === 'employer' ? 'bg-cyan-500 text-white' : 'bg-muted/50 text-muted-foreground group-hover:bg-cyan-500/20 group-hover:text-cyan-500'}`}><Briefcase className="w-6 h-6" /></div>
                        <div className="text-center">
                          <p className={`font-bold font-['Space_Grotesk'] text-sm tracking-widest uppercase ${role === 'employer' ? 'text-cyan-500' : 'text-muted-foreground'}`}>Employer</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Direct Hire</p>
                        </div>
                      </button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="register-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Identity Name</Label>
                        <div className="group relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="register-name" type="text" placeholder="Full legal name" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk']" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Enterprise Email</Label>
                        <div className="group relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="register-email" type="email" placeholder="you@domain.com" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk']" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Direct Phone</Label>
                        <div className="group relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="register-phone" type="tel" placeholder="+91 00000 00000" className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk']" value={registerData.phone} onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" title="High Security Key" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Access Key</Label>
                        <div className="group relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="register-password" type={showRegPassword ? 'text' : 'password'} placeholder="Create high-security key" className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk']" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} required />
                          <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                            {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className={`w-full h-16 rounded-[1.25rem] text-white font-bold text-lg font-['Space_Grotesk'] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] mt-4 ${role === 'worker' ? 'bg-primary shadow-primary/20' : 'bg-cyan-600 shadow-cyan-600/20'}`} disabled={isLoading}>
                        {isLoading ? 'Initializing...' : 'Construct Account'}
                        <ArrowRight className="w-5 h-5 ml-3" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
