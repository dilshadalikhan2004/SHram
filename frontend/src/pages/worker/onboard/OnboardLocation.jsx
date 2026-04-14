import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const OnboardLocation = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDetect = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        try {
          // Reverse geocoding placeholder or direct coords save
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || 'Detected Location';
          setLocation(city);
          toast.success(`Location detected: ${city}`);
        } catch (e) {
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        toast.error("Failed to detect location. Please enter manually.");
        setDetecting(false);
      }
    );
  };

  const handleNext = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/worker/profile/onboarding-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          step: 'location',
          data: {
            location: location,
            latitude: coords?.lat,
            longitude: coords?.lng
          }
        })
      });
      navigate('/worker/onboard/portfolio');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Where do you work?</h1>
        <p className="text-sm text-muted-foreground font-['Manrope'] font-medium">This helps us find jobs closest to you</p>
      </div>

      <div className="space-y-6">
        <button
          onClick={handleDetect}
          disabled={detecting}
          className="w-full p-8 glass-card rounded-[2.5rem] border-2 border-primary/20 hover:border-primary/40 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full bg-primary/10 text-primary ${detecting ? 'animate-pulse' : ''}`}>
              <Navigation className="w-8 h-8" />
            </div>
            <p className="font-black text-xl text-foreground font-['Space_Grotesk'] uppercase tracking-tight">Detect Current Location</p>
            <p className="text-xs text-muted-foreground font-['Space_Grotesk'] font-bold">USE GPS FOR BETTER MATCHES</p>
          </div>
        </button>

        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-white/5" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 font-['Space_Grotesk']">OR ENTER MANUALLY</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk']">City or Local Area</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-12 pr-5 py-5 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-black font-['Space_Grotesk'] text-lg focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/30"
              placeholder="e.g. Mumbai, Maharashtra"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!location || loading}
        className="w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.3em] bg-primary shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all font-['Space_Grotesk'] disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
};

export default OnboardLocation;
