import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, XCircle, Clock, Star, Zap, Award, IndianRupee, MapPin, Briefcase } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerWorkers = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/applications/employer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Result is expected to be an array of application dicts
            setApplications(res.data || []);
        } catch (err) {
            console.error("Failed to fetch workforce data:", err);
            toast.error("Failed to sync workforce matrix. Encrypted uplink failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (appId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/api/applications/${appId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Candidate status updated to: ${newStatus.toUpperCase()}`);
            fetchApplications();
        } catch (err) {
            console.error("Failed to update application:", err);
            toast.error("Failed to transmit command to matrix.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'selected': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'shortlisted': return 'text-primary bg-primary/10 border-primary/20';
            case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-muted-foreground bg-white/5 border-white/10';
        }
    };

    return (
        <div className="space-y-12 pb-20 employer-theme">
            {/* INSTRUCTION HEADER */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
                    >
                        Workforce <span className="text-primary italic">Matrix</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Strategic Personnel Management & Oversight
                    </p>
                </div>
            </div>
            
            {/* MAIN CONTENT GRID */}
            {loading ? (
                <div className="glass-card p-20 rounded-[3.5rem] flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary/60 animate-pulse">Establishing Uplink...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-20 pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                        <Users className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">No Active Personnel Detected</h2>
                        <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                            No workers have submitted applications to your active deployments recently. You may want to deploy a new mission to attract verified personnel.
                        </p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Status: Standby</div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence>
                        {applications.map((app, idx) => (
                            <motion.div 
                                key={app.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md space-y-6 relative group overflow-hidden"
                            >
                                {/* Background glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                
                                {/* Status Chip & Job Info */}
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-primary/50" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                Target Mission
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight text-white leading-none">
                                            {app.job?.title || "Unknown Mission"}
                                        </h3>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] ${getStatusColor(app.status)}`}>
                                        {app.status || 'Pending'}
                                    </div>
                                </div>

                                {/* Worker Profile Details */}
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative z-10 flex gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <div className="space-y-3 flex-1 overflow-hidden">
                                        <div>
                                            <h4 className="text-xl font-black text-white capitalize leading-tight">
                                                {app.worker_profile?.user_id?.substring(0, 8) || "Unknown User"} 
                                                <span className="text-muted-foreground/40 text-sm ml-2">#{app.worker_profile?.id?.substring(0, 4)}</span>
                                            </h4>
                                            {app.worker_profile?.skills && app.worker_profile.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {app.worker_profile.skills.slice(0, 3).map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-white/10">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Financial & Match Info */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Bid / Counter</span>
                                                <div className="flex items-center gap-1 text-emerald-500 font-black">
                                                    <IndianRupee className="w-3 h-3" />
                                                    {((app.counter_offer_paise || app.bid_amount_paise || app.job?.salary_paise || 0) / 100).toLocaleString()}/day
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-white/10 pl-4">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">AI Match</span>
                                                <div className="flex items-center gap-1 font-black">
                                                    <Zap className="w-3 h-3 text-orange-500" />
                                                    <span className={app.match_score >= 0.8 ? 'text-orange-500' : 'text-primary'}>
                                                        {Math.round((app.match_score || 0.5) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Insights Box */}
                                {app.ai_insights && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 relative z-10 flex gap-3">
                                        <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                                            "{app.ai_insights}"
                                        </p>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                {app.status !== 'selected' && app.status !== 'rejected' && (
                                    <div className="grid grid-cols-3 gap-3 relative z-10 pt-2 border-t border-white/5">
                                        <Button 
                                            variant="ghost"
                                            onClick={() => handleAction(app.id, 'shortlisted')}
                                            disabled={app.status === 'shortlisted'}
                                            className="h-10 rounded-xl bg-white/5 hover:bg-primary/10 hover:text-primary text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-white/5 transition-all"
                                        >
                                            <Clock className="w-3 h-3 mr-2" />
                                            Shortlist
                                        </Button>
                                        <Button 
                                            variant="ghost"
                                            onClick={() => handleAction(app.id, 'rejected')}
                                            className="h-10 rounded-xl bg-red-500/5 hover:bg-red-500/20 hover:text-red-500 text-[9px] font-black uppercase tracking-widest text-red-500/50 border border-red-500/10 transition-all"
                                        >
                                            <XCircle className="w-3 h-3 mr-2 text-red-500/50" />
                                            Decline
                                        </Button>
                                        <Button 
                                            onClick={() => handleAction(app.id, 'selected')}
                                            className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400"
                                        >
                                            <CheckCircle className="w-3 h-3 mr-2" />
                                            Select
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default EmployerWorkers;
