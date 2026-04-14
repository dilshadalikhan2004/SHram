import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, AlertTriangle, Briefcase, Zap, Info, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const EmployerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data.notifications || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            toast.error("Failed to sync alert center.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/notifications/read`, 
                { notification_id: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const getIcon = (type) => {
        if (type?.includes('warning') || type?.includes('alert')) return <AlertTriangle className="w-5 h-5 text-red-500" />;
        if (type?.includes('success') || type?.includes('resolved')) return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
        if (type?.includes('job') || type?.includes('mission')) return <Briefcase className="w-5 h-5 text-primary" />;
        if (type?.includes('system')) return <Zap className="w-5 h-5 text-amber-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

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
                        Alert <span className="text-primary italic">Center</span>
                    </motion.h1>
                    <div className="flex items-center gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                            Real-time Intelligence & Operational Updates
                        </p>
                        {unreadCount > 0 && (
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest">
                                {unreadCount} Unread
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* MAIN CONTENT */}
            {loading ? (
                <div className="glass-card p-20 rounded-[3.5rem] flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary/60 animate-pulse">Syncing Telemetry...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="glass-card p-20 rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-20 pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                        <Bell className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">Telemetry Clear</h2>
                        <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                            There are currently no operational alerts or system broadcasts. Your deployment channels are completely clear.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {notifications.map((notification, idx) => (
                            <motion.div 
                                key={notification.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden flex items-center gap-6 ${
                                    notification.is_read 
                                        ? 'bg-black/40 border-white/5 opacity-70 hover:opacity-100 hover:bg-white/5' 
                                        : 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 shadow-lg shadow-primary/5'
                                }`}
                            >
                                {/* Indicator line for unread */}
                                {!notification.is_read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all" />
                                )}

                                {/* Icon Circle */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                                    notification.is_read ? 'bg-white/5 border-white/10' : 'bg-primary/10 border-primary/20 shadow-inner'
                                }`}>
                                    {getIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className={`text-lg font-black font-['Space_Grotesk'] uppercase tracking-tight ${notification.is_read ? 'text-white' : 'text-primary'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">
                                        {notification.message}
                                    </p>
                                </div>

                                {/* Action Context (if applicable) */}
                                {notification.action_url && (
                                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white">
                                            Enter Terminal &rarr;
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default EmployerNotifications;
