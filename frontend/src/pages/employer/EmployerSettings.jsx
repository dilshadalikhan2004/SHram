import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Building2, Mail, Phone, MapPin, Database } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const EmployerSettings = () => {
    const [profile, setProfile] = useState({
        company_name: '',
        email: '',
        phone: '',
        location: '',
        wallet_address: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/profile/employer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
        } catch (err) {
            console.error(err);
            // Ignore 404, just means no profile saved yet
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/profile/employer`, profile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Enterprise configuration updated.");
        } catch (err) {
            toast.error("Failed to commit settings to database.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
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
                        Terminal <span className="text-orange-500 italic">Settings</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Enterprise Node Configuration
                    </p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={saving || loading}
                    className="h-12 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-orange-500/20"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Deploying..." : "Commit Changes"}
                </Button>
            </div>

            {loading ? (
                <div className="glass-card p-20 rounded-[3.5rem] flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Settings */}
                    <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Building2 className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-white">
                                Enterprise Identity
                            </h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">Company Designation</label>
                                <Input 
                                    name="company_name"
                                    value={profile.company_name || ''}
                                    onChange={handleChange}
                                    placeholder="ACME Heavy Industries"
                                    className="h-14 bg-white/5 border border-white/10 text-white font-bold px-6"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">HQ Coordinates (Location)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50" />
                                    <Input 
                                        name="location"
                                        value={profile.location || ''}
                                        onChange={handleChange}
                                        placeholder="Mumbai, IN (Sector 4)"
                                        className="h-14 bg-white/5 border border-white/10 text-white font-bold pl-12 pr-6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Network Settings */}
                    <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Database className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-black font-['Space_Grotesk'] uppercase tracking-tight text-white">
                                Encrypted Contact Node
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">Comms Relay (Email)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50" />
                                    <Input 
                                        name="email"
                                        value={profile.email || ''}
                                        onChange={handleChange}
                                        placeholder="ops@acme.com"
                                        className="h-14 bg-white/5 border border-white/10 text-white font-bold pl-12 pr-6"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">Direct COM (Phone)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50" />
                                    <Input 
                                        name="phone"
                                        value={profile.phone || ''}
                                        onChange={handleChange}
                                        placeholder="+91 99999 99999"
                                        className="h-14 bg-white/5 border border-white/10 text-white font-bold pl-12 pr-6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerSettings;
