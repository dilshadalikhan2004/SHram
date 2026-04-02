import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, Plus, UserPlus, Crown, Trash2, DollarSign, 
  Briefcase, ChevronRight, Percent, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import { squadsApi } from '../lib/api';

const SquadsPanel = () => {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [newSquad, setNewSquad] = useState({ name: '', description: '', category: '' });
  const [newMemberId, setNewMemberId] = useState('');
  const [editingSplits, setEditingSplits] = useState(false);
  const [splits, setSplits] = useState([]);

  useEffect(() => { fetchSquads(); }, []);

  const fetchSquads = async () => {
    try {
      const res = await squadsApi.getMySquads();
      setSquads(res.data.squads || []);
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to fetch squad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await squadsApi.create(newSquad);
      toast.success('Squad created!');
      setShowCreate(false);
      setNewSquad({ name: '', description: '', category: '' });
      fetchSquads();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleAddMember = async () => {
    if (!newMemberId.trim() || !selectedSquad) return;
    try {
      await squadsApi.addMember(selectedSquad.id, { user_id: newMemberId, role: 'member', split_percentage: 0 });
      toast.success('Member added!');
      setNewMemberId('');
      const res = await squadsApi.getSquad(selectedSquad.id);
      setSelectedSquad(res.data);
      fetchSquads();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await squadsApi.removeMember(selectedSquad.id, memberId);
      toast.success('Member removed');
      const res = await squadsApi.getSquad(selectedSquad.id);
      setSelectedSquad(res.data);
      fetchSquads();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleSaveSplits = async () => {
    try {
      await squadsApi.updateSplits(selectedSquad.id, splits);
      toast.success('Splits updated!');
      setEditingSplits(false);
      const res = await squadsApi.getSquad(selectedSquad.id);
      setSelectedSquad(res.data);
    } catch (err) { toast.error(err.response?.data?.detail || 'Splits must total 100%'); }
  };

  if (selectedSquad) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{selectedSquad.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedSquad.member_count} members • {selectedSquad.total_jobs_completed} jobs completed</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedSquad(null)}>Back</Button>
        </div>

        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Members</CardTitle>
              <div className="flex gap-2">
                {!editingSplits ? (
                  <Button size="sm" variant="outline" onClick={() => { setEditingSplits(true); setSplits(selectedSquad.members.map(m => ({ user_id: m.user_id, split_percentage: m.split_percentage }))); }}>
                    <Percent className="w-3 h-3 mr-1" /> Edit Splits
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleSaveSplits}><Check className="w-3 h-3 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSplits(false)}><X className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSquad.members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {m.name}
                      {m.role === 'leader' && <Crown className="w-4 h-4 text-amber-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingSplits ? (
                    <Input
                      type="number" className="w-20 h-8 text-right"
                      value={splits.find(s => s.user_id === m.user_id)?.split_percentage || 0}
                      onChange={(e) => setSplits(splits.map(s => s.user_id === m.user_id ? { ...s, split_percentage: parseFloat(e.target.value) || 0 } : s))}
                    />
                  ) : (
                    <Badge variant="outline">{m.split_percentage}%</Badge>
                  )}
                  {m.role !== 'leader' && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMember(m.user_id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input placeholder="Enter user ID to add..." value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} className="h-9" />
              <Button size="sm" onClick={handleAddMember}><UserPlus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium">Total Earnings</span>
              </div>
              <span className="text-xl font-bold">₹{selectedSquad.total_earnings?.toLocaleString() || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5" /> My Squads</h3>
          <p className="text-sm text-muted-foreground">Form teams for group jobs</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> Create Squad</Button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleCreate} className="space-y-3">
                  <Input placeholder="Squad Name" value={newSquad.name} onChange={(e) => setNewSquad({ ...newSquad, name: e.target.value })} required />
                  <Input placeholder="Description (optional)" value={newSquad.description} onChange={(e) => setNewSquad({ ...newSquad, description: e.target.value })} />
                  <Input placeholder="Category (e.g., Construction)" value={newSquad.category} onChange={(e) => setNewSquad({ ...newSquad, category: e.target.value })} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Create</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Squad List */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Card key={i} className="skeleton h-24" />)}</div>
      ) : squads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No squads yet</p>
            <p className="text-muted-foreground">Create a squad to bid on group jobs together</p>
          </CardContent>
        </Card>
      ) : (
        squads.map((squad) => (
          <Card key={squad.id} className="card-hover cursor-pointer" onClick={() => setSelectedSquad(squad)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">{squad.name}
                    {squad.category && <Badge variant="outline" className="text-xs">{squad.category}</Badge>}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{squad.member_count} members • ₹{squad.total_earnings?.toLocaleString() || 0} earned</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default SquadsPanel;
