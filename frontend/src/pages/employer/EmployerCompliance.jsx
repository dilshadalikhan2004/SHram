import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const EmployerCompliance = () => {
    return (
        <div className="space-y-12 animate-fade-in employer-theme">
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
                    >
                        Compliance <span className="text-primary italic">Hub</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Regulatory Oversight & Safety Standards
                    </p>
                </div>
            </div>
            
            <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-20 pointer-events-none" />
                <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                    <ShieldCheck className="w-12 h-12 text-rose-500" />
                </div>
                <div className="space-y-3 relative z-10">
                    <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Security Audit in Progress</h2>
                    <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                        Regulatory compliance modules are undergoing final stress tests. Safety certification tracking and legal adherence reports will be active once the industrial safety matrix is fully calibrated.
                    </p>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Oversight: Active</div>
                    <div className="px-6 py-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest text-rose-500 italic">Threat Level: Null</div>
                </div>
            </div>
        </div>
    );
};

export default EmployerCompliance;
