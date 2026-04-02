/**
 * Parses API error responses into a human-readable string.
 * Handles FastAPI/Pydantic validation errors (422) which are arrays of objects.
 * 
 * @param {any} error The error object from axios/api call
 * @param {string} fallback Default message if parsing fails
 * @returns {string}
 */
export const parseApiError = (error, fallback = 'Something went blank. Please try again.') => {
  if (!error) return fallback;

  // Handle axios error response
  const detail = error.response?.data?.detail;

  if (!detail) {
    return error.message || fallback;
  }

  // If detail is a string, return it
  if (typeof detail === 'string') {
    return detail;
  }

  // If detail is an array (FastAPI validation errors)
  if (Array.isArray(detail)) {
    // Extract the message from each validation error object
    // Pydantic v2 format: { type, loc, msg, input, url }
    return detail.map(err => {
      const field = err.loc ? err.loc[err.loc.length - 1] : '';
      return field ? `${field}: ${err.msg}` : err.msg;
    }).join(', ');
  }

  // If detail is an object (but not an array)
  if (typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return fallback;
};
