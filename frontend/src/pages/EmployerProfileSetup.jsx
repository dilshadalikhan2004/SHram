import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Briefcase, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BUSINESS_TYPES = [
  'Construction', 'Real Estate', 'Manufacturing', 'Logistics', 
  'Hospitality', 'Retail', 'Agriculture', 'Other'
];

const EmployerProfileSetup = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState({
    company_name: '',
    business_type: '',
    location: '',
    latitude: null,
    longitude: null,
    description: '',
    company_logo: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile.company_name || !profile.business_type || !profile.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/employer/profile`, profile);
      updateUser({ profile_complete: true });
      toast.success('Profile created successfully!');
      navigate('/employer');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-3xl font-bold font-['Outfit']">Company Profile</h1>
          <p className="text-muted-foreground mt-2">Tell workers about your company</p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>This helps workers know who they're applying to</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company_name"
                    placeholder="e.g., ABC Constructions"
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="pl-10"
                    required
                    data-testid="company-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Type *</Label>
                <Select
                  value={profile.business_type}
                  onValueChange={(value) => setProfile({ ...profile, business_type: value })}
                >
                  <SelectTrigger data-testid="business-type-select">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <LocationPicker
                  value={profile.location}
                  onChange={(loc) => setProfile({ ...profile, location: loc })}
                  onCoordinatesChange={(lat, lon) => setProfile({ ...profile, latitude: lat, longitude: lon })}
                />
                {profile.latitude && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    GPS: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Company Description</Label>
                <Textarea
                  placeholder="Tell workers about your company, projects, work culture, etc."
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                  data-testid="description-input"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-employer"
                data-testid="submit-profile-btn"
              >
                {isLoading ? 'Creating Profile...' : 'Complete Profile'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerProfileSetup;
