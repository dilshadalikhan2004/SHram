import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

// Pages
import AuthPage from './pages/AuthPage';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import WorkerProfileSetup from './pages/WorkerProfileSetup';
import EmployerProfileSetup from './pages/EmployerProfileSetup';

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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
  } else {
    return <Navigate to="/employer" replace />;
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
    return <Navigate to={user.role === 'worker' ? '/worker' : '/employer'} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Home - redirect based on auth status */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Auth */}
      <Route
        path="/auth"
        element={
          <AuthRedirect>
            <AuthPage />
          </AuthRedirect>
        }
      />

      {/* Worker Routes */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile/setup"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile/edit"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/profile/setup"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/profile/edit"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
