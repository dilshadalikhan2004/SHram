import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Briefcase, 
  MapPin, 
  Users, 
  IndianRupee, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Zap,
  Calendar,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import LocationPicker from './LocationPicker';

const STEPS = [
  { id: 'ai', title: 'AI Assist', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'basic', title: 'Basic Info', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'requirements', title: 'Requirements', icon: <Users className="w-5 h-5" /> },
  { id: 'location', title: 'Location', icon: <MapPin className="w-5 h-5" /> },
  { id: 'budget', title: 'Budget', icon: <IndianRupee className="w-5 h-5" /> },
  { id: 'review', title: 'Review', icon: <CheckCircle className="w-5 h-5" /> },
];

const JobPostingWizard = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDrafting, setIsDrafting] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'construction',
    requirements: '',
    min_experience: 0,
    team_size: 1,
    hire_type: 'individual',
    location: '',
    latitude: null,
    longitude: null,
    salary_paise: 0,
    salary_type: 'daily',
    start_date: '',
    estimated_duration: '',
    is_urgent: false
  });

  const handleAiDraft = async () => {
    if (!aiQuery.trim()) return;
    setIsDrafting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/api/jobs/draft`, { query: aiQuery }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, ...res.data }));
      setCurrentStep(1); // Move to basic info
    } catch (err) {
      console.error("AI Draft Error:", err);
      toast.error("Failed to generate job draft. Please try again manually.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const payload = {
        ...formData,
        requirements: formData.requirements.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.post(`${API_URL}/api/jobs/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onComplete();
    } catch (err) {
      console.error("Post Job Error:", err);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'ai':
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-center">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">How can AI help you today?</h3>
              <p className="text-gray-400">Describe the job in simple words, and we'll draft the details for you.</p>
            </div>
            <div className="relative">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Example: I need 3 electricians for a wiring project in Borivali, starting next Monday. Paying 800/day for 1 week."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-white min-h-[150px] focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-gray-600 transition-all"
              />
              <button
                onClick={handleAiDraft}
                type="button"
                disabled={isDrafting || !aiQuery.trim()}
                className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all"
              >
                {isDrafting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <Sparkles className="w-4 h-4" />}
                Draft with AI
              </button>
            </div>
            <div className="text-center text-gray-500 text-sm">
              <button 
                type="button"
                onClick={() => setCurrentStep(1)}
                className="hover:text-blue-400 transition-colors underline flex items-center gap-1 mx-auto"
              >
                Or skip and fill manually
              </button>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Job Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Electrician for Mall Complex"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="construction">Construction</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrician">Electrician</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                   <div 
                    onClick={() => setFormData({ ...formData, is_urgent: !formData.is_urgent })}
                    className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${formData.is_urgent ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-slate-700 text-gray-500 hover:border-slate-600'}`}
                   >
                     <Zap className={`w-5 h-5 ${formData.is_urgent ? 'fill-orange-500 animate-pulse' : ''}`} />
                     <span className="font-bold">URGENT</span>
                   </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Tell workers about the work</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scope of work, tools needed, etc."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Hire Type</label>
                <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-700 rounded-xl">
                  {['individual', 'squad', 'bulk'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, hire_type: type })}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold capitalize transition-all ${formData.hire_type === type ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Team Size</label>
                <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-xl">
                   <button 
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, team_size: Math.max(1, f.team_size - 1) }))}
                    className="p-4 text-gray-400 hover:text-white transition-colors"
                  >-</button>
                   <input 
                    type="number"
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 1 })}
                    className="flex-1 bg-transparent text-center text-white font-bold outline-none"
                   />
                   <button 
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, team_size: f.team_size + 1 }))}
                    className="p-4 text-gray-400 hover:text-white transition-colors"
                  >+</button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Required Skills (Comma separated)</label>
              <input
                type="text"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="e.g. Wiring, Soldering, Safety Ceritified"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
             <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-700 group relative">
                <LocationPicker 
                  value={formData.location}
                  onChange={(address) => setFormData(f => ({ ...f, location: address }))}
                  onCoordinatesChange={(lat, lng) => setFormData(f => ({ ...f, latitude: lat, longitude: lng }))}
                />
                {!formData.location && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                     <p className="bg-slate-900/80 px-4 py-2 rounded-full text-blue-400 text-sm font-medium border border-blue-500/30">
                        Pin the job location on the map
                     </p>
                  </div>
                )}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    />
                    <Calendar className="absolute right-4 top-4 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Estimated Duration</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                      placeholder="e.g. 5 days, 1 month"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <Clock className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                  </div>
                </div>
             </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-8 py-4 text-center">
            <IndianRupee className="w-16 h-16 text-emerald-500 mx-auto opacity-50" />
            <div className="max-w-xs mx-auto">
              <label className="text-lg font-bold text-white mb-4 block">Set your budget</label>
              <div className="relative mb-6">
                <input
                   type="number"
                   value={formData.salary_paise / 100}
                   onChange={(e) => setFormData({ ...formData, salary_paise: parseInt(e.target.value) * 100 })}
                   className="w-full bg-transparent border-b-2 border-slate-700 text-center text-4xl font-black text-white focus:border-emerald-500 outline-none pb-2 transition-all"
                />
                <span className="absolute left-0 top-1 text-2xl text-gray-600">₹</span>
              </div>
              <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-700 rounded-xl">
                  {['daily', 'fixed'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, salary_type: type })}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold capitalize transition-all ${formData.salary_type === type ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-left max-w-md mx-auto">
               <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-amber-500 font-bold mb-1 italic">Escrow Deposit</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      To hire instantly, you will need to lock <span className="text-white font-bold">₹{((formData.salary_paise * formData.team_size) / 100).toLocaleString()}</span> in safe Escrow once you go live.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-2xl font-black text-white mb-1">{formData.title || 'Untitled Job'}</h4>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{formData.category}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {formData.location || 'Location pinning pending'}</div>
                      </div>
                   </div>
                   {formData.is_urgent && (
                     <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black italic animate-bounce">URGENT</span>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                   <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Budget</p>
                      <p className="text-white font-bold">₹{formData.salary_paise / 100} / {formData.salary_type}</p>
                   </div>
                   <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Duration</p>
                      <p className="text-white font-bold">{formData.estimated_duration || 'Not set'}</p>
                   </div>
                   <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Team</p>
                      <p className="text-white font-bold">{formData.team_size} {formData.hire_type}(s)</p>
                   </div>
                   <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Starts On</p>
                      <p className="text-white font-bold">{formData.start_date || 'ASAP'}</p>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Detailed Scope</p>
                   <p className="text-gray-400 text-sm leading-relaxed">{formData.description || 'No description provided.'}</p>
                </div>
                
                {formData.requirements && (
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.requirements.split(',').map((s, i) => (
                           <span key={i} className="bg-slate-800 px-3 py-1 rounded-lg text-xs text-white border border-slate-700">{s.trim()}</span>
                        ))}
                      </div>
                   </div>
                )}
             </div>
             <p className="text-center text-xs text-gray-500 px-6">
                By clicking "Confirm & Go Live", you agree to post this listing and acknowledge that match-matching AI will begin immediate scouting.
             </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col h-full max-h-[95vh] sm:h-[700px]"
      >
        {/* Header */}
        <div className="p-4 sm:p-8 pb-4">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
             <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {STEPS[currentStep].icon}
                  {STEPS[currentStep].title}
                </h2>
                <div className="flex gap-1 mt-2">
                  {STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 sm:w-8 bg-blue-500' : i < currentStep ? 'w-3 sm:w-4 bg-blue-900' : 'w-3 sm:w-4 bg-slate-800'}`} 
                    />
                  ))}
                </div>
             </div>
             <button type="button" onClick={onCancel} className="text-gray-600 hover:text-white transition-colors p-2">
               <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-90" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 custom-scrollbar pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 sm:p-8 border-t border-slate-800 bg-slate-900/50 flex justify-between gap-4">
           {currentStep > 0 && (
             <button 
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-all px-2 sm:px-4"
             >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
             </button>
           )}
           <div className="flex-1" />
           <button 
            type="button"
            onClick={handleNext}
            disabled={isDrafting}
            className={`bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-base sm:text-lg ${currentStep === 0 && 'hidden'}`}
           >
              {currentStep === STEPS.length - 1 ? (
                <span className="text-sm sm:text-lg">Confirm & Go Live</span>
              ) : (
                <span>Continue</span>
              )}
              <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default JobPostingWizard;
