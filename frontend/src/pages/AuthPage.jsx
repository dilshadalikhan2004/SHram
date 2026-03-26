import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sun, Moon, Briefcase, HardHat, ArrowRight, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [role, setRole] = useState('worker');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
      navigate(user.role === 'worker' ? '/worker' : '/employer');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
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
      navigate(user.role === 'worker' ? '/worker/profile/setup' : '/employer/profile/setup');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#0066FF] via-[#0052CC] to-[#003D99] p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#059669] blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Outfit']">ShramSetu</h1>
              <p className="text-white/70 text-sm">श्रमसेतु</p>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-24">
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-['Outfit'] leading-tight">
              India's Smart<br />Labor Marketplace
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-md">
              Connecting skilled workers with verified employers through AI-powered matching.
            </p>
          </div>
        </div>

        <div className="relative z-10 hidden lg:flex items-center gap-6 mt-12">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">10,000+</p>
              <p className="text-white/60 text-sm">Jobs Posted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">50,000+</p>
              <p className="text-white/60 text-sm">Workers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center bg-background">
        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        <div className="max-w-md mx-auto w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="login" className="text-base" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-base" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-fade-in">
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-['Outfit']">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-11"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          data-testid="login-email-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10 h-11"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          data-testid="login-password-input"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 btn-worker"
                      disabled={isLoading}
                      data-testid="login-submit-btn"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Demo Accounts:</p>
                    <p className="text-xs text-muted-foreground">Worker: ramesh@demo.com / demo123</p>
                    <p className="text-xs text-muted-foreground">Employer: abc@contractor.com / demo123</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="animate-fade-in">
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-['Outfit']">Create Account</CardTitle>
                  <CardDescription>Join as a worker or employer</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setRole('worker')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        role === 'worker'
                          ? 'border-[#0066FF] bg-[#0066FF]/10'
                          : 'border-border hover:border-[#0066FF]/50'
                      }`}
                      data-testid="role-worker-btn"
                    >
                      <HardHat className={`w-6 h-6 mx-auto mb-2 ${role === 'worker' ? 'text-[#0066FF]' : 'text-muted-foreground'}`} />
                      <p className={`font-medium ${role === 'worker' ? 'text-[#0066FF]' : ''}`}>Worker</p>
                      <p className="text-xs text-muted-foreground">Find jobs</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        role === 'employer'
                          ? 'border-[#059669] bg-[#059669]/10'
                          : 'border-border hover:border-[#059669]/50'
                      }`}
                      data-testid="role-employer-btn"
                    >
                      <Briefcase className={`w-6 h-6 mx-auto mb-2 ${role === 'employer' ? 'text-[#059669]' : 'text-muted-foreground'}`} />
                      <p className={`font-medium ${role === 'employer' ? 'text-[#059669]' : ''}`}>Employer</p>
                      <p className="text-xs text-muted-foreground">Hire workers</p>
                    </button>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Enter your name"
                          className="pl-10 h-11"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          required
                          data-testid="register-name-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-11"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required
                          data-testid="register-email-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Phone (optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className="pl-10 h-11"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          data-testid="register-phone-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          className="pl-10 h-11"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          data-testid="register-password-input"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className={`w-full h-11 ${role === 'worker' ? 'btn-worker' : 'btn-employer'}`}
                      disabled={isLoading}
                      data-testid="register-submit-btn"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
