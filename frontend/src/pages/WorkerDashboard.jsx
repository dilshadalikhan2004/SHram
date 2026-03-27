import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  HardHat, Sun, Moon, LogOut, Search, MapPin, IndianRupee, 
  Briefcase, Clock, Star, Bell, MessageSquare, User, ChevronRight,
  Filter, Building2, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Bookmark, BookmarkCheck, Zap, Sparkles, Shield, History, Rocket
} from 'lucide-react';
import { toast } from 'sonner';
import MatchScoreCard from '../components/MatchScoreCard';
import ChatPanel from '../components/ChatPanel';
import LanguageSelector from '../components/LanguageSelector';
import ReliabilityScore from '../components/ReliabilityScore';
import PhoneVerification from '../components/PhoneVerification';
import VideoIntroUpload from '../components/VideoIntroUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useTranslation();
  
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
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
      const [jobsRes, appsRes, statsRes, notifRes, catRes, profileRes, savedRes, recommendedRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs`),
        axios.get(`${API_URL}/api/applications/worker`),
        axios.get(`${API_URL}/api/stats/worker`),
        axios.get(`${API_URL}/api/notifications`),
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/worker/profile`).catch(() => null),
        axios.get(`${API_URL}/api/jobs/saved`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/jobs/recommended`).catch(() => ({ data: [] })),
      ]);
      
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data);
      setNotifications(notifRes.data);
      setCategories(catRes.data.categories);
      if (profileRes) setProfile(profileRes.data);
      setSavedJobs(savedRes.data);
      setRecommendedJobs(recommendedRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId, quickApply = false) => {
    try {
      await axios.post(`${API_URL}/api/applications`, { 
        job_id: jobId,
        quick_apply: quickApply
      });
      toast.success(quickApply ? 'Quick apply successful!' : 'Application submitted!');
      fetchData();
      setSelectedJob(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const handleSaveJob = async (jobId) => {
    const isSaved = savedJobs.some(j => j.id === jobId);
    try {
      if (isSaved) {
        await axios.delete(`${API_URL}/api/jobs/save/${jobId}`);
        toast.success('Job removed from saved');
      } else {
        await axios.post(`${API_URL}/api/jobs/save`, { job_id: jobId });
        toast.success('Job saved!');
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const hasApplied = (jobId) => applications.some(app => app.job_id === jobId);
  const isSaved = (jobId) => savedJobs.some(j => j.id === jobId);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'status-applied';
      case 'viewed': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300';
      case 'shortlisted': return 'status-shortlisted';
      case 'selected': return 'status-selected';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const getCategoryName = (cat) => {
    if (language === 'hi') return cat.name_hi || cat.name;
    if (language === 'or') return cat.name_or || cat.name;
    return cat.name;
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    const token = localStorage.getItem('token');
    return `${API_URL}/api/files/${path}?auth=${token}`;
  };

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
                <p className="text-xs text-muted-foreground">श्रमसेतु</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector variant="ghost" />
              
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
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-14 h-14 border-2 border-primary">
            <AvatarImage src={getPhotoUrl(profile?.profile_photo)} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
              {t('welcome')}, {user?.name?.split(' ')[0]}! 
            </h2>
            <p className="text-muted-foreground mt-1">{t('find_jobs')}</p>
          </div>
          {profile?.phone_verified && (
            <Badge variant="outline" className="ml-auto hidden sm:flex gap-1 text-green-600 border-green-200">
              <CheckCircle className="w-3 h-3" />
              {t('phone_verified')}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('my_applications')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('shortlisted')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('selected')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('reliability_score')}</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {stats?.reliability_score || 50}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('rating')}</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {stats?.rating?.toFixed(1) || '0.0'}
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Jobs Section */}
        {recommendedJobs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('recommended')}</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {recommendedJobs.slice(0, 5).map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-shrink-0 w-72"
                >
                  <Card 
                    className="h-full cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4">
                      {job.is_boosted && (
                        <Badge className="mb-2 bg-gradient-to-r from-amber-500 to-orange-500">
                          <Rocket className="w-3 h-3 mr-1" /> Featured
                        </Badge>
                      )}
                      <h4 className="font-semibold truncate">{job.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{job.company_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-semibold text-primary">
                          ₹{job.pay_amount}/{job.pay_type}
                        </span>
                        <Button size="sm" variant="outline" className="h-7">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 h-12">
            <TabsTrigger value="jobs" className="text-sm" data-testid="jobs-tab">
              <Briefcase className="w-4 h-4 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">{t('find_jobs')}</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-sm" data-testid="applications-tab">
              <Clock className="w-4 h-4 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">{t('my_applications')}</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-sm" data-testid="saved-tab">
              <Bookmark className="w-4 h-4 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm" data-testid="history-tab">
              <History className="w-4 h-4 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-sm" data-testid="profile-tab">
              <User className="w-4 h-4 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">{t('profile')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('search_jobs')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                  data-testid="job-search-input"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 h-11" data-testid="category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('all_categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{getCategoryName(cat)}</SelectItem>
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
                filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`card-hover cursor-pointer relative ${job.is_boosted ? 'border-amber-500/50 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10' : ''}`}
                      onClick={() => setSelectedJob(job)}
                      data-testid={`job-card-${job.id}`}
                    >
                      {job.is_boosted && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            <Zap className="w-3 h-3 mr-1" /> Boosted
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="pr-20">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {job.company_name}
                            </p>
                          </div>
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
                          <div className="flex items-center gap-2">
                            {hasApplied(job.id) && (
                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700">
                                {t('applied')}
                              </Badge>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveJob(job.id);
                              }}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {isSaved(job.id) ? (
                                <BookmarkCheck className="w-4 h-4 text-primary" />
                              ) : (
                                <Bookmark className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
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
                              <span className="text-sm font-medium">{t('match_score')}:</span>
                              <Badge className={app.match_score >= 70 ? 'bg-green-500' : app.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}>
                                {app.match_score}%
                              </Badge>
                              {app.ai_recommendation && (
                                <Badge variant="outline" className="ml-auto">
                                  {app.ai_recommendation}
                                </Badge>
                              )}
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

          {/* Saved Jobs Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No saved jobs</p>
                <p className="text-muted-foreground">Bookmark jobs to apply later</p>
              </div>
            ) : (
              savedJobs.map((job) => (
                <Card key={job.id} className="card-hover cursor-pointer" onClick={() => setSelectedJob(job)}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> {job.pay_amount}/{job.pay_type}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveJob(job.id);
                        }}
                      >
                        <BookmarkCheck className="w-5 h-5 text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Work History Tab */}
          <TabsContent value="history" className="space-y-4">
            {workHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No work history yet</p>
                <p className="text-muted-foreground">Completed jobs will appear here</p>
              </div>
            ) : (
              workHistory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.job_title}</h3>
                        <p className="text-sm text-muted-foreground">{item.employer_name}</p>
                        {item.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {new Date(item.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {item.rating_received && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-semibold">{item.rating_received}</span>
                        </div>
                      )}
                    </div>
                    {item.review_received && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        "{item.review_received}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {profile ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{t('profile')}</CardTitle>
                          <CardDescription>Your worker profile information</CardDescription>
                        </div>
                        <PhoneVerification
                          isVerified={profile.phone_verified}
                          onVerified={() => {
                            setProfile({ ...profile, phone_verified: true });
                            fetchData();
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('skills')}</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                              <Badge key={skill.name} variant="secondary">
                                {skill.name} ({skill.years_experience}y)
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('location')}</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {profile.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('daily_rate')}</p>
                          <p className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" /> {profile.daily_rate}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('experience')}</p>
                          <p>{profile.experience_years} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Availability</p>
                          <Badge variant={profile.availability === 'available' ? 'default' : 'secondary'}>
                            {profile.availability}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('rating')}</p>
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

                  {/* Video Introduction Section */}
                  <VideoIntroUpload
                    currentVideo={profile.video_intro}
                    onUploadSuccess={(videoUrl) => {
                      setProfile({ ...profile, video_intro: videoUrl });
                      toast.success('Video intro uploaded!');
                    }}
                    onDelete={() => {
                      setProfile({ ...profile, video_intro: null });
                    }}
                  />
                </div>

                <div>
                  <ReliabilityScore
                    score={profile.reliability_score || 50}
                    jobsCompleted={profile.total_jobs_completed || 0}
                    acceptanceRate={profile.acceptance_rate || 100}
                    phoneVerified={profile.phone_verified}
                  />
                </div>
              </div>
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
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      {selectedJob.is_boosted && (
                        <Badge className="mb-2 bg-gradient-to-r from-amber-500 to-orange-500">
                          <Zap className="w-3 h-3 mr-1" /> Featured Job
                        </Badge>
                      )}
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
                      <p className="text-sm text-muted-foreground">{t('location')}</p>
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
                    <h4 className="font-medium mb-2">{t('skills')} Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills_required.map((skill) => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('experience')} Required:</span>
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
                    {!hasApplied(selectedJob.id) && (
                      <>
                        <Button
                          className="flex-1 btn-worker"
                          onClick={() => handleApply(selectedJob.id)}
                          data-testid="apply-job-btn"
                        >
                          {t('apply_now')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleApply(selectedJob.id, true)}
                          className="gap-2"
                          data-testid="quick-apply-btn"
                        >
                          <Zap className="w-4 h-4" /> Quick Apply
                        </Button>
                      </>
                    )}
                    {hasApplied(selectedJob.id) && (
                      <Button disabled className="flex-1">
                        Already Applied
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSaveJob(selectedJob.id)}
                    >
                      {isSaved(selectedJob.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default WorkerDashboard;
