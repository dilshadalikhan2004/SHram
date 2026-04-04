import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

const EmployerSquads = () => {
    return (
        <div className="space-y-12 animate-fade-in employer-theme">
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
                    >
                        Verified <span className="text-primary italic">Squads</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Elite Operational Units & Specialized Teams
                    </p>
                </div>
            </div>
            
            <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-20 pointer-events-none" />
                <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                    <BadgeCheck className="w-12 h-12 text-amber-500" />
                </div>
                <div className="space-y-3 relative z-10">
                    <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Formation Synchronization</h2>
                    <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                        Squad verification protocols are currently being established. High-performance unit analytics and deployment history will be integrated shortly to provide seamless team acquisition.
                    </p>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Tier: Enterprise Ready</div>
                    <div className="px-6 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-500 italic">Alpha Access</div>
                </div>
            </div>
        </div>
    );
};

export default EmployerSquads;
