import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  HardHat, Sun, Moon, LogOut, Search, MapPin, IndianRupee, 
  Briefcase, Clock, Star, Bell, MessageSquare, User, ChevronRight,
  Filter, Building2, CheckCircle, XCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import MatchScoreCard from '../components/MatchScoreCard';
import ChatPanel from '../components/ChatPanel';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, statsRes, notifRes, catRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs`),
        axios.get(`${API_URL}/api/applications/worker`),
        axios.get(`${API_URL}/api/stats/worker`),
        axios.get(`${API_URL}/api/notifications`),
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/worker/profile`).catch(() => null),
      ]);
      
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data);
      setCategories(catRes.data.categories);
      if (profileRes) setProfile(profileRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(`${API_URL}/api/applications`, { job_id: jobId });
      toast.success('Application submitted successfully!');
      fetchData();
      setSelectedJob(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const hasApplied = (jobId) => applications.some(app => app.job_id === jobId);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'status-applied';
      case 'shortlisted': return 'status-shortlisted';
      case 'selected': return 'status-selected';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background worker-theme">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0066FF]/10 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-[#0066FF]" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg font-['Outfit']">ShramSetu</h1>
                <p className="text-xs text-muted-foreground">Worker Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowChat(!showChat)}
                data-testid="chat-btn"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
            Namaste, {user?.name?.split(' ')[0]}! 
          </h2>
          <p className="text-muted-foreground mt-1">Find your next opportunity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold">{stats?.total_applications || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold">{stats?.shortlisted || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">{stats?.selected || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
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

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12">
            <TabsTrigger value="jobs" className="text-base" data-testid="jobs-tab">
              <Briefcase className="w-4 h-4 mr-2" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-base" data-testid="applications-tab">
              <Clock className="w-4 h-4 mr-2" /> Applications
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-base" data-testid="profile-tab">
              <User className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                  data-testid="job-search-input"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 h-11" data-testid="category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="skeleton h-48" />
                ))
              ) : filteredJobs.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No jobs found</p>
                  <p className="text-muted-foreground">Try adjusting your filters</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className="card-hover cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                    data-testid={`job-card-${job.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {job.company_name}
                          </p>
                        </div>
                        {hasApplied(job.id) && (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700">
                            Applied
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills_required.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.skills_required.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> {job.pay_amount}/{job.pay_type}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No applications yet</p>
                <p className="text-muted-foreground">Start applying to jobs</p>
              </div>
            ) : (
              applications.map((app) => (
                <Card key={app.id} className="card-hover" data-testid={`application-${app.id}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{app.job?.title || 'Job'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        
                        {app.match_score && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">Match Score:</span>
                              <Badge className={app.match_score >= 70 ? 'bg-green-500' : app.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}>
                                {app.match_score}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{app.match_explanation}</p>
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {profile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your worker profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <Badge key={skill.name} variant="secondary">
                            {skill.name} ({skill.years_experience}y)
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {profile.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Daily Rate</p>
                      <p className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" /> {profile.daily_rate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience</p>
                      <p>{profile.experience_years} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Availability</p>
                      <Badge variant={profile.availability === 'available' ? 'default' : 'secondary'}>
                        {profile.availability}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <p className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {profile.rating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                  </div>
                  {profile.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  )}
                  <Button variant="outline" onClick={() => navigate('/worker/profile/edit')}>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Complete Your Profile</p>
                  <p className="text-muted-foreground mb-4">Add your skills and experience to start applying</p>
                  <Button onClick={() => navigate('/worker/profile/setup')} className="btn-worker">
                    Setup Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedJob.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" /> {selectedJob.company_name}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedJob(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Pay</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" /> {selectedJob.pay_amount}
                    <span className="text-sm font-normal text-muted-foreground">/{selectedJob.pay_type}</span>
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {selectedJob.location}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Skills Required</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills_required.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Experience Required:</span>
                  <span className="ml-2 font-medium">{selectedJob.experience_required}+ years</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vacancies:</span>
                  <span className="ml-2 font-medium">{selectedJob.vacancies}</span>
                </div>
                {selectedJob.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{selectedJob.duration}</span>
                  </div>
                )}
              </div>

              {profile && <MatchScoreCard jobId={selectedJob.id} />}

              <div className="flex gap-3">
                <Button
                  className="flex-1 btn-worker"
                  disabled={hasApplied(selectedJob.id)}
                  onClick={() => handleApply(selectedJob.id)}
                  data-testid="apply-job-btn"
                >
                  {hasApplied(selectedJob.id) ? 'Already Applied' : 'Apply Now'}
                </Button>
                <Button variant="outline" onClick={() => setShowChat(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default WorkerDashboard;
