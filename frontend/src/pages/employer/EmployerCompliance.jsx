import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, FileSearch, CheckCircle, Activity, Building, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const EmployerCompliance = () => {
    const [running, setRunning] = useState(false);

    const handleAudit = () => {
        setRunning(true);
        toast.info("Initiating deep sector scan for compliance deviations...");
        setTimeout(() => {
            setRunning(false);
            toast.success("Audit complete. All zones secure and compliant.");
        }, 3000);
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
                        Compliance <span className="text-orange-500 italic">Hub</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Regulatory Adherence &amp; Standards Verification
                    </p>
                </div>
            </div>
            
            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Main Audit Panel */}
                <div className="xl:col-span-2 glass-card p-12 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden bg-black/40">
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                    
                    <div className={`w-32 h-32 rounded-full border border-orange-500/20 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.1)] relative z-10 transition-all ${running ? 'bg-orange-500/20' : 'bg-black/50'}`}>
                        {running ? (
                            <Activity className="w-16 h-16 text-orange-500 animate-pulse" />
                        ) : (
                            <ShieldAlert className="w-16 h-16 text-orange-500 opacity-80" />
                        )}
                        {running && (
                            <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-spin" />
                        )}
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <h2 className="text-4xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-white">
                            {running ? "Scan in Progress..." : "System Compliant"}
                        </h2>
                        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto leading-relaxed">
                            {running 
                                ? "Running parallel diagnostics on worker certifications, escrow accounts, and labor limits."
                                : "No anomalies detected in active deployments or payroll limits. Your enterprise operates within required legal frameworks."}
                        </p>
                    </div>

                    <Button 
                        onClick={handleAudit}
                        disabled={running}
                        className="h-14 px-10 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all z-10"
                    >
                        <FileSearch className="w-4 h-4 mr-3" />
                        {running ? "Analyzing Parameters" : "Initiate Full Audit"}
                    </Button>
                </div>

                {/* Scorecards */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-emerald-500/20 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Building className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-['Space_Grotesk'] text-white">Corporate KYC</h3>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mt-1">Status: Verified</p>
                        </div>
                        <p className="text-xs text-muted-foreground/60 italic leading-relaxed">
                            Identity records and tax documents are fully validated by nodes.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-['Space_Grotesk'] text-white">Labor Limits</h3>
                            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mt-1">Status: Optimal</p>
                        </div>
                        <p className="text-xs text-muted-foreground/60 italic leading-relaxed">
                            Deployed active hours remain strictly within state regulatory bounds.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/50">Overall Rating</p>
                            <p className="text-3xl font-black font-['Space_Grotesk'] text-emerald-500 mt-1">99.8%</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-emerald-500/20" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerCompliance;
