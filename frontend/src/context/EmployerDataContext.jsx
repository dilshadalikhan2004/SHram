import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerDataContext = createContext(null);

export const useEmployerData = () => {
  const ctx = useContext(EmployerDataContext);
  if (!ctx) throw new Error('useEmployerData must be used within EmployerDataProvider');
  return ctx;
};

export const EmployerDataProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Core Data ──
  const [profile, setProfile] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active_jobs: 0,
    total_hired: 0,
    pending_payments: 0,
    attendance_today: 0
  });

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    if (!user || (user.role !== 'employer' && user.role !== 'both')) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [profileRes, jobsRes, appsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/employer/profile`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/jobs/my-jobs`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/applications/employer`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/notifications`, { headers }).catch(() => ({ data: [] })),
      ]);

      setProfile(profileRes.data);
      setMyJobs(jobsRes.data || []);
      setApplicants(appsRes.data || []);
      setNotifications(notifRes.data || []);

      // Calculate simple stats from fetched data
      const activeJobs = (jobsRes.data || []).filter(j => j.status === 'open').length;
      const hiredCount = (appsRes.data || []).filter(a => a.status === 'accepted' || a.status === 'selected').length;
      
      setStats({
        active_jobs: activeJobs,
        total_hired: hiredCount,
        pending_payments: 0, // Placeholder
        attendance_today: 0  // Placeholder
      });

    } catch (err) {
      toast.error(parseApiError(err, "Failed to sync employer dashboard"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => fetchData();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'matched': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getApplicantStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'applied': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shortlisted': return 'bg-primary/10 text-primary border-primary/20';
      case 'selected': case 'accepted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const value = {
    profile, myJobs, applicants, notifications, loading, stats,
    fetchData, refreshData, getStatusColor, getApplicantStatusColor, unreadNotifications
  };

  return (
    <EmployerDataContext.Provider value={value}>
      {children}
    </EmployerDataContext.Provider>
  );
};
