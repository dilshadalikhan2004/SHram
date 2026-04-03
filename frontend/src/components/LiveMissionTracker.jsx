import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Signal, ShieldCheck, Clock, Map, TrendingUp, Radio } from 'lucide-react';
import { trackingApi } from '../lib/api';
import { toast } from 'sonner';

/**
 * LiveMissionTracker provides real-time oversight during a mission.
 * - Workers: Periodically transmit GPS to the backend.
 * - Employers: Monitor location and progress status.
 */
const LiveMissionTracker = ({ jobId, role, isActive }) => {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('offline'); // offline, active, synced
  const [lastUpdated, setLastUpdated] = useState(null);
  const [progress, setProgress] = useState(0);
  const locationInterval = useRef(null);

  useEffect(() => {
    if (isActive && role === 'worker') {
      startTracking();
    } else if (isActive && role === 'employer') {
      startMonitoring();
    }

    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [isActive, role]);

  const startTracking = () => {
    setStatus('active');
    // Update immediately
    updatePosition();
    // Update every 30 seconds
    locationInterval.current = setInterval(updatePosition, 30000);
  };

  const startMonitoring = () => {
    setStatus('monitoring');
    const fetchStatus = async () => {
      try {
        const res = await trackingApi.getStatus(jobId);
        setLocation(res.data.current_location);
        setProgress(res.data.progress || 0);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to fetch tracking data');
      }
    };
    fetchStatus();
    locationInterval.current = setInterval(fetchStatus, 30000);
  };

  const updatePosition = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          await trackingApi.updateLocation({
            job_id: jobId,
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
          setLastUpdated(new Date().toLocaleTimeString());
          setStatus('synced');
        } catch (err) {
          console.error('Tracking update failed');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setStatus('error');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-muted/30 border border-white/5 rounded-2xl p-5 overflow-hidden font-['Manrope'] relative group">
      <div className="absolute top-0 right-0 p-4">
         <Radio className={`w-4 h-4 ${status === 'synced' || status === 'monitoring' ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <Navigation className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Mission Live Tracking</h4>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {role === 'worker' ? 'Secure Beacon Active' : 'Remote Monitor Active'}
               </span>
               <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last: {lastUpdated || 'Initialing...'}</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-2">
           <div className="bg-muted/40 p-3 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary" /> Trust Status
              </p>
              <p className="text-xs font-black uppercase tracking-tight text-foreground">
                 {status === 'synced' || status === 'monitoring' ? 'Verified Protected' : 'Initializing...'}
              </p>
           </div>
           <div className="bg-muted/40 p-3 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-primary" /> Mission Age
              </p>
              <p className="text-xs font-black uppercase tracking-tight text-foreground">Active Session</p>
           </div>
        </div>

        {/* Progress Visual */}
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
             <span>Mission Progress</span>
             <span className="text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted-foreground/10 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
             />
          </div>
        </div>

        {/* Location Preview (Minimal) */}
        {location && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
             <MapPin className="w-3.5 h-3.5 text-primary" />
             <span className="text-[10px] font-mono leading-none flex-1 truncate text-primary/80">
                LAT: {location.lat.toFixed(6)} | LNG: {location.lng.toFixed(6)}
             </span>
             <motion.button 
               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
               className="text-[9px] font-black uppercase tracking-tighter text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
             >
               View on Map
             </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMissionTracker;
