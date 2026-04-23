import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkerData } from '../../context/WorkerDataContext';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  User, MapPin, IndianRupee, Briefcase, FileText,
  ChevronLeft, Save, Loader2, Sparkles, Award
} from 'lucide-react';

const WorkerEditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, categories, fetchData, loading } = useWorkerData();

  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    bio: '',
    skills: [],
    category: '',
    location: '',
    daily_rate: '',
    experience_years: '',
    upi_id: ''
  });

  // keep raw textarea text so user can type spaces/commas naturally
  const [skillsText, setSkillsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const normalizeSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
      return skills
        .map((s) => (typeof s === 'string' ? s : s?.name || ''))
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof skills === 'string') {
      return skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    if (profile) {
      const normalizedSkills = normalizeSkills(profile.skills);

      setFormData({
        user_id: profile.user_id || user?.id || user?.user_id || '',
        full_name: profile.full_name || user?.full_name || '',
        bio: profile.bio || '',
        skills: normalizedSkills,
        category: profile.category || '',
        location: profile.location || '',
        // rupees in UI
        daily_rate:
          profile.daily_rate !== null && profile.daily_rate !== undefined
            ? String(profile.daily_rate)
            : '',
        experience_years:
          profile.experience_years !== null && profile.experience_years !== undefined
            ? String(profile.experience_years)
            : '',
        upi_id: profile.upi_id || ''
      });

      setSkillsText(normalizedSkills.join(', '));
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // no space stripping here
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // critical fix: keep full raw input, parse array separately
  const handleSkillsChange = (e) => {
    const raw = e.target.value;
    setSkillsText(raw);

    const skillsArray = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setFormData((prev) => ({ ...prev, skills: skillsArray }));
  };

  // protect textareas from parent/global key handlers
  const allowTextPunctuation = (e) => {
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        skills: normalizeSkills(skillsText),
        // keep as rupees
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : 0,
        experience_years: formData.experience_years ? parseFloat(formData.experience_years) : 0
      };

      await profileApi.updateWorkerProfile(payload);
      toast.success('Dossier updated successfully!');
      await fetchData();
      navigate('/worker/profile');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-['Space_Grotesk'] uppercase tracking-widest text-xs">
          Accessing Encrypted Data...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/worker/profile')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <div className="p-2 rounded-lg bg-muted/20 border border-white/5 group-hover:border-primary/30 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest font-['Space_Grotesk']">Back to Profile</span>
        </button>

        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">System Command</p>
          <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter uppercase">Modify Dossier</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Intel Section */}
        <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 opacity-50" />

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30 text-primary">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-['Space_Grotesk'] text-foreground uppercase tracking-tight">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20"
                  placeholder="Enter your legal name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Location / Jurisdiction</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20"
                  placeholder="City, State"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expertise Section */}
        <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mb-32 opacity-50" />

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-['Space_Grotesk'] text-foreground uppercase tracking-tight">Skill Matrix</h3>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Primary Trade</label>
                <div className="relative group">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-14 pl-6 pr-10 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-background">Select Sector</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-background">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Years of Field Ops</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20"
                    placeholder="e.g. 5"
                    min="0"
                    max="50"
                    step="0.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">
                Detailed Skill Capabilities (Comma Separated)
              </label>
              <textarea
                name="skills"
                value={skillsText}
                onChange={handleSkillsChange}
                onKeyDown={allowTextPunctuation}
                onKeyUp={allowTextPunctuation}
                className="w-full min-h-[100px] p-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20 resize-none"
                placeholder="Ex: House Wiring, MCB Installation, PVC Piping..."
              />
            </div>
          </div>
        </div>

        {/* Financial & Bio Section */}
        <div className="p-8 lg:p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -ml-32 -mt-32 opacity-50" />

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-['Space_Grotesk'] text-foreground uppercase tracking-tight">Strategic Intel</h3>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Target Daily Rate (₹)</label>
                <div className="relative group w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₹</div>
                  <input
                    type="number"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    className="w-full h-14 pl-10 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20"
                    placeholder="e.g. 800"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">UPI ID (For Direct Payments)</label>
                <div className="relative group w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleChange}
                    className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20"
                    placeholder="e.g. name@okaxis"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Professional Summary (Bio)</label>
              <div className="relative group">
                <div className="absolute left-4 top-6 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  onKeyDown={allowTextPunctuation}
                  onKeyUp={allowTextPunctuation}
                  className="w-full min-h-[150px] pl-12 pr-6 py-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm font-bold font-['Space_Grotesk'] placeholder:text-muted-foreground/20 resize-none"
                  placeholder="Tell employers about your expertise and work history..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/worker/profile')}
            className="flex-1 h-16 rounded-2xl bg-muted/20 border border-white/5 text-foreground font-black uppercase tracking-widest text-xs hover:bg-muted/40 transition-all font-['Space_Grotesk']"
          >
            Abort Changes
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all font-['Space_Grotesk'] flex items-center justify-center gap-3"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transmitting Data...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Commit Updates
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default WorkerEditProfile;
