import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useEmployerData, EmployerDataProvider } from '../context/EmployerDataContext';
import { Button } from '../components/ui/button';
import ChatPanel from '../components/ChatPanel';
import AIChatbot from '../components/AIChatbot';
import {
  LayoutDashboard, Briefcase, Users, Wallet, 
  Settings, Bell, MessageSquare, LogOut, 
  Search, PlusCircle, ShieldCheck, PieChart, Crown,
  ChevronRight, Menu, X, FileText, BadgeCheck
} from 'lucide-react';

const EmployerLayoutInner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const { unreadNotifications, stats } = useEmployerData();

  const [showChat, setShowChat] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/auth'); };

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { to: '/employer/home', icon: LayoutDashboard, label: 'Control Center' },
        { to: '/employer/jobs', icon: Briefcase, label: 'Missions (Jobs)' },
        { to: '/employer/workers', icon: Users, label: 'Workforce' },
        { to: '/employer/squads', icon: BadgeCheck, label: 'Verified Squads' },
      ]
    },
    {
      title: 'Back Office',
      items: [
        { to: '/employer/payroll', icon: Wallet, label: 'Payroll & Escrow' },
        { to: '/employer/contracts', icon: FileText, label: 'Digital Contracts' },
        { to: '/employer/compliance', icon: ShieldCheck, label: 'Compliance Hub' },
        { to: '/employer/analytics', icon: PieChart, label: 'Live Analytics' },
        { to: '/employer/subscription', icon: Crown, label: 'Upgrades & Billing' },
      ]
    }
  ];

  const sidebarClass = ({ isActive }) =>
    `flex items-center ${isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'} py-4 rounded-2xl w-full transition-all group relative overflow-hidden ${
      isActive
        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5 border border-primary/20'
        : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-background dark:bg-[#0A0A0B] text-foreground selection:bg-orange-500/30 precision-grid font-['Manrope'] relative employer-theme">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      {/* TOP HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center glass border-b border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate('/employer/home')}
          >
            <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-400 to-amber-500 font-['Space_Grotesk'] tracking-tighter uppercase">
              ShramSetu
            </span>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">
              Enterprise Portal
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center px-4 py-2 rounded-xl bg-muted/20 border border-white/5 focus-within:border-primary/30 transition-all group">
            <Search className="w-4 h-4 mr-3 text-muted-foreground group-focus-within:text-primary" />
            <input
              className="bg-transparent border-none focus:outline-none text-xs w-64 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40"
              placeholder="Search workers, jobs or invoices..."
            />
          </div>

          {/* Removed redundant Deploy Mission button */}

          <div className="flex items-center gap-2 h-10 px-1 rounded-xl bg-muted/20 border border-white/5">
            <button onClick={() => setShowChat(!showChat)} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <MessageSquare className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
            <button onClick={() => navigate('/employer/notifications')} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <Bell className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
              {unreadNotifications > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />}
            </button>
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={() => navigate('/employer/settings')} className="p-2 rounded-lg transition-all hover:bg-white/10 group">
              <Settings className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg transition-all hover:bg-rose-500/10 group">
              <LogOut className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-rose-500" />
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-500 bg-background/50 border-r border-white/5 backdrop-blur-md flex flex-col pt-28 pb-10 ${isSidebarOpen ? 'w-80 px-6' : 'w-24 px-3 items-center'}`}>
        <div className="mb-4 px-2" />

        <nav className="flex-1 w-full space-y-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {isSidebarOpen && (
                <h4 className="text-[9px] uppercase font-black tracking-[0.3em] text-muted-foreground/30 px-5 mb-2">
                  {group.title}
                </h4>
              )}
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} className={sidebarClass}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.div layoutId="employer-nav-bg" className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full" />}
                      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'fill-primary/20' : ''}`} />
                      {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest font-['Space_Grotesk']">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
           {isSidebarOpen && (
             <div className="p-5 rounded-3xl bg-muted/10 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-['Space_Grotesk']">Quick Stats</p>
                   <PieChart className="w-3 h-3 text-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-xl font-black font-['Space_Grotesk']">{stats.active_jobs}</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground/40">Missions</p>
                   </div>
                   <div>
                      <p className="text-xl font-black font-['Space_Grotesk']">{stats.total_hired}</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground/40">Deployed</p>
                   </div>
                </div>
             </div>
           )}
           <Button 
            variant="ghost" 
            className={`w-full ${isSidebarOpen ? 'justify-start px-5' : 'justify-center px-0'} gap-4 text-muted-foreground hover:text-foreground group`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           >
             <Menu className="w-5 h-5 group-hover:rotate-180 transition-transform" />
             {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em] font-['Space_Grotesk']">Collapse Grid</span>}
           </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`transition-all duration-500 pt-32 pb-24 px-8 xl:px-16 relative z-10 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-28'}`}>
        <Outlet context={{ showChat, setShowChat, selectedChatUserId, setSelectedChatUserId }} />
      </main>

      {/* CHAT PANEL overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg z-[60]"
          >
            <ChatPanel onClose={() => { setShowChat(false); setSelectedChatUserId(null); }} initialUserId={selectedChatUserId} />
          </motion.div>
        )}
      </AnimatePresence>

      <AIChatbot />
    </div>
  );
};

// Wrap with Provider
const EmployerLayout = () => (
  <EmployerDataProvider>
    <EmployerLayoutInner />
  </EmployerDataProvider>
);

export default EmployerLayout;
