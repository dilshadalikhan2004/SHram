import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShieldCheck, IndianRupee, ArrowRight, Zap, RefreshCw, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerPayroll = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/jobs/employer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // We should ideally fetch escrows too, but for now we'll allow actions based on job data
            setJobs(res.data || []);
        } catch (err) {
            console.error("Failed to fetch logistics data:", err);
            toast.error("Failed to sync financial ledger.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEscrow = async (job) => {
        setActionLoading(job.id);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/payment/escrow/create`, 
                { 
                    jobId: job.id,
                    grossAmountPaise: (job.salary_paise || 50000) * (job.team_size || 1) // default fallback
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Funds successfully deployed to secure Escrow node.");
            fetchJobs(); // In real implementation, this might update a local status if jobs returned escrows
        } catch (err) {
            console.error(err);
            toast.error("Escrow deployment failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReleaseEscrow = async (job) => {
        setActionLoading(job.id);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/payment/escrow/release`, 
                { 
                    jobId: job.id,
                    action: "FULL_RELEASE",
                    partialPct: 100
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Assets successfully disbursed to workforce.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to disburse assets.");
        } finally {
            setActionLoading(null);
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
                        Payroll &amp; <span className="text-emerald-500 italic">Escrow</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Financial Logistics &amp; Asset Disbursement Control
                    </p>
                </div>
                <Button onClick={fetchJobs} variant="ghost" className="hidden sm:flex text-[9px] uppercase tracking-widest text-muted-foreground hover:text-white">
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Sync Ledger
                </Button>
            </div>
            
            {/* MAIN CONTENT GRID */}
            {loading ? (
                <div className="glass-card p-20 rounded-[3.5rem] flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-500/60 animate-pulse">Synchronizing Ledger Gateway...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-20 pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                        <Wallet className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">No Active Financial Operations</h2>
                        <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                            Deploy missions first to begin allocating escrow capital and managing disbursements.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <AnimatePresence>
                        {jobs.map((job, idx) => {
                            const expectedEscrow = ((job.salary_paise || 50000) * (job.team_size || 1)) / 100;
                            
                            return (
                                <motion.div 
                                    key={job.id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md relative group overflow-hidden flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
                                >
                                    {/* Mission Details */}
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                            <Wallet className="w-8 h-8 text-emerald-500/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full">
                                                {job.status || 'DEPLOYED'}
                                            </span>
                                            <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-white leading-none">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                <span>Target Squad: {job.team_size || 1} Pax</span>
                                                <span className="hidden md:inline">&bull;</span>
                                                <span className="hidden md:inline">{job.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Required Capital</p>
                                            <div className="flex items-center gap-1 text-2xl font-black text-emerald-500 font-['Space_Grotesk']">
                                                <IndianRupee className="w-4 h-4" />
                                                {expectedEscrow.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="h-12 w-px bg-white/10 hidden md:block" />

                                        <div className="flex flex-col gap-2 w-full md:w-48">
                                            <Button 
                                                onClick={() => handleCreateEscrow(job)}
                                                disabled={actionLoading === job.id}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400 group/btn"
                                            >
                                                {actionLoading === job.id ? <Zap className="w-4 h-4 animate-pulse" /> : (
                                                    <>
                                                        <ShieldCheck className="w-3 h-3 mr-2" />
                                                        Secure Escrow
                                                    </>
                                                )}
                                            </Button>
                                            <Button 
                                                onClick={() => handleReleaseEscrow(job)}
                                                disabled={actionLoading === job.id}
                                                variant="outline"
                                                className="w-full bg-transparent hover:bg-white/5 border-white/10 text-white rounded-xl h-10 text-[9px] font-black uppercase tracking-[0.2em] transition-all group/btn"
                                            >
                                                <Send className="w-3 h-3 mr-2 text-primary" />
                                                Disburse Assets
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default EmployerPayroll;
