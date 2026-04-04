import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/TranslationContext';
import { useWorkerData } from '../context/WorkerDataContext';
import { WorkerDataProvider } from '../context/WorkerDataContext';
import { Button } from '../components/ui/button';
import VoiceSearchButton from '../components/VoiceSearchButton';
import LanguageSelector from '../components/LanguageSelector';
import FilterDrawer from '../components/FilterDrawer';
import ChatPanel from '../components/ChatPanel';
import AIChatbot from '../components/AIChatbot';
import {
  Search, Bell, MessageSquare, LogOut, Filter,
  LayoutDashboard, Briefcase, Wallet, Bookmark, User,
  MapPin, FolderOpen, Users, Shield, HelpCircle
} from 'lucide-react';

const WorkerLayoutInner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const {
    searchQuery, setSearchQuery, fetchData, unreadNotifications,
    categories, appliedFilters, setAppliedFilters
  } = useWorkerData();

  const [showChat, setShowChat] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth'); };

  const sidebarItems = [
    { to: '/worker/home', icon: LayoutDashboard, label: t('dashboard') || 'Home' },
    { to: '/worker/jobs', icon: Search, label: 'Jobs' },
    { to: '/worker/bids', icon: Briefcase, label: t('my_applications') || 'My Bids' },
    { to: '/worker/wallet', icon: Wallet, label: t('wallet_balance') || 'Wallet' },
    { to: '/worker/portfolio', icon: FolderOpen, label: 'Portfolio' },
    { to: '/worker/squads', icon: Users, label: 'Squads' },
    { to: '/worker/profile', icon: User, label: t('profile') || 'Profile' },
  ];

  const mobileNavItems = [
    { to: '/worker/home', icon: LayoutDashboard, label: 'Home' },
    { to: '/worker/jobs', icon: Search, label: 'Jobs' },
    { to: '/worker/bids', icon: Briefcase, label: 'Bids' },
    { to: '/worker/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/worker/profile', icon: User, label: 'Profile' },
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all text-left group relative overflow-hidden ${
      isActive
        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5 border border-primary/20'
        : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 precision-grid font-['Manrope'] relative">
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setAppliedFilters}
        categories={categories}
        initialFilters={appliedFilters}
      />

      {/* ─── BACKGROUND DECOR ─── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      {/* ─── TOP NAV ─── */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center glass border-b border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-16">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-500 font-['Space_Grotesk'] tracking-tighter uppercase cursor-pointer"
            onClick={() => navigate('/worker/home')}
          >
            ShramSetu
          </motion.span>
        </div>

        <div className="flex items-center gap-6">
          {/* Search bar (desktop) */}
          <div className="hidden xl:flex items-center px-5 py-2 rounded-2xl bg-muted/20 border border-white/5 focus-within:border-primary/30 transition-all shadow-inner group">
            <Search className="w-4 h-4 mr-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="bg-transparent border-none focus:outline-none text-xs w-56 text-foreground font-['Space_Grotesk'] font-bold placeholder:text-muted-foreground/40"
              placeholder={t('search_matrix') || 'Search jobs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <VoiceSearchButton onResult={(text) => { setSearchQuery(text); navigate('/worker/jobs'); }} className="w-5 h-5 ml-3 opacity-60 hover:opacity-100 transition-opacity" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFilterOpen(true)}
            className={`rounded-xl transition-all ${isFilterOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
          >
            <Filter className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 h-10 px-1 rounded-xl bg-muted/20 border border-white/5">
            <LanguageSelector variant="ghost" />
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={() => setShowChat(!showChat)} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <MessageSquare className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
            <button onClick={() => navigate('/worker/notifications')} className="relative p-2 rounded-lg transition-all hover:bg-primary/10 group">
              <Bell className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
              {unreadNotifications > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />}
            </button>
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={handleLogout} className="p-2 rounded-lg transition-all hover:bg-destructive/10 group">
              <LogOut className="w-5 h-5 text-muted-foreground transition-colors group-hover:text-destructive" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SIDEBAR (desktop) ─── */}
      <aside className="fixed left-0 top-0 h-full w-72 z-40 hidden lg:flex flex-col pt-28 pb-12 px-6 bg-background/50 border-r border-white/5 backdrop-blur-md overflow-y-auto scrollbar-hide">
        <div className="mb-4 px-2" />

        <nav className="space-y-2 flex-1">
          {sidebarItems.map(item => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.div layoutId="nav-bg" className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full" />}
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'fill-primary/20' : ''}`} />
                  <span className="text-xs font-black uppercase tracking-widest font-['Space_Grotesk']">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom sidebar links */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <NavLink to="/worker/notifications" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <Bell className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-xs font-black uppercase tracking-widest font-['Space_Grotesk']">Alerts</span>
                {unreadNotifications > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black">{unreadNotifications}</span>
                )}
              </>
            )}
          </NavLink>
          <NavLink to="/worker/support" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <HelpCircle className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-xs font-black uppercase tracking-widest font-['Space_Grotesk']">Support</span>
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="lg:ml-72 pt-28 pb-32 px-8 xl:px-16 max-w-[1600px] relative z-10">
        <Outlet context={{ showChat, setShowChat, selectedChatUserId, setSelectedChatUserId }} />
      </main>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-around items-center px-4 py-3 rounded-2xl glass border border-white/10 shadow-2xl">
        {mobileNavItems.map(item => (
          <NavLink key={item.to} to={item.to} className="flex flex-col items-center justify-center transition-all active:scale-90">
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] uppercase tracking-widest mt-1 font-bold font-['Space_Grotesk'] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ─── CHAT PANEL ─── */}
      {showChat && <ChatPanel onClose={() => { setShowChat(false); setSelectedChatUserId(null); }} initialUserId={selectedChatUserId} />}

      {/* ─── AI CHATBOT ─── */}
      <AIChatbot />
    </div>
  );
};

// Wrap the layout with the data provider
const WorkerLayout = () => (
  <WorkerDataProvider>
    <WorkerLayoutInner />
  </WorkerDataProvider>
);

export default WorkerLayout;
