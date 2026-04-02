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
    return <Navigate to={user.role === 'worker' ? '/worker' : '/employer'} replace />;
  }

  return children;
};

// Home redirect based on role
const HomeRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === 'worker') {
    return <Navigate to="/worker" replace />;
  } else if (user.role === 'employer') {
    return <Navigate to="/employer" replace />;
  } else {
    // For 'both' role, default to worker dashboard
    return <Navigate to="/worker" replace />;
  }
};

// Auth redirect (if already logged in)
const AuthRedirect = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user.role === 'worker') {
      return <Navigate to="/worker" replace />;
    } else if (user.role === 'employer') {
      return <Navigate to="/employer" replace />;
    } else {
      return <Navigate to="/worker" replace />;
    }
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
        {/* Home - redirect based on auth status */}
        <Route path="/" element={<PageWrapper><HomeRedirect /></PageWrapper>} />

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

        {/* Worker Routes */}
        <Route
          path="/worker"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['worker', 'both']}>
                <WorkerDashboard />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/worker/profile/setup"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['worker', 'both']}>
                <WorkerProfileSetup />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/worker/profile/edit"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['worker', 'both']}>
                <WorkerProfileSetup />
              </ProtectedRoute>
            </PageWrapper>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/employer"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['employer', 'both']}>
                <EmployerDashboard />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/employer/profile/setup"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['employer', 'both']}>
                <EmployerProfileSetup />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/employer/profile/edit"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['employer', 'both']}>
                <EmployerProfileSetup />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/employer/boost/success"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['employer', 'both']}>
                <BoostSuccessPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/worker/skills-assessment"
          element={
            <PageWrapper>
              <ProtectedRoute allowedRoles={['worker', 'both']}>
                <SkillsAssessmentPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />

        {/* Catch all - redirect to home */}
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
