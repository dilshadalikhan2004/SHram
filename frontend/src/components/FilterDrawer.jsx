import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, IndianRupee, MapPin, Zap, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useTranslation } from '../context/TranslationContext';

const FilterDrawer = ({ isOpen, onClose, onApply, categories, initialFilters }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters || {
    category: 'all',
    minPay: '',
    maxPay: '',
    urgency: 'all',
    distance: 20
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: 'all',
      minPay: '',
      maxPay: '',
      urgency: 'all',
      distance: 20
    };
    setFilters(defaultFilters);
    onApply(defaultFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-white/5 shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="p-6 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Filter className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold font-['Space_Grotesk']">Advanced Filters</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filters.category === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-1.5 rounded-xl transition-all"
                    onClick={() => setFilters({ ...filters, category: 'all' })}
                  >
                    All Sectors
                  </Badge>
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id || cat.name}
                      variant={filters.category === (cat.id || cat.name) ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-1.5 rounded-xl transition-all"
                      onClick={() => setFilters({ ...filters, category: cat.id || cat.name })}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pay Range */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Pay Range (₹)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Min Pay</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPay}
                      onChange={(e) => setFilters({ ...filters, minPay: e.target.value })}
                      className="bg-muted/20 border-white/5 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Max Pay</span>
                    <Input
                      type="number"
                      placeholder="5000+"
                      value={filters.maxPay}
                      onChange={(e) => setFilters({ ...filters, maxPay: e.target.value })}
                      className="bg-muted/20 border-white/5 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Urgency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFilters({ ...filters, urgency: 'all' })}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      filters.urgency === 'all' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <span className="font-bold text-sm">Any</span>
                    {filters.urgency === 'all' && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, urgency: 'urgent' })}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      filters.urgency === 'urgent' 
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
                        : 'bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <span className="font-bold text-sm">Urgent Only</span>
                    {filters.urgency === 'urgent' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Distance Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Radius (km)
                  </label>
                  <span className="text-primary font-black">{filters.distance}km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={filters.distance}
                  onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                  className="w-full h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                  <span>1KM</span>
                  <span>10KM</span>
                  <span>25KM</span>
                  <span>50KM</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-8 flex flex-col gap-3">
                <Button 
                  onClick={handleApply}
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={resetFilters}
                  className="w-full h-12 rounded-2xl text-muted-foreground font-bold hover:bg-muted/30 transition-all border border-transparent hover:border-white/5"
                >
                  Reset Defaults
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
