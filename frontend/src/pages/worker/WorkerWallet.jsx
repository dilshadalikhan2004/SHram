import React from 'react';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import EarningsPanel from '../../components/EarningsPanel';
import SquadsPanel from '../../components/SquadsPanel';
import { IndianRupee, ArrowUpRight, Clock, Shield } from 'lucide-react';

const WorkerWallet = () => {
  const { stats, workerStats } = useWorkerData();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-end justify-between mb-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Financial Terminal</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Wallet & Earnings</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 font-['Space_Grotesk']">Network Status</p>
          <p className="text-xl font-black text-green-500 font-['Space_Grotesk'] uppercase tracking-tight flex items-center gap-2 justify-end">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Secure
          </p>
        </div>
      </div>

      {/* EWA Banner */}
      <div className="p-8 glass-card rounded-[2.5rem] border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <ArrowUpRight className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">Earned Wage Access</h3>
            </div>
            <p className="text-sm text-muted-foreground font-['Manrope'] font-medium max-w-md">
              Withdraw up to <span className="text-primary font-bold">60%</span> of your earned wages before the scheduled payday. Funds are transferred instantly to your UPI.
            </p>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Instant Transfer</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Zero Fees</span>
            </div>
          </div>
          <button className="px-8 py-4 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] bg-primary shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] whitespace-nowrap">
            Withdraw Early
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 md:p-8 glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl relative">
          <EarningsPanel />
        </div>
        <div className="p-6 md:p-8 glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl relative">
          <SquadsPanel />
        </div>
      </div>
    </motion.div>
  );
};

export default WorkerWallet;
