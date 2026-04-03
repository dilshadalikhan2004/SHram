import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { MapPin, Loader2, Navigation, X, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center

const LocationPicker = ({ value, onChange, onCoordinatesChange, initialCoords }) => {
  const [query, setQuery] = useState(value || '');
  const [center, setCenter] = useState(initialCoords || defaultCenter);
  const [markerPos, setMarkerPos] = useState(initialCoords || null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeout = useRef(null);

  // Load Leaflet dynamically
  useEffect(() => {
    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapReady(true);
      document.body.appendChild(script);
    } else {
      setMapReady(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Click to place marker
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
      
      // Reverse geocode
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data.display_name) {
          setQuery(data.display_name);
          onChange?.(data.display_name);
        }
        onCoordinatesChange?.(lat, lng);
      } catch (err) {
        console.error('Reverse geocode failed:', err);
        onCoordinatesChange?.(lat, lng);
      }
    });

    mapInstanceRef.current = map;

    // Place initial marker if coords exist
    if (initialCoords) {
      placeMarker(initialCoords.lat, initialCoords.lng);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapReady]);

  const placeMarker = (lat, lng) => {
    const L = window.L;
    if (!mapInstanceRef.current || isNaN(lat) || isNaN(lng) || lat == null || lng == null) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="position:relative;width:32px;height:32px;">
                  <div style="position:absolute;inset:0;background:var(--primary);border-radius:50%;opacity:0.4;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
                  <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;background:var(--primary);border:3px solid white;border-radius:50%;box-shadow:0 0 20px rgba(var(--primary-rgb),0.6);"></div>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapInstanceRef.current);
    }

    setMarkerPos({ lat, lng });
    mapInstanceRef.current.setView([lat, lng], 15);
  };

  // Search locations using Nominatim (free)
  const handleSearchInput = (text) => {
    setQuery(text);
    onChange?.(text);
    setShowSuggestions(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(item.display_name);
    onChange?.(item.display_name);
    onCoordinatesChange?.(lat, lng);
    placeMarker(lat, lng);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        placeMarker(latitude, longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data.display_name) {
            setQuery(data.display_name);
            onChange?.(data.display_name);
          }
          onCoordinatesChange?.(latitude, longitude);
        } catch (err) {
          console.error('Reverse geocode failed:', err);
          onCoordinatesChange?.(latitude, longitude);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        alert('Could not get your location.');
      }
    );
  };

  return (
    <div className="space-y-4 font-['Manrope']">
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-full h-full" />
          </div>
          <Input
            placeholder="Search Deployment Zone..."
            value={query}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="h-14 pl-12 pr-12 rounded-xl bg-muted/20 border-white/5 focus:border-primary/50 transition-all font-['Space_Grotesk'] text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMarkerPos(null);
                setSuggestions([]);
                onChange?.('');
                onCoordinatesChange?.(null, null);
                if (markerRef.current && mapInstanceRef.current) {
                  mapInstanceRef.current.removeLayer(markerRef.current);
                  markerRef.current = null;
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 w-full mt-2 glass-card rounded-2xl shadow-2xl max-h-64 overflow-y-auto border border-white/5 p-2"
              >
                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/10 flex items-start gap-3 transition-colors group/item"
                    onClick={() => selectSuggestion(item)}
                  >
                    <MapPin className="w-5 h-5 mt-0.5 text-primary shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-sm font-medium font-['Space_Grotesk'] tracking-tight line-clamp-2">{item.display_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {searching && (
            <div className="absolute z-50 w-full mt-2 glass-card rounded-2xl shadow-2xl p-6 text-center border border-white/5">
              <Loader2 className="animate-spin w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Scanning Satellite Data...</p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={detectCurrentLocation}
          disabled={detectingLocation}
          className="h-14 w-14 rounded-xl border-white/5 bg-muted/20 hover:bg-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all p-0 shadow-lg"
          title="Use my location"
        >
          {detectingLocation ? <Loader2 className="animate-spin w-6 h-6" /> : <Navigation className="w-6 h-6" />}
        </Button>
      </div>

      <div className="glass-card rounded-[2rem] p-1 shadow-2xl relative group overflow-hidden border border-white/5">
        <div 
          ref={mapRef} 
          className="rounded-[1.8rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 contrast-[1.1] brightness-[0.9]"
          style={{ width: '100%', height: '350px' }}
        >
          {!mapReady && (
            <div className="h-full flex flex-col items-center justify-center bg-muted/50 gap-4">
              <Loader2 className="animate-spin w-10 h-10 text-primary opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Initializing Map Matrix...</p>
            </div>
          )}
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 glass-card bg-background/80 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">
          Click Map to Pin Precise Coordinates
        </div>
      </div>
      
      <AnimatePresence>
        {markerPos && markerPos.lat != null && !isNaN(markerPos.lat) && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold font-['Space_Grotesk'] text-primary uppercase tracking-widest shadow-lg shadow-primary/5 shadow-inner"
          >
            <Check className="w-5 h-5" /> 
            Satellite Lock Verified: {Number(markerPos.lat).toFixed(4)}°N, {Number(markerPos.lng).toFixed(4)}°E
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationPicker;
