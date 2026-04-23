import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, ShieldAlert, BarChart3, 
  Search, CheckCircle, XCircle, AlertTriangle, 
  Eye, EyeOff, RefreshCw, Lock, Unlock, HardHat, Building2,
  PieChart, Activity, Fingerprint
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || (window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.shramsetu.in");

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [secret, setSecret] = useState(localStorage.getItem('admin_secret') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ open: false, userId: null, reason: '' });
  const [showSecret, setShowSecret] = useState(false);

  // Verify secret and load initial stats
  useEffect(() => {
    if (secret) {
      verifyAndLoad();
    }
  }, []);

  const verifyAndLoad = async (inputSecret = secret) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { 'X-Admin-Secret': inputSecret }
      });
      setStats(res.data);
      localStorage.setItem('admin_secret', inputSecret);
      setIsAuthenticated(true);
      fetchKyc(inputSecret);
      fetchUsers(inputSecret);
    } catch (err) {
      toast.error("Invalid Admin Secret Access Key");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchKyc = async (s = secret) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/kyc/pending`, {
        headers: { 'X-Admin-Secret': s }
      });
      setPendingKyc(res.data);
    } catch (err) {}
  };

  const fetchUsers = async (s = secret) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users-list`, {
        headers: { 'X-Admin-Secret': s }
      });
      setAllUsers(res.data);
    } catch (err) {}
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/admin/kyc/approve/${userId}`, {}, {
        headers: { 'X-Admin-Secret': secret }
      });
      toast.success("Worker identity verified successfully");
      fetchKyc();
      fetchUsers();
    } catch (err) {
      toast.error("Verification command failed");
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.reason) return toast.error("Rejection reason required");
    try {
      await axios.post(`${API_URL}/api/admin/kyc/reject/${rejectionModal.userId}`, {
        reason: rejectionModal.reason
      }, {
        headers: { 'X-Admin-Secret': secret }
      });
      toast.success("User identity rejected");
      setRejectionModal({ open: false, userId: null, reason: '' });
      fetchKyc();
    } catch (err) {
      toast.error("Process failure");
    }
  };

  const handleToggleSuspend = async (userId) => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/user/toggle-suspend/${userId}`, {}, {
        headers: { 'X-Admin-Secret': secret }
      });
      toast.success(res.data.is_suspended ? "User terminal terminated" : "User privileges restored");
      fetchUsers();
    } catch (err) {
      toast.error("Suspension toggle failed");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto border border-primary/30">
              <Fingerprint className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Admin Portal</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.4em]">Restricted Beta Access</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <input 
                type={showSecret ? "text" : "password"} 
                placeholder="Enter X-Admin-Secret"
                className="w-full h-16 bg-black/40 border border-white/10 rounded-2xl px-6 font-['Space_Grotesk'] font-black text-center tracking-[0.5em] focus:border-primary/50 outline-none transition-all pr-14"
                value={secret}
                onChange={(e) => setSecret(e.target.value.trim())}
                onKeyPress={(e) => e.key === 'Enter' && verifyAndLoad(secret.trim())}
              />
              <button 
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground/30 hover:text-primary transition-colors"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-xs"
              onClick={() => verifyAndLoad(secret)}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Authorize Access"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground p-8 xl:p-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-['Space_Grotesk'] uppercase tracking-tight flex items-center gap-4">
            Command Center <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20 font-black tracking-widest">v2.1.0-Beta</span>
          </h1>
          <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.5em]">ShramSetu Beta Logistics & Verification</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { localStorage.removeItem('admin_secret'); setIsAuthenticated(false); }} className="h-12 px-6 rounded-xl border border-white/5 font-black uppercase text-[10px] tracking-widest text-rose-500 hover:bg-rose-500/10">
            Terminate Session
          </Button>
          <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-400" />} label="Total Population" value={stats.users?.total} subValue={`${stats.users?.workers} Workers / ${stats.users?.employers} Employers`} />
          <StatCard icon={<ShieldAlert className="text-rose-400" />} label="Pending Verification" value={stats.kyc?.pending} color="rose" />
          <StatCard icon={<BarChart3 className="text-primary" />} label="Active Missions" value={stats.jobs?.active} />
          <StatCard icon={<Building2 className="text-cyan-400" />} label="Total Deployments" value={stats.jobs?.total} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<PieChart />} label="Platform Metrics" />
          <NavButton active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')} icon={<UserCheck />} label="KYC Queue" count={pendingKyc.length} />
          <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users />} label="Population Directory" />
        </div>

        {/* Dynamic Display Panel */}
        <div className="xl:col-span-3 min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'kyc' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase">KYC Verification Queue</h2>
                  <Button variant="ghost" onClick={() => fetchKyc()} className="p-2 bg-white/5 border border-white/10 rounded-xl"><RefreshCw className="w-4 h-4" /></Button>
                </div>
                
                <div className="space-y-6">
                  {pendingKyc.length === 0 ? (
                    <EmptyState label="Identity Verification Queue Clear" />
                  ) : (
                    pendingKyc.map(user => (
                      <KycCard key={user.user_id} user={user} onApprove={handleApprove} onReject={(id) => setRejectionModal({ open: true, userId: id, reason: '' })} />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase">Population Directory</h2>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-6 h-14 w-full md:w-96">
                    <Search className="w-5 h-5 text-muted-foreground/30" />
                    <input 
                      placeholder="Search name, phone or ID..." 
                      className="bg-transparent border-none outline-none w-full text-sm font-bold uppercase tracking-widest placeholder:text-muted-foreground/20"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        <th className="px-8 py-6">Operator</th>
                        <th className="px-8 py-6">Logistics Role</th>
                        <th className="px-8 py-6">Security Status</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers
                        .filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm))
                        .map(user => (
                          <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs text-primary">{user.full_name?.charAt(0)}</div>
                                <div>
                                  <p className="font-black text-sm uppercase">{user.full_name}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground/40">{user.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-black uppercase tracking-widest">
                              <span className={`px-3 py-1 rounded-full ${user.role === 'worker' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'} border`}>
                                {user.role === 'worker' ? <HardHat className="w-3 h-3 inline mr-2" /> : <Building2 className="w-3 h-3 inline mr-2" />}
                                {user.role}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {user.is_suspended ? (
                                <span className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                                  <Lock className="w-3 h-3" /> Terminated
                                </span>
                              ) : (
                                <span className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                  <Unlock className="w-3 h-3" /> Operational
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <Button 
                                onClick={() => handleToggleSuspend(user._id)}
                                variant="ghost"
                                className={`h-10 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest ${user.is_suspended ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'}`}
                              >
                                {user.is_suspended ? "Restore" : "Terminate"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase">Platform Metrics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Growth Trajectory</h3>
                    <div className="h-64 flex items-end gap-2 border-b border-white/5 pb-4">
                      {/* Fake Chart bars */}
                      {[40, 60, 45, 90, 65, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg group relative" style={{ height: `${h}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-black text-[8px] font-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">v{h*12}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Operational Status</h3>
                    <div className="space-y-6">
                      <StatusRow label="Database Connectivity" value="12ms" status="stable" />
                      <StatusRow label="API Response Time" value="48ms" status="stable" />
                      <StatusRow label="Redis Cloud Sync" value="Verified" status="stable" />
                      <StatusRow label="Twilio SMS Service" value="Active" status="stable" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] space-y-8">
            <h3 className="text-xl font-black font-['Space_Grotesk'] uppercase italic text-rose-500">Identity Rejection Process</h3>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-loose">State the reason for terminating this identity verification process. The operator will be notified.</p>
              <textarea 
                className="w-full h-32 bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-rose-500/50 transition-all text-sm font-bold"
                placeholder="Reason (e.g. Scanned ID is unreadable, Mismatched identity details...)"
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setRejectionModal({ open: false, userId: null, reason: '' })} variant="ghost" className="flex-1 h-12 rounded-xl border border-white/5 font-black uppercase text-[10px]">Cancel</Button>
              <Button onClick={handleReject} className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 font-black uppercase text-[10px] tracking-widest">Reject Terminal</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponents ---

const StatCard = ({ icon, label, value, subValue, color = "primary" }) => (
  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-4 group">
    <div className={`w-12 h-12 rounded-2xl ${color === 'rose' ? 'bg-rose-500/20' : 'bg-primary/20'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black font-['Space_Grotesk']">{value}</p>
        {subValue && <span className="text-[10px] font-bold text-muted-foreground/30">{subValue}</span>}
      </div>
    </div>
  </div>
);

const NavButton = ({ active, icon, label, onClick, count = 0 }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all border ${active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-muted-foreground/50 hover:bg-white/10 hover:border-white/10'}`}
  >
    <div className="flex items-center gap-4">
      {React.cloneElement(icon, { className: "w-5 h-5" })}
      <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
    </div>
    {count > 0 && <span className="px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-lg">{count}</span>}
  </button>
);

const KycCard = ({ user, onApprove, onReject }) => (
  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-22 bg-primary/10 flex items-center justify-center border border-primary/20">
          {user.document_photo_url ? (
            <img src={user.document_photo_url} alt="ID" className="w-full h-full object-cover rounded-22" />
          ) : (
            <Fingerprint className="text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <h4 className="text-xl font-black font-['Space_Grotesk'] uppercase">{user.full_name || "Unknown Operator"}</h4>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            <span className="text-primary italic">{user.document_type || "National ID"}</span>
            <span className="opacity-20">•</span>
            <span>Ref: {user.document_number || "XXXXXXXX"}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user.document_photo_url && (
          <a href={user.document_photo_url} target="_blank" rel="noopener noreferrer" className="h-14 w-14 rounded-2xl border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
            <Eye className="w-5 h-5" />
          </a>
        )}
        <Button onClick={() => onReject(user.user_id)} variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-rose-500/10 hover:text-rose-500 group">
          <XCircle className="w-6 h-6 group-active:scale-90 transition-transform" />
        </Button>
        <Button onClick={() => onApprove(user.user_id)} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
          Verify Terminal
        </Button>
      </div>
    </div>
  </motion.div>
);

const StatusRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${status === 'stable' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'} animate-pulse`} />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
    </div>
    <span className="font-black text-[10px] font-['Space_Grotesk'] uppercase tracking-widest text-white">{value}</span>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center gap-4">
    <CheckCircle className="w-12 h-12 text-emerald-500/10" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">{label}</p>
  </div>
);

export default AdminDashboard;
