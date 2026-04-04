import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

const ONBOARD_STEPS = [
  { path: 'language', label: 'Language', labelHi: 'भाषा' },
  { path: 'phone', label: 'Phone', labelHi: 'फ़ोन' },
  { path: 'kyc', label: 'KYC', labelHi: 'केवाईसी' },
  { path: 'skills', label: 'Skills', labelHi: 'कौशल' },
  { path: 'location', label: 'Location', labelHi: 'स्थान' },
  { path: 'portfolio', label: 'Portfolio', labelHi: 'पोर्टफ़ोलियो' },
  { path: 'done', label: 'Done', labelHi: 'पूर्ण' },
];

const OnboardLayout = () => {
  const location = useLocation();
  const currentStep = ONBOARD_STEPS.findIndex(s => location.pathname.includes(s.path));

  return (
    <div className="min-h-screen bg-background text-foreground font-['Manrope'] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between glass border-b border-white/5 backdrop-blur-xl">
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-500 font-['Space_Grotesk'] tracking-tighter uppercase">
          ShramSetu
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk']">
          Step {currentStep + 1} of {ONBOARD_STEPS.length}
        </span>
      </header>

      {/* Progress Steps */}
      <div className="fixed top-[72px] left-0 w-full z-40 px-6 py-3 glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {ONBOARD_STEPS.map((step, i) => (
            <React.Fragment key={step.path}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  i < currentStep
                    ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                    : i === currentStep
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] scale-110'
                    : 'bg-muted/20 text-muted-foreground/40 border border-white/10'
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] font-['Space_Grotesk'] hidden sm:block ${
                  i <= currentStep ? 'text-foreground' : 'text-muted-foreground/30'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < ONBOARD_STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 rounded-full transition-all duration-500 ${
                  i < currentStep ? 'bg-green-500/50' : 'bg-white/5'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="pt-36 pb-12 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default OnboardLayout;
