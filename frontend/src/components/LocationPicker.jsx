import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { MapPin, Search, Loader2, Navigation, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LocationPicker = ({ value, onChange, onCoordinatesChange }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchLocation(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchLocation = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/location/search`, {
        params: { query: searchQuery, limit: 5 }
      });
      setResults(response.data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error('Location search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    setQuery(location.display_name);
    onChange?.(location.display_name);
    onCoordinatesChange?.(location.lat, location.lon);
    setShowResults(false);
    setResults([]);
  };

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await axios.get(`${API_URL}/api/location/reverse`, {
            params: { lat: latitude, lon: longitude }
          });
          
          const location = response.data;
          setQuery(location.display_name);
          onChange?.(location.display_name);
          onCoordinatesChange?.(latitude, longitude);
        } catch (error) {
          console.error('Reverse geocode failed:', error);
          onCoordinatesChange?.(latitude, longitude);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        alert('Could not get your location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatAddress = (displayName) => {
    // Shorten the display name for better UX
    const parts = displayName.split(', ');
    if (parts.length > 3) {
      return parts.slice(0, 3).join(', ');
    }
    return displayName;
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-10 pr-10"
            data-testid="location-search-input"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange?.('');
                onCoordinatesChange?.(null, null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={detectCurrentLocation}
          disabled={detectingLocation}
          title="Use current location"
          data-testid="detect-location-btn"
        >
          {detectingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1"
          >
            <Card className="shadow-lg">
              <ScrollArea className="max-h-64">
                {results.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 border-b last:border-0"
                    data-testid={`location-result-${index}`}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatAddress(result.display_name)}
                      </p>
                      {result.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.address.state || result.address.country}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {showResults && query.length >= 3 && !loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1"
          >
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No locations found</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationPicker;
