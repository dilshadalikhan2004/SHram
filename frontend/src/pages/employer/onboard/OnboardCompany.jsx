import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Briefcase, Globe, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import api from '../../../lib/api';
import { toast } from 'sonner';

const COMPANY_TYPES = [
  { value: 'contractor', label: 'Labor Contractor', desc: 'Manage and deploy work squads' },
  { value: 'developer', label: 'Real Estate Developer', desc: 'Direct hiring for large projects' },
  { value: 'agency', label: 'Staffing Agency', desc: 'Bulk recruitment for industries' },
  { value: 'individual', label: 'Private Employer', desc: 'Small-scale home or site hiring' },
];

const OnboardCompany = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: '',
    employee_count: '',
    website: ''
  });

  const handleNext = async () => {
    if (!formData.company_name || !formData.company_type) {
      toast.error("Please fill in the core corporate identity");
      return;
    }

    setLoading(true);
    try {
      await api.patch('/employer/profile/onboarding-progress', {
        step: 'company',
        data: formData
      });
      navigate('/employer/onboard/verify');
    } catch (err) {
      toast.error("Failed to sync progress. Please check your signal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight flex items-center gap-4">
          <Building2 className="w-10 h-10 text-primary" />
          Enterprise Identity
        </h2>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-60">
          Phase 01 / Command Initialization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 p-10 rounded-[3rem] bg-muted/10 border border-white/5 shadow-2xl backdrop-blur-md">
        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Legal Enterprise Name</Label>
          <div className="relative group">
            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="e.g. Adani Infrastructures" 
              className="h-16 pl-14 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 text-lg font-['Space_Grotesk'] font-bold shadow-inner"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Business Sector</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPANY_TYPES.map((type) => (
              <div 
                key={type.value}
                onClick={() => setFormData({ ...formData, company_type: type.value })}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden ${
                  formData.company_type === type.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                   <div className={`p-2 rounded-xl transition-colors ${formData.company_type === type.value ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground'}`}>
                      <Briefcase className="w-4 h-4" />
                   </div>
                   {formData.company_type === type.value && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
                </div>
                <p className="font-black font-['Space_Grotesk'] text-sm uppercase tracking-wide mb-1">{type.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold opacity-60">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Employee Force</Label>
              <Input 
                placeholder="e.g. 50-200" 
                className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 font-['Space_Grotesk']"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
              />
           </div>
           <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Digital Protocol (URL)</Label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="https://acme.corp" 
                  className="h-14 pl-12 rounded-2xl bg-black/40 border-white/5 focus:border-primary/50 font-['Space_Grotesk']"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-10">
        <Button 
          onClick={handleNext} 
          disabled={loading}
          className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 group"
        >
          {loading ? "INITIALIZING..." : "NEXT: VERIFICATION"}
          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardCompany;
