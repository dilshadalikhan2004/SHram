import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Briefcase, MapPin, Users, 
  IndianRupee, CheckCircle, Zap, Calendar, 
  Clock, ArrowRight, MessageSquare, AlertCircle,
  ChevronRight, ArrowLeft, Send, Trash2, Edit3, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useEmployerData } from '../../context/EmployerDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import LocationPicker from '../../components/LocationPicker';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerJobNew = () => {
  const navigate = useNavigate();
  const { refreshData } = useEmployerData();
  const [aiQuery, setAiQuery] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'construction',
    requirements: '',
    team_size: 1,
    hire_type: 'individual',
    location: '',
    latitude: null,
    longitude: null,
    salary_paise: 0,
    salary_type: 'daily',
    start_date: '',
    estimated_duration: '',
    is_urgent: false
  });

  const handleAiDraft = async () => {
    if (!aiQuery.trim()) return;
    setIsDrafting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/jobs/draft`, { query: aiQuery }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update form with AI results, merging with existing data
      setFormData(prev => ({ ...prev, ...res.data }));
      toast.success("✨ AI has synchronized your requirements!");
    } catch (err) {
      toast.error("Failed to parse AI signal. Please refine your query.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.location) {
      toast.error("Please ensure mission title, sector and coordinates are set.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        requirements: typeof formData.requirements === 'string' 
          ? formData.requirements.split(',').map(s => s.trim()).filter(Boolean)
          : formData.requirements
      };
      await axios.post(`${API_URL}/api/jobs/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("🚀 Mission Deployed to the Shram-Matrix!");
      refreshData();
      navigate('/employer/jobs');
    } catch (err) {
      toast.error("Failed to broadcast mission. Check your signal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalEscrow = () => {
    return (formData.salary_paise * formData.team_size) / 100;
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-8 bg-black/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:text-primary transition-all">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div className="space-y-1">
              <h1 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Deploy New Mission</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Secure Workforce Task Initialization</p>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
           <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              Escrow Secured
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* LEFT: AI COMMAND INTERFACE */}
        <div className="space-y-8">
           <div className="p-10 rounded-[3rem] bg-primary/10 border border-primary/20 shadow-3xl space-y-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30">
                    <Sparkles className="w-6 h-6 fill-white" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black font-['Space_Grotesk'] uppercase tracking-tight">AI Command Line</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Natural Language Mission Parsing</p>
                 </div>
              </div>

              <div className="relative z-10 space-y-6">
                 <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">
                    Describe your workforce requirements in simple human words. Our AI will automatically configure the operational parameters.
                 </p>
                 <div className="relative">
                    <Textarea 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="e.g. I need 10 tilers for a luxury hotel project in Worli. Budget is ₹1200/day. Need them from next Monday for 3 weeks." 
                      className="min-h-[200px] rounded-[2.5rem] bg-black/60 border-primary/30 focus:border-primary p-8 text-lg font-['Space_Grotesk'] font-bold leading-relaxed shadow-3xl placeholder:text-muted-foreground/20 italic"
                    />
                    <Button 
                      onClick={handleAiDraft}
                      disabled={isDrafting || !aiQuery.trim()}
                      className="absolute bottom-6 right-6 h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-primary/40 group overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                       <AnimatePresence mode="wait">
                          {isDrafting ? (
                             <motion.div key="spin" initial={{ opacity:0 }} animate={{ opacity:1 }} className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                             <motion.div key="icon" initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-center gap-2 relative z-10">
                                <Send className="w-4 h-4" />
                                Synchronize Force
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </Button>
                 </div>
              </div>
           </div>

           <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 font-['Space_Grotesk']">Mission Location Precision</h3>
                 <MapPin className="w-4 h-4 text-primary/30" />
              </div>
              <div className="w-full relative group">
                 <LocationPicker 
                   value={formData.location}
                   onChange={(address) => setFormData(f => ({ ...f, location: address }))}
                   onCoordinatesChange={(lat, lng) => setFormData(f => ({ ...f, latitude: lat, longitude: lng }))}
                 />
              </div>
           </div>
        </div>

        {/* RIGHT: MANUAL PRECISION FORM */}
        <div className="space-y-8 h-full">
           <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/5 shadow-2xl backdrop-blur-md space-y-10 overflow-y-auto max-h-[1400px] custom-scrollbar h-full">
              <div className="flex items-center justify-between mb-2">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Mission Parameters</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Manual Fine-Tuning Grid</p>
                 </div>
                 <Edit3 className="w-6 h-6 text-primary/20" />
              </div>

              <div className="space-y-8">
                 {/* Basic Info */}
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Deployment Title</Label>
                       <Input 
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Industrial Master Electricians (Phase 2)"
                        className="h-16 px-8 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] font-bold uppercase shadow-inner"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Operational Sector</Label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full h-16 px-8 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 text-sm font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                          >
                             <option value="construction">Construction</option>
                             <option value="factory">Factory Industrial</option>
                             <option value="logistics">Logistics Ops</option>
                             <option value="electrician">Electrician</option>
                             <option value="plumbing">Plumbing HQ</option>
                          </select>
                       </div>
                       <div className="flex flex-col justify-end pb-1">
                          <div 
                            onClick={() => setFormData({ ...formData, is_urgent: !formData.is_urgent })}
                            className={`h-16 rounded-2xl border-2 flex items-center justify-center gap-3 cursor-pointer transition-all ${formData.is_urgent ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-lg shadow-orange-500/20' : 'border-white/5 bg-white/5 text-muted-foreground/30'}`}
                          >
                             <Zap className={`w-5 h-5 ${formData.is_urgent ? 'fill-orange-500' : ''}`} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Urgent Status</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Force Composition */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Deployment Size (Personnel)</Label>
                       <div className="flex items-center bg-black/40 border border-white/5 rounded-2xl px-6 h-16">
                          <button onClick={() => setFormData(f => ({ ...f, team_size: Math.max(1, f.team_size - 1) }))} className="text-2xl font-black text-muted-foreground hover:text-primary transition-colors">-</button>
                          <span className="flex-1 text-center text-xl font-black font-['Space_Grotesk'] text-white">{formData.team_size}</span>
                          <button onClick={() => setFormData(f => ({ ...f, team_size: f.team_size + 1 }))} className="text-2xl font-black text-muted-foreground hover:text-primary transition-colors">+</button>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Personnel Strategy</Label>
                       <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl h-16">
                          {['individual', 'squad'].map(type => (
                            <button
                              key={type}
                              onClick={() => setFormData({ ...formData, hire_type: type })}
                              className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.hire_type === type ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              {type}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Financials & Timing */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Daily Rate (₹)</Label>
                       <div className="relative">
                          <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                          <Input 
                            value={formData.salary_paise / 100}
                            onChange={(e) => setFormData({ ...formData, salary_paise: (parseInt(e.target.value) || 0) * 100 })}
                            className="h-16 pl-14 pr-6 rounded-2xl bg-black/40 border-white/5 focus:border-emerald-500/50 text-xl font-black font-['Space_Grotesk'] text-emerald-500"
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Mission Start Date</Label>
                       <div className="relative">
                          <input 
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full h-16 px-8 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 text-sm font-black uppercase tracking-widest text-white outline-none appearance-none"
                          />
                          <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 {/* Requirements */}
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Mission Directives (Description)</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed mission scope and specialized directives..."
                      className="min-h-[120px] rounded-[2.5rem] bg-black/40 border-white/5 focus:border-primary/50 p-8 text-sm font-bold leading-relaxed italic"
                    />
                 </div>
              </div>

              {/* Deployment Action */}
              <div className="pt-8 border-t border-white/10">
                 <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] flex items-center justify-between mb-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Escrow Commitment</p>
                       <p className="text-3xl font-black font-['Space_Grotesk'] text-emerald-500">₹{calculateTotalEscrow().toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                       <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                 </div>

                 <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-24 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] shadow-3xl shadow-primary/30 group relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10 flex items-center justify-center gap-4">
                       {isSubmitting ? "TRANSMITTING SIGNAL..." : "DEPLOY MISSION"}
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-500" />
                    </div>
                 </Button>
                 <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Authorized Workforce Transmission v4.1</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobNew;
