import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { squadsApi } from '../../lib/api';
import { toast } from 'sonner';
import { parseApiError } from '../../utils/errorUtils';
import {
  Users, Plus, Shield, Star, ChevronRight, Crown, UserPlus, Copy, Trash2
} from 'lucide-react';

const WorkerSquads = () => {
  const { user } = useAuth();
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchSquads(); }, []);

  const fetchSquads = async () => {
    try {
      const res = await squadsApi.getMySquads();
      setSquads(res.data.squads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSquadName.trim()) return;
    setCreating(true);
    try {
      await squadsApi.create({ name: newSquadName.trim() });
      toast.success('Squad created!');
      setNewSquadName('');
      setShowCreate(false);
      fetchSquads();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to create squad'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Team Operations</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Squads</h2>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-primary text-white font-['Space_Grotesk'] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Create Squad
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass-card rounded-[2.5rem] border-primary/20 space-y-4">
          <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">New Squad</h3>
          <input
            value={newSquadName}
            onChange={(e) => setNewSquadName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-['Space_Grotesk'] font-bold text-sm focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/40"
            placeholder="Squad name..."
          />
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-muted/40 border border-white/10 text-foreground font-['Space_Grotesk']">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white font-['Space_Grotesk'] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Squads List */}
      {squads.length === 0 ? (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">No Squads</p>
          <p className="text-muted-foreground font-['Space_Grotesk'] text-sm mt-2 font-medium opacity-60">Create a squad to bid on team jobs together.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {squads.map(squad => (
            <motion.div key={squad.id} whileHover={{ scale: 1.005 }} className="p-8 glass-card rounded-[2.5rem] border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden cursor-pointer">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-foreground font-['Space_Grotesk'] tracking-tight">{squad.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {squad.leader_id === (user?.id || user?.user_id) && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500">
                            <Crown className="w-3 h-3" /> Leader
                          </span>
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 font-['Space_Grotesk']">
                          {squad.members?.length || 1} members
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="flex -space-x-3">
                    {(squad.members || []).slice(0, 5).map((m, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-muted/30 border-2 border-background flex items-center justify-center text-xs font-black text-foreground font-['Space_Grotesk']">
                        {m.name?.[0] || '?'}
                      </div>
                    ))}
                    {(squad.members?.length || 0) > 5 && (
                      <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-black text-primary font-['Space_Grotesk']">
                        +{squad.members.length - 5}
                      </div>
                    )}
                  </div>

                  {/* Trust Score */}
                  <div className="inline-flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-white/5">
                    <Shield className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">Trust Score</p>
                      <p className="text-sm font-black text-green-500 font-['Space_Grotesk']">{squad.trust_score || 75}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3">
                  <button className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-muted/40 border border-white/10 text-foreground hover:border-primary/50 transition-all font-['Space_Grotesk']">
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                  <button className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-['Space_Grotesk']">
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WorkerSquads;
