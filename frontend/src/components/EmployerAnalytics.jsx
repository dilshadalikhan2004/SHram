import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  BarChart3, Briefcase, Users, IndianRupee, TrendingUp, 
  PieChart, Activity, ShieldCheck, Target, Zap
} from 'lucide-react';
import { analyticsApi } from '../lib/api';

import { useTranslation } from '../context/TranslationContext';

const EmployerAnalytics = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsApi.getEmployer();
      setAnalytics(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <Card key={i} className="glass-card h-32 animate-pulse border-white/5 bg-muted/10" />
      ))}
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none">
              {t('biz_intel')} <span className="text-primary text-xs ml-2 opacity-50 tracking-widest">{t('live_node')}</span>
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-60">{t('strat_matrix')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('operational')}</span>
        </div>
      </div>

      {/* Primary Intelligence Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('total_deployments'), value: analytics?.total_jobs || 0, sub: `${analytics?.open_jobs || 0} ${t('active_label')}`, icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t('candidate_thru'), value: analytics?.total_applications || 0, sub: t('cycle_label'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('total_invest'), value: `₹${(analytics?.total_spend || 0).toLocaleString()}`, sub: t('gross_yield'), icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10' },
          { label: t('fulfillment_rate'), value: `${analytics?.completion_rate || 0}%`, sub: t('efficiency_index'), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-white/5 p-6 group hover:border-primary/30 transition-all duration-500 bg-gradient-to-br from-white/[0.02] to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-[10px] font-black font-['Space_Grotesk'] text-muted-foreground opacity-30">METRIC {i + 1}</div>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter">
                {stat.value}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="h-1 flex-grow bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className={`h-full ${stat.color === 'text-primary' ? 'bg-primary' : stat.color.replace('text-', 'bg-')} opacity-60`}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{stat.sub}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Allocation */}
        <Card className="lg:col-span-2 glass-card border-white/5 overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black font-['Space_Grotesk'] tracking-tighter uppercase flex items-center gap-3">
                <PieChart className="w-5 h-5 text-primary" /> {t('sector_allocation')}
              </CardTitle>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{t('fin_dist')}</div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {analytics?.spend_by_category && Object.keys(analytics.spend_by_category).length > 0 ? (
                Object.entries(analytics.spend_by_category).sort(([,a],[,b]) => b - a).map(([cat, amount], i) => {
                  const total = analytics.total_spend || 1;
                  const pct = Math.round((amount / total) * 100);
                  return (
                    <motion.div 
                      key={cat} 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="space-y-2 group"
                    >
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 leading-none">Sector Node</span>
                          <p className="text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight group-hover:text-primary transition-colors">{cat}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black font-['Space_Grotesk'] tracking-tighter text-emerald-500">₹{amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pct}% Index</p>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className="h-full bg-primary shadow-[0_0_15px_rgba(0,102,255,0.3)] rounded-full" 
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 glass-card">
                    <Activity className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">{t('insufficient_data') || 'Insufficient Data for Allocation Matrix'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Operational Health */}
        <div className="space-y-8">
          <Card className="glass-card border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1">{t('health_check')}</p>
                <h4 className="text-xl font-black font-['Space_Grotesk'] tracking-tighter uppercase">{t('integrity_index')}</h4>
              </div>
            </div>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="60" className="stroke-white/5 fill-none" strokeWidth="8" />
                  <motion.circle 
                    cx="64" cy="64" r="60" 
                    className="stroke-emerald-500 fill-none" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 377" }}
                    animate={{ strokeDasharray: "354 377" }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                  <p className="text-3xl font-black font-['Space_Grotesk'] tracking-tighter">94%</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-3 rounded-2xl bg-muted/30 border border-white/5 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">{t('satisfied')}</p>
                <p className="text-lg font-black font-['Space_Grotesk'] text-emerald-500">100%</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border border-white/5 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">{t('verified_rate')}</p>
                <p className="text-lg font-black font-['Space_Grotesk'] text-primary">88%</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black font-['Space_Grotesk'] uppercase tracking-widest text-muted-foreground">{t('op_log')}</h4>
              <Zap className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="space-y-3">
              {[
                { label: t('success_fulfillment'), val: analytics?.filled_jobs || 0, color: 'bg-emerald-500' },
                { label: t('active_reqs'), val: analytics?.open_jobs || 0, color: 'bg-primary' }
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${log.color}`} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{log.label}</span>
                  </div>
                  <span className="text-sm font-black font-['Space_Grotesk']">{log.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployerAnalytics;

