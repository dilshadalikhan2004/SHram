import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import { profileApi, applicationsApi, jobsApi } from '../lib/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WorkerDataContext = createContext(null);

export const useWorkerData = () => {
  const ctx = useContext(WorkerDataContext);
  if (!ctx) throw new Error('useWorkerData must be used within WorkerDataProvider');
  return ctx;
};

export const WorkerDataProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Core Data ──
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [workerStats, setWorkerStats] = useState({ profile_views: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── UI State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(() => {
    const cached = localStorage.getItem('worker_is_online');
    return cached ? JSON.parse(cached) : false;
  });
  const [appliedFilters, setAppliedFilters] = useState({
    category: 'all',
    minPay: '',
    maxPay: '',
    urgency: 'all',
    distance: 20
  });

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const filterParams = {
      category: appliedFilters.category,
      min_pay: appliedFilters.minPay ? parseInt(appliedFilters.minPay) * 100 : undefined,
      max_pay: appliedFilters.maxPay ? parseInt(appliedFilters.maxPay) * 100 : undefined,
      urgency: appliedFilters.urgency,
      search: searchQuery
    };

    try {
      const [jobsRes, profileRes, appsRes, statsRes, notifRes, catRes, savedRes] = await Promise.all([
        jobsApi.list(filterParams).catch(() => ({ data: [] })),
        profileApi.getWorkerProfile().catch(() => ({ data: null })),
        applicationsApi.getWorkerApplications().catch(() => ({ data: [] })),
        profileApi.getWorkerStats().catch(() => ({ data: { profile_views: 0 } })),
        axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/categories`).catch(() => ({ data: { categories: [] } })),
        jobsApi.getSaved().catch(() => ({ data: [] })),
      ]);

      setJobs(jobsRes.data || []);
      setProfile(profileRes.data);
      setApplications(appsRes.data || []);
      setWorkerStats(statsRes.data || { profile_views: 0 });
      setNotifications(notifRes.data || []);
      setCategories(catRes.data?.categories || []);
      setSavedJobs(savedRes.data || []);

      if (profileRes.data) {
        setIsOnline(profileRes.data.is_online === true);
        localStorage.setItem('worker_is_online', JSON.stringify(profileRes.data.is_online === true));
      }
    } catch (err) {
      toast.error(parseApiError(err, "Failed to sync dashboard"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Helpers ──
  const calculateMatchScore = useCallback((job) => {
    if (!profile) return 0;
    let score = 0;
    if (profile.skills && job.requirements) {
      const sk = Array.isArray(profile.skills) ? profile.skills.map(s => typeof s === 'string' ? s : s.name) : [];
      score += job.requirements.filter(s => sk.includes(s)).length * 12;
    }
    if (profile.category && job.category === profile.category) score += 15;
    if (profile.location && job.location && job.location.toLowerCase() === profile.location.toLowerCase()) score += 10;
    return Math.min(score, 99);
  }, [profile]);

  const hasApplied = useCallback((jobId) => applications.some(app => app.job_id === jobId), [applications]);
  const isSaved = useCallback((jobId) => savedJobs.some(j => j.id === jobId), [savedJobs]);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleSaveJob = useCallback(async (jobId) => {
    const saved = savedJobs.some(j => j.id === jobId);
    try {
      const token = localStorage.getItem('token');
      if (saved) {
        await axios.delete(`${API_URL}/api/jobs/save/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Removed from saved');
      } else {
        await axios.post(`${API_URL}/api/jobs/save`, { job_id: jobId }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('💾 Job saved!');
      }
      fetchData();
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to save job'));
    }
  }, [savedJobs, fetchData]);

  const handleToggleOnline = useCallback(async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    localStorage.setItem('worker_is_online', JSON.stringify(newStatus));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/worker/status`, { is_online: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(newStatus ? "🟢 You are now ONLINE! Employers can see you." : "You are now OFFLINE.");
    } catch (error) {
      setIsOnline(!newStatus);
      localStorage.setItem('worker_is_online', JSON.stringify(!newStatus));
      toast.error(parseApiError(error, "Failed to update status"));
    }
  }, [isOnline]);

  const handleApply = useCallback(async (payload) => {
    try {
      await applicationsApi.create(payload);
      toast.success(payload.bid_amount_paise ? '🚀 Mission bid transmitted!' : '✅ Application submitted!');
      fetchData();
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to apply'));
    }
  }, [fetchData]);

  const handleRequestRelease = useCallback(async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/payment/escrow/request-release`, { jobId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("💰 Payment request sent to employer!");
      fetchData();
    } catch (e) {
      toast.error(parseApiError(e, "Failed to request payment"));
    }
  }, [fetchData]);

  // ── Derived ──
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery.trim()) return true;
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    const searchable = [job.title, job.location, job.description || '', job.category || '', ...(job.requirements || [])].join(' ').toLowerCase();
    return keywords.some(kw => searchable.includes(kw));
  }).sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));

  const profileStrength = profile ? [
    profile.skills?.length > 0 ? 20 : 0,
    profile.location ? 15 : 0,
    profile.bio ? 10 : 0,
    profile.phone_verified ? 15 : 0,
    profile.video_intro ? 15 : 0,
    profile.daily_rate ? 10 : 0,
    profile.experience_years ? 15 : 0
  ].reduce((a, b) => a + b, 0) : 0;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'selected': case 'accepted': case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': case 'declined': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shortlisted': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getMatchColor = (s) => s >= 80 ? 'text-green-500' : s >= 50 ? 'text-primary' : 'text-amber-500';
  const getMatchBg = (s) => s >= 80 ? 'bg-green-500/10 border-green-500/20' : s >= 50 ? 'bg-primary/10 border-primary/20' : 'bg-amber-500/10 border-amber-500/20';
  const getTimeAgo = (d) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; };
  const getPhotoUrl = (path) => { 
    if (!path) return null; 
    return path.startsWith('http') ? path : `${API_URL}/api/files/${path}`; 
  };

  const value = {
    // Data
    profile, setProfile, jobs, applications, savedJobs, notifications,
    stats, workerStats, categories, loading, filteredJobs, profileStrength,
    // UI State
    searchQuery, setSearchQuery, isOnline, appliedFilters, setAppliedFilters,
    // Actions
    fetchData, handleSaveJob, handleToggleOnline, handleApply, handleRequestRelease,
    // Helpers
    calculateMatchScore, hasApplied, isSaved, unreadNotifications,
    getStatusColor, getMatchColor, getMatchBg, getTimeAgo, getPhotoUrl,
  };

  return (
    <WorkerDataContext.Provider value={value}>
      {children}
    </WorkerDataContext.Provider>
  );
};
