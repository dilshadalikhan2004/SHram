const api = require('./api');

const jobsApi = {
  updateStatus: (jobId, status) => api.patch(`/jobs/${jobId}/status`, { status }),
  // existing methods...
};

module.exports = jobsApi;