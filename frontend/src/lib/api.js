import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== SQUADS ====================
export const squadsApi = {
  create: (data) => api.post('/squads', data),
  getMySquads: () => api.get('/squads'),
  getSquad: (id) => api.get(`/squads/${id}`),
  addMember: (squadId, data) => api.post(`/squads/${squadId}/members`, data),
  removeMember: (squadId, memberId) => api.delete(`/squads/${squadId}/members/${memberId}`),
  updateSplits: (squadId, splits) => api.put(`/squads/${squadId}/splits`, { splits }),
  applyAsSquad: (squadId, data) => api.post(`/squads/${squadId}/apply`, data),
  confirmParticipation: (squadId, appId) => api.post(`/squads/${squadId}/confirm/${appId}`),
  getEarnings: (squadId) => api.get(`/squads/${squadId}/earnings`),
};

// ==================== ESCROW & EARNINGS ====================
export const escrowApi = {
  get: (jobId) => api.get(`/payment/escrow/${jobId}`),
  create: (data) => api.post('/payment/escrow/create', data),
  release: (data) => api.post('/payment/escrow/release', data),
  requestRelease: (data) => api.post('/payment/escrow/request-release', data),
};

export const earningsApi = {
  get: (period = 'all') => api.get(`/earnings?period=${period}`),
  withdraw: (data) => api.post('/earnings/withdraw', data),
  getCertificate: () => api.get('/earnings/certificate'),
};

// ==================== HANDSHAKE ====================
export const handshakeApi = {
  generate: (jobId) => api.post(`/handshake/generate/${jobId}`),
  verify: (data) => api.post('/handshake/verify', data),
};

// ==================== KYC ====================
export const kycApi = {
  initiate: (data) => api.post('/kyc/initiate', data),
  verify: (data) => api.post('/kyc/verify', data),
  getStatus: () => api.get('/kyc/status'),
};

// ==================== e-SHRAM ====================
export const eshramApi = {
  link: (data) => api.post('/eshram/link', data),
  getStatus: () => api.get('/eshram/status'),
};

// ==================== COUNTER-OFFERS ====================
export const offersApi = {
  createCounter: (data) => api.post('/offers/counter', data),
  respond: (offerId, action) => api.post(`/offers/${offerId}/respond?action=${action}`),
  getForApplication: (appId) => api.get(`/offers/application/${appId}`),
};

// ==================== LIVE TRACKING ====================
export const trackingApi = {
  updateLocation: (data) => api.post('/tracking/location', data),
  updateProgress: (data) => api.post('/tracking/progress', data),
  getStatus: (jobId) => api.get(`/tracking/status/${jobId}`),
};

// ==================== PORTFOLIO & REPUTATION ====================
export const portfolioApi = {
  add: (data) => api.post('/portfolio', data),
  getMine: () => api.get('/portfolio'),
  getUser: (userId) => api.get(`/portfolio/${userId}`),
  delete: (itemId) => api.delete(`/portfolio/${itemId}`),
  requestTestimonial: (data) => api.post('/testimonials/request', data),
  getPublicProfile: (userId) => api.get(`/profile/public/${userId}`),
};

export const applicationsApi = {
  create: (data) => axios.post(`${API_URL}/api/applications`, data), // Support bid_amount_paise, proposal_message
  getWorkerApplications: () => axios.get(`${API_URL}/api/applications/worker`),
  getJobApplications: (jobId) => axios.get(`${API_URL}/api/applications/job/${jobId}`),
  updateStatus: (appId, status) => axios.patch(`${API_URL}/api/applications/${appId}/status`, { status }),
};

export const profileApi = {
  getWorkerProfile: () => api.get('/worker/profile'),
  updateWorkerProfile: (data) => api.post('/worker/profile', data),
  getEmployerProfile: () => api.get('/employer/profile'),
  updateEmployerProfile: (data) => api.post('/employer/profile', data),
  updateStatus: (isOnline) => api.patch('/worker/status', { is_online: isOnline }),
  trackView: (targetId) => api.post('/worker/track-view', { target_id: targetId }),
  getWorkerStats: () => api.get('/worker/stats'),
};

// ==================== BILATERAL RATINGS ====================
export const bilateralRatingsApi = {
  create: (data) => api.post('/ratings/bilateral', data),
  getForUser: (userId) => api.get(`/ratings/bilateral/${userId}`),
  reply: (ratingId, reply) => api.post(`/ratings/bilateral/${ratingId}/reply?reply=${encodeURIComponent(reply)}`),
};

// ==================== BID SUGGESTION ====================
export const bidSuggestionApi = {
  get: (jobId) => api.get(`/bid-suggestion/${jobId}`),
};

// ==================== FRAUD DETECTION ====================
export const fraudApi = {
  report: (data) => api.post('/fraud/report', data),
  scanJob: (jobId) => api.post(`/fraud/scan-job/${jobId}`),
  checkProfile: (userId) => api.get(`/fraud/profile-check/${userId}`),
};

// ==================== JOBS ====================
export const jobsApi = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  getRecommended: () => api.get('/jobs/recommended'),
  save: (jobId) => api.post('/jobs/save', { job_id: jobId }),
  unsave: (jobId) => api.delete(`/jobs/save/${jobId}`),
  getSaved: () => api.get('/jobs/saved'),
  getEmployerJobs: () => api.get('/jobs/employer'),
};

// ==================== EMPLOYER ANALYTICS ====================
export const analyticsApi = {
  getEmployer: () => api.get('/analytics/employer'),
};

export default api;
