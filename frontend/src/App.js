import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { TranslationProvider } from './context/TranslationContext';

// Pages
import AuthPage from './pages/AuthPage';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import WorkerProfileSetup from './pages/WorkerProfileSetup';
import EmployerProfileSetup from './pages/EmployerProfileSetup';
import BoostSuccessPage from './pages/BoostSuccessPage';
import SkillsAssessmentPage from './pages/SkillsAssessmentPage';
import PublicProfilePage from './pages/PublicProfilePage';
import LandingPage from './pages/LandingPage';

// Modular Worker Components
import WorkerLayout from './layouts/WorkerLayout';
import OnboardLayout from './layouts/OnboardLayout';
import { WorkerDataProvider } from './context/WorkerDataContext';

// Worker Pages
import WorkerHome from './pages/worker/WorkerHome';
import WorkerJobs from './pages/worker/WorkerJobs';
import WorkerJobDetail from './pages/worker/WorkerJobDetail';
import WorkerBids from './pages/worker/WorkerBids';
import WorkerWallet from './pages/worker/WorkerWallet';
import WorkerProfile from './pages/worker/WorkerProfile';
import WorkerEditProfile from './pages/worker/WorkerEditProfile';
import WorkerHandshake from './pages/worker/WorkerHandshake';
import WorkerPortfolio from './pages/worker/WorkerPortfolio';
import WorkerNotifications from './pages/worker/WorkerNotifications';
import WorkerSupport from './pages/worker/WorkerSupport';
import WorkerSquads from './pages/worker/WorkerSquads';

// Onboarding Pages
import OnboardLanguage from './pages/worker/onboard/OnboardLanguage';
import OnboardPhone from './pages/worker/onboard/OnboardPhone';
import OnboardKYC from './pages/worker/onboard/OnboardKYC';
import OnboardSkills from './pages/worker/onboard/OnboardSkills';
import OnboardLocation from './pages/worker/onboard/OnboardLocation';
import OnboardPortfolio from './pages/worker/onboard/OnboardPortfolio';
import OnboardDone from './pages/worker/onboard/OnboardDone';

// Employer Layouts
import EmployerLayout from './layouts/EmployerLayout';
import EmployerOnboardLayout from './layouts/EmployerOnboardLayout';

// Employer Pages
import EmployerHome from './pages/employer/EmployerHome';
import EmployerJobs from './pages/employer/EmployerJobs';
import EmployerJobNew from './pages/employer/EmployerJobNew';
import EmployerJobDetail from './pages/employer/EmployerJobDetail';
import EmployerWorkers from './pages/employer/EmployerWorkers';
import EmployerSquads from './pages/employer/EmployerSquads';
import EmployerPayroll from './pages/employer/EmployerPayroll';
import EmployerContracts from './pages/employer/EmployerContracts';
import EmployerCompliance from './pages/employer/EmployerCompliance';
import EmployerAnalyticsPage from './pages/employer/EmployerAnalyticsPage';
import EmployerNotifications from './pages/employer/EmployerNotifications';
import EmployerSettings from './pages/employer/EmployerSettings';
import EmployerSubscription from './pages/employer/EmployerSubscription';

// Employer Onboarding Pages
import OnboardCompanyEmpl from './pages/employer/onboard/OnboardCompany';
import OnboardVerifyEmpl from './pages/employer/onboard/OnboardVerify';
import OnboardPhoneEmpl from './pages/employer/onboard/OnboardPhone';
import OnboardProfileEmpl from './pages/employer/onboard/OnboardProfile';
import OnboardDoneEmpl from './pages/employer/onboard/OnboardDone';

import axios from 'axios';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'both') {
    return <Navigate to={user.role === 'worker' ? '/worker/home' : '/employer/home'} replace />;
  }

  // Redirect to onboarding if profile is incomplete and NOT already on an onboarding route
  const isWorkerOnboarding = location.pathname.startsWith('/worker/onboard');
  const isEmployerOnboarding = location.pathname.startsWith('/employer/onboard');

  if (user.role === 'worker' && !user.onboarding_completed && !isWorkerOnboarding) {
    return <Navigate to="/worker/onboard" replace />;
  }

  if ((user.role === 'employer' || user.role === 'both') && !user.onboarding_completed && !isEmployerOnboarding) {
    // Only redirect if they are trying to access employer dashboard routes
    if (location.pathname.startsWith('/employer') && !location.pathname.startsWith('/employer/onboard')) {
      return <Navigate to="/employer/onboard" replace />;
    }
  }

  return children;
};

// Removed HomeRedirect, we use LandingPage instead

// Auth redirect (if already logged in)
const AuthRedirect = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
};

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {children}
    </motion.div>
  );
};

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Home - Landing Page */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />

        {/* Auth */}
        <Route
          path="/auth"
          element={
            <PageWrapper>
              <AuthRedirect>
                <AuthPage />
              </AuthRedirect>
            </PageWrapper>
          }
        />

        {/* Worker Dashboard (Modular) */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRoles={['worker', 'both']}>
              <WorkerDataProvider>
                <WorkerLayout />
              </WorkerDataProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<WorkerHome />} />
          <Route path="jobs" element={<WorkerJobs />} />
          <Route path="jobs/:id" element={<WorkerJobDetail />} />
          <Route path="bids" element={<WorkerBids />} />
          <Route path="wallet" element={<WorkerWallet />} />
          <Route path="profile" element={<WorkerProfile />} />
          <Route path="profile/edit" element={<WorkerEditProfile />} />
          <Route path="handshake" element={<WorkerHandshake />} />
          <Route path="portfolio" element={<WorkerPortfolio />} />
          <Route path="notifications" element={<WorkerNotifications />} />
          <Route path="support" element={<WorkerSupport />} />
          <Route path="squads" element={<WorkerSquads />} />
        </Route>

        {/* Worker Onboarding (Linear) */}
        <Route
          path="/worker/onboard"
          element={
            <ProtectedRoute allowedRoles={['worker', 'both']}>
              <OnboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="language" replace />} />
          <Route path="language" element={<OnboardLanguage />} />
          <Route path="phone" element={<OnboardPhone />} />
          <Route path="kyc" element={<OnboardKYC />} />
          <Route path="skills" element={<OnboardSkills />} />
          <Route path="location" element={<OnboardLocation />} />
          <Route path="portfolio" element={<OnboardPortfolio />} />
          <Route path="done" element={<OnboardDone />} />
        </Route>

        {/* Catch all - worker redirects */}
        <Route path="/worker/dashboard" element={<Navigate to="/worker/home" replace />} />
        <Route path="/worker/profile/setup" element={<Navigate to="/worker/onboard" replace />} />
        <Route path="/worker/skills-assessment" element={<Navigate to="/worker/profile" replace />} />
        <Route
          path="/worker/profile/:id"
          element={
            <ProtectedRoute allowedRoles={['worker', 'employer', 'both']}>
              <PublicProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Employer Dashboard (Modular) */}
        <Route
          path="/employer"
          element={
            <ProtectedRoute allowedRoles={['employer', 'both']}>
              <EmployerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<EmployerHome />} />
          <Route path="jobs" element={<EmployerJobs />} />
          <Route path="jobs/new" element={<EmployerJobNew />} />
          <Route path="jobs/:id" element={<EmployerJobDetail />} />
          {/* Future routes: workers, payroll, etc. map to EmployerHome or MVP pages for now */}
          <Route path="workers" element={<EmployerWorkers />} />
          <Route path="squads" element={<EmployerSquads />} />
          <Route path="payroll" element={<EmployerPayroll />} />
          <Route path="contracts" element={<EmployerContracts />} />
          <Route path="compliance" element={<EmployerCompliance />} />
          <Route path="analytics" element={<EmployerAnalyticsPage />} />
          <Route path="notifications" element={<EmployerNotifications />} />
          <Route path="settings" element={<EmployerSettings />} />
          <Route path="subscription" element={<EmployerSubscription />} />
        </Route>

        {/* Employer Onboarding (Linear) */}
        <Route
          path="/employer/onboard"
          element={
            <ProtectedRoute allowedRoles={['employer', 'both']}>
              <EmployerOnboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="company" replace />} />
          <Route path="company" element={<OnboardCompanyEmpl />} />
          <Route path="verify" element={<OnboardVerifyEmpl />} />
          <Route path="phone" element={<OnboardPhoneEmpl />} />
          <Route path="profile" element={<OnboardProfileEmpl />} />
          <Route path="done" element={<OnboardDoneEmpl />} />
        </Route>

        {/* Catch all - employer redirects */}
        <Route path="/employer/dashboard" element={<Navigate to="/employer/home" replace />} />
        <Route path="/employer/profile/setup" element={<Navigate to="/employer/onboard" replace />} />
        <Route path="/employer/profile/edit" element={<Navigate to="/employer/onboard/profile" replace />} />
        <Route
          path="/employer/boost/success"
          element={
            <ProtectedRoute allowedRoles={['employer', 'both']}>
              <BoostSuccessPage />
            </ProtectedRoute>
          }
        />

        {/* Global Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  React.useEffect(() => {
    // Register Service Worker for Push Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          console.log('SW Registered');
          
          // Check for existing subscription
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription && Notification.permission === 'granted') {
            // Subscribe if permission is already granted but no subscription exists
            subscribeUser(registration);
          }
        })
        .catch(err => console.error('SW Registration Failed', err));
    }
  }, []);

  async function subscribeUser(registration) {
    try {
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey || vapidPublicKey === 'BCxxx_YOUR_PUBLIC_VAPID_KEY') {
        console.warn('VAPID public key not fully configured. Skipping push registration.');
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Save to backend
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/api/notifications/subscribe`, subscription, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Push Subscribed');
      }
    } catch (err) {
      console.error('Push Subscription Failed', err);
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <ThemeProvider>
      <TranslationProvider>
        <AuthProvider>
          <WebSocketProvider>
            <BrowserRouter>
              <div className="App">
                <AppRoutes />
                <Toaster position="top-right" richColors />
              </div>
            </BrowserRouter>
          </WebSocketProvider>
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default App;
