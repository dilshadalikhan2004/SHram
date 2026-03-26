import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Briefcase, Sun, Moon, LogOut, Plus, MapPin, IndianRupee, 
  Users, Clock, Star, Bell, MessageSquare, Building2, 
  CheckCircle, XCircle, Eye, TrendingUp, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import ChatPanel from '../components/ChatPanel';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SKILL_OPTIONS = [
  'Construction', 'Mason', 'Electrician', 'Plumber', 'Carpenter', 
  'Painter', 'Welder', 'Driver', 'Security', 'Cleaning', 'Gardener', 'Helper'
];

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    category: '',
    skills_required: [],
    experience_required: 0,
    pay_type: 'daily',
    pay_amount: '',
    location: '',
    duration: '',
    vacancies: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, statsRes, notifRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/employer`),
        axios.get(`${API_URL}/api/stats/employer`),
        axios.get(`${API_URL}/api/notifications`),
        axios.get(`${API_URL}/api/employer/profile`).catch(() => null),
      ]);
      
      setJobs(jobsRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data);
      if (profileRes) setProfile(profileRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/api/applications/job/${jobId}`);
      setApplicants(response.data);
    } catch (error) {
      toast.error('Failed to fetch applicants');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/jobs`, {
        ...newJob,
        pay_amount: parseFloat(newJob.pay_amount),
        experience_required: parseInt(newJob.experience_required),
        vacancies: parseInt(newJob.vacancies),
      });
      toast.success('Job posted successfully!');
      setShowCreateJob(false);
      setNewJob({
        title: '',
        description: '',
        category: '',
        skills_required: [],
        experience_required: 0,
        pay_type: 'daily',
        pay_amount: '',
        location: '',
        duration: '',
        vacancies: 1,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job');
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      await axios.patch(`${API_URL}/api/applications/${appId}/status?status=${status}`);
      toast.success(`Application ${status}!`);
      if (selectedJob) fetchApplicants(selectedJob.id);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await axios.patch(`${API_URL}/api/jobs/${jobId}/status?status=${status}`);
      toast.success(`Job ${status}!`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const toggleSkill = (skill) => {
    if (newJob.skills_required.includes(skill)) {
      setNewJob({
        ...newJob,
        skills_required: newJob.skills_required.filter(s => s !== skill)
      });
    } else {
      setNewJob({
        ...newJob,
        skills_required: [...newJob.skills_required, skill]
      });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background employer-theme">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#059669]/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#059669]" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg font-['Outfit']">ShramSetu</h1>
                <p className="text-xs text-muted-foreground">Employer Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                data-testid="chat-btn"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
              Welcome, {profile?.company_name || user?.name}!
            </h2>
            <p className="text-muted-foreground mt-1">Manage your jobs and find workers</p>
          </div>
          <Button onClick={() => setShowCreateJob(true)} className="btn-employer" data-testid="post-job-btn">
            <Plus className="w-4 h-4 mr-2" /> Post New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats?.total_jobs_posted || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Jobs</p>
                  <p className="text-2xl font-bold">{stats?.open_jobs || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold">{stats?.total_applications || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {stats?.rating?.toFixed(1) || '0.0'}
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12">
            <TabsTrigger value="jobs" className="text-base" data-testid="jobs-tab">
              <Briefcase className="w-4 h-4 mr-2" /> My Jobs
            </TabsTrigger>
            <TabsTrigger value="applicants" className="text-base" data-testid="applicants-tab">
              <Users className="w-4 h-4 mr-2" /> Applicants
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-base" data-testid="profile-tab">
              <Building2 className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <Card key={i} className="skeleton h-32" />)
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No jobs posted yet</p>
                  <p className="text-muted-foreground mb-4">Post your first job to find workers</p>
                  <Button onClick={() => setShowCreateJob(true)} className="btn-employer">
                    <Plus className="w-4 h-4 mr-2" /> Post Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="card-hover" data-testid={`job-card-${job.id}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> {job.pay_amount}/{job.pay_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job.applications_count} applicants
                          </span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            fetchApplicants(job.id);
                            setActiveTab('applicants');
                          }}
                          data-testid={`view-applicants-${job.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        {job.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'closed')}
                          >
                            Close Job
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Applicants Tab */}
          <TabsContent value="applicants" className="space-y-4">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedJob.title}</h3>
                    <p className="text-sm text-muted-foreground">{applicants.length} applicants</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedJob(null)}>
                    Back to Jobs
                  </Button>
                </div>

                {applicants.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No applicants yet</p>
                      <p className="text-muted-foreground">Share your job to get more applicants</p>
                    </CardContent>
                  </Card>
                ) : (
                  applicants.map((app) => (
                    <Card key={app.id} className="card-hover" data-testid={`applicant-${app.id}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-lg font-semibold">
                                  {app.worker_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">{app.worker_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Applied {new Date(app.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {app.worker_profile && (
                              <div className="space-y-2 mb-3">
                                <div className="flex flex-wrap gap-2">
                                  {app.worker_profile.skills?.map((skill) => (
                                    <Badge key={skill.name} variant="outline" className="text-xs">
                                      {skill.name} ({skill.years_experience}y)
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {app.worker_profile.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="w-3 h-3" /> {app.worker_profile.daily_rate}/day
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-500" /> {app.worker_profile.rating?.toFixed(1) || 'New'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Match Score */}
                            {app.match_score && (
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">AI Match Score:</span>
                                  <Badge className={
                                    app.match_score >= 70 ? 'bg-green-500' : 
                                    app.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  }>
                                    {app.match_score}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{app.match_explanation}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col gap-2">
                            <Badge className={`
                              ${app.status === 'applied' ? 'status-applied' : ''}
                              ${app.status === 'shortlisted' ? 'status-shortlisted' : ''}
                              ${app.status === 'selected' ? 'status-selected' : ''}
                              ${app.status === 'rejected' ? 'status-rejected' : ''}
                            `}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                            
                            {app.status === 'applied' && (
                              <>
                                <Button
                                  size="sm"
                                  className="btn-employer"
                                  onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                  data-testid={`shortlist-${app.id}`}
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {app.status === 'shortlisted' && (
                              <Button
                                size="sm"
                                className="btn-employer"
                                onClick={() => updateApplicationStatus(app.id, 'selected')}
                                data-testid={`select-${app.id}`}
                              >
                                Select
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowChat(true)}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Select a job to view applicants</p>
                  <p className="text-muted-foreground">Go to the Jobs tab and click "View"</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {profile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Your company information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                      <p className="font-medium">{profile.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Business Type</p>
                      <p className="font-medium">{profile.business_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {profile.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Verification</p>
                      <Badge variant={profile.verified ? 'default' : 'secondary'}>
                        {profile.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <p className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {profile.rating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Jobs Posted</p>
                      <p className="font-medium">{profile.total_jobs_posted}</p>
                    </div>
                  </div>
                  {profile.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{profile.description}</p>
                    </div>
                  )}
                  <Button variant="outline" onClick={() => navigate('/employer/profile/edit')}>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Complete Your Profile</p>
                  <p className="text-muted-foreground mb-4">Add your company details to start posting jobs</p>
                  <Button onClick={() => navigate('/employer/profile/setup')} className="btn-employer">
                    Setup Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>Fill in the details to create a new job posting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  placeholder="e.g., Construction Worker"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                  data-testid="job-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newJob.category}
                  onValueChange={(value) => setNewJob({ ...newJob, category: value })}
                >
                  <SelectTrigger data-testid="job-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_OPTIONS.map((skill) => (
                      <SelectItem key={skill.toLowerCase()} value={skill.toLowerCase()}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the job, responsibilities, requirements..."
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                rows={3}
                required
                data-testid="job-description-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Skills Required *</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={newJob.skills_required.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSkill(skill)}
                    className={newJob.skills_required.includes(skill) ? 'btn-employer' : ''}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <Select
                  value={newJob.pay_type}
                  onValueChange={(value) => setNewJob({ ...newJob, pay_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pay Amount (INR) *</Label>
                <Input
                  type="number"
                  placeholder="800"
                  value={newJob.pay_amount}
                  onChange={(e) => setNewJob({ ...newJob, pay_amount: e.target.value })}
                  required
                  data-testid="job-pay-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience Required</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newJob.experience_required}
                  onChange={(e) => setNewJob({ ...newJob, experience_required: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  placeholder="e.g., Mumbai"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  required
                  data-testid="job-location-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  placeholder="e.g., 3 months"
                  value={newJob.duration}
                  onChange={(e) => setNewJob({ ...newJob, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vacancies</Label>
                <Input
                  type="number"
                  min="1"
                  value={newJob.vacancies}
                  onChange={(e) => setNewJob({ ...newJob, vacancies: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateJob(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-employer" data-testid="submit-job-btn">
                Post Job
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chat Panel */}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default EmployerDashboard;
