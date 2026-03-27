import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { HardHat, MapPin, Plus, X, ArrowRight, IndianRupee, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';
import PhoneVerification from '../components/PhoneVerification';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SKILL_OPTIONS = [
  'Construction', 'Mason', 'Electrician', 'Plumber', 'Carpenter', 
  'Painter', 'Welder', 'Driver', 'Security', 'Cleaning', 'Gardener', 'Helper'
];

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi'];

const WorkerProfileSetup = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [profile, setProfile] = useState({
    skills: [],
    experience_years: 0,
    daily_rate: '',
    hourly_rate: '',
    location: '',
    latitude: null,
    longitude: null,
    bio: '',
    availability: 'available',
    languages: ['Hindi'],
    profile_photo: '',
  });

  const [newSkill, setNewSkill] = useState({ name: '', years_experience: 0, proficiency: 'intermediate' });

  const addSkill = () => {
    if (newSkill.name && !profile.skills.find(s => s.name === newSkill.name)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, { ...newSkill }]
      });
      setNewSkill({ name: '', years_experience: 0, proficiency: 'intermediate' });
    }
  };

  const removeSkill = (skillName) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s.name !== skillName)
    });
  };

  const toggleLanguage = (lang) => {
    if (profile.languages.includes(lang)) {
      setProfile({
        ...profile,
        languages: profile.languages.filter(l => l !== lang)
      });
    } else {
      setProfile({
        ...profile,
        languages: [...profile.languages, lang]
      });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile({
            ...profile,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Could not detect location');
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (profile.skills.length === 0) {
      toast.error('Add at least one skill');
      return;
    }
    if (!profile.location) {
      toast.error('Enter your location');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...profile,
        daily_rate: parseFloat(profile.daily_rate) || 0,
        hourly_rate: parseFloat(profile.hourly_rate) || 0,
        experience_years: parseInt(profile.experience_years) || 0,
      };
      
      await axios.post(`${API_URL}/api/worker/profile`, submitData);
      updateUser({ profile_complete: true });
      toast.success('Profile created successfully!');
      navigate('/worker');
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
          <div className="w-16 h-16 rounded-2xl bg-[#0066FF]/10 flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-8 h-8 text-[#0066FF]" />
          </div>
          <h1 className="text-3xl font-bold font-['Outfit']">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">Help employers find you</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-24 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-[#0066FF]' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Skills */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>Add your work skills and experience level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-muted rounded-lg">
                {profile.skills.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No skills added yet</p>
                ) : (
                  profile.skills.map((skill) => (
                    <Badge key={skill.name} variant="secondary" className="pl-3 pr-1 py-2 gap-2">
                      {skill.name} ({skill.years_experience}y)
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="hover:bg-destructive/20 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Skill</Label>
                  <Select
                    value={newSkill.name}
                    onValueChange={(value) => setNewSkill({ ...newSkill, name: value })}
                  >
                    <SelectTrigger data-testid="skill-select">
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_OPTIONS.filter(s => !profile.skills.find(ps => ps.name === s)).map((skill) => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience (years)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newSkill.years_experience}
                    onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 0 })}
                    data-testid="skill-experience-input"
                  />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select
                    value={newSkill.proficiency}
                    onValueChange={(value) => setNewSkill({ ...newSkill, proficiency: value })}
                  >
                    <SelectTrigger data-testid="skill-proficiency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                disabled={!newSkill.name}
                className="w-full"
                data-testid="add-skill-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Skill
              </Button>

              <div className="space-y-2">
                <Label>Total Work Experience (years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={profile.experience_years}
                  onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                  data-testid="total-experience-input"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={profile.skills.length === 0}
                className="w-full btn-worker"
                data-testid="step1-next-btn"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location & Rate */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Location & Rate</CardTitle>
              <CardDescription>Where you work and your expected pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Location</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Rate (INR)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="800"
                      value={profile.daily_rate}
                      onChange={(e) => setProfile({ ...profile, daily_rate: e.target.value })}
                      className="pl-10"
                      data-testid="daily-rate-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate (INR)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="100"
                      value={profile.hourly_rate}
                      onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                      className="pl-10"
                      data-testid="hourly-rate-input"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages You Speak</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Button
                      key={lang}
                      type="button"
                      variant={profile.languages.includes(lang) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLanguage(lang)}
                      className={profile.languages.includes(lang) ? 'btn-worker' : ''}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!profile.location}
                  className="flex-1 btn-worker"
                  data-testid="step2-next-btn"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Bio & Availability */}
        {step === 3 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>Tell employers about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Bio (optional)</Label>
                <Textarea
                  placeholder="Tell employers about your work experience, achievements, etc."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  data-testid="bio-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Availability</Label>
                <Select
                  value={profile.availability}
                  onValueChange={(value) => setProfile({ ...profile, availability: value })}
                >
                  <SelectTrigger data-testid="availability-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available - Ready to work</SelectItem>
                    <SelectItem value="busy">Busy - Currently employed</SelectItem>
                    <SelectItem value="unavailable">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 btn-worker"
                  data-testid="submit-profile-btn"
                >
                  {isLoading ? 'Creating...' : 'Complete Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkerProfileSetup;
