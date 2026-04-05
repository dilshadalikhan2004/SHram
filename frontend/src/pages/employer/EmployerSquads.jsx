import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, ShieldCheck, Zap, Crosshair } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';

const API_URL = "https://api.shramsetu.in";

const EmployerSquads = () => {
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSquads();
    }, []);

    const fetchSquads = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/squads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSquads(res.data.squads || []);
        } catch (err) {
            console.error("Failed to fetch squads:", err);
            toast.error("Failed to synchronize with squad database.");
        } finally {
            setLoading(false);
        }
    };

    const filteredSquads = squads.filter(squad => 
        squad.name?.toLowerCase().includes(search.toLowerCase()) ||
        squad.category?.toLowerCase().includes(search.toLowerCase())
    );

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
                        Verified <span className="text-orange-500 italic">Squads</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Elite Operational Units &amp; Specialized Teams
                    </p>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative z-10 w-full max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                <Input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search verified squads by specialization or unit classification..."
                    className="w-full h-16 pl-16 pr-8 rounded-2xl bg-black/40 border-white/5 focus:border-orange-500/50 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide shadow-2xl placeholder:italic placeholder:text-muted-foreground/30"
                />
            </div>
            
            {/* MAIN CONTENT GRID */}
            {loading ? (
                <div className="glass-card p-20 rounded-[3.5rem] flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest text-orange-500/60 animate-pulse">Scanning Grid...</p>
                </div>
            ) : filteredSquads.length === 0 ? (
                <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500/5 opacity-20 pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                        <Crosshair className="w-12 h-12 text-orange-500" />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">No Operational Squads Found</h2>
                        <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                            {search 
                                ? "No squads match your current operational search parameters. Adjust your tactical query." 
                                : "There are currently no verified enterprise squads available in this sector. Squads are manually verified and tiered before deployment."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence>
                        {filteredSquads.map((squad, idx) => (
                            <motion.div 
                                key={squad.id || idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md relative group overflow-hidden flex flex-col gap-6"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
                                            <ShieldCheck className="w-8 h-8 text-orange-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-white leading-none">
                                                {squad.name}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
                                                Classification: {squad.category || "General"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-orange-500/70" />
                                        <span className="text-white font-black">{squad.member_count || 0}</span>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground/80 leading-relaxed italic relative z-10 line-clamp-2">
                                    "{squad.description || "Operational unit standing by for deployment."}"
                                </p>

                                <div className="flex items-center gap-4 border-t border-white/5 pt-6 relative z-10">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Missions Completed</p>
                                        <p className="text-xl font-black font-['Space_Grotesk'] text-white">
                                            {squad.total_jobs_completed || 0}
                                        </p>
                                    </div>
                                    <div className="flex-1 space-y-1 border-l border-white/5 pl-4">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Squad Rating</p>
                                        <div className="flex items-center gap-1 font-black">
                                            <Zap className="w-4 h-4 text-orange-500" />
                                            <span className="text-white">4.9</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default EmployerSquads;
