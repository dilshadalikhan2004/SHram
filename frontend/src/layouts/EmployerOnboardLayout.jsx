import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Building2, Phone, User, CheckCircle } from 'lucide-react';

const ONBOARD_STEPS = [
  { path: 'company', label: 'Company', icon: Building2 },
  { path: 'verify', label: 'Verify', icon: ShieldCheck },
  { path: 'phone', label: 'Phone', icon: Phone },
  { path: 'profile', label: 'Profile', icon: User },
  { path: 'done', label: 'Done', icon: CheckCircle },
];

const EmployerOnboardLayout = () => {
  const location = useLocation();
  const currentStep = ONBOARD_STEPS.findIndex(s => location.pathname.includes(s.path));

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground font-['Manrope'] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between glass border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-500 font-['Space_Grotesk'] tracking-tighter uppercase">
            ShramSetu
          </span>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">
            Employer Initialization
          </span>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk']">
            Phase {currentStep + 1} / 5
          </span>
        </div>
      </header>

      {/* Progress Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-80 hidden xl:flex flex-col pt-32 pb-10 px-10 border-r border-white/5 z-40 bg-black/20 backdrop-blur-md">
        <div className="space-y-8">
          {ONBOARD_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;

            return (
              <div key={step.path} className={`flex items-center gap-6 transition-all duration-500 ${isActive ? 'translate-x-2' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : isActive 
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' 
                    : 'bg-white/5 text-muted-foreground/30 border border-white/5'
                }`}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`text-[10px] uppercase font-black tracking-[0.2em] mb-1 ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground/30'}`}>
                    Step 0{i + 1}
                  </p>
                  <p className={`text-sm font-bold tracking-tight ${isActive ? 'text-foreground' : isCompleted ? 'text-foreground/80' : 'text-muted-foreground/20'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto p-6 rounded-3xl bg-muted/10 border border-white/5">
           <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">Security Protocol</p>
           <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium">
             Your enterprise data is encrypted and stored in ShramSetu's sovereign cloud.
           </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-80 pt-36 pb-20 px-8 relative z-10 flex justify-center">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Progress Bar */}
      <div className="xl:hidden fixed bottom-10 left-8 right-8 z-50 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / ONBOARD_STEPS.length) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default EmployerOnboardLayout;
