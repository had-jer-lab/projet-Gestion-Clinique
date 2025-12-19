import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// ========================
// PATIENTS API
// ========================

export const patientsAPI = {
  // Get all patients
  getAll: (searchQuery = '') => {
    const params = searchQuery ? { q: searchQuery } : {};
    return api.get('/patients', { params });
  },
  
  // Get specific patient
  getById: (id) => api.get(`/patients/${id}`),
  
  // Create new patient (with photo upload)
  create: (formData) => {
    return axios.post(`${API_BASE_URL}/patients`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update patient (with photo upload)
  update: (id, formData) => {
    return axios.put(`${API_BASE_URL}/patients/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete patient
  delete: (id) => api.delete(`/patients/${id}`),
  
  // Get patient's last RDV
  getLastRdv: (patientId) => api.get(`/patients/${patientId}/last-rdv`),
};

// ========================
// OBSERVATIONS API
// ========================

export const observationsAPI = {
  // Add observation to patient
  create: (patientId, data) => api.post(`/patients/${patientId}/observations`, data),
};

// ========================
// ORDONNANCES API
// ========================

export const ordonnancesAPI = {
  // Create ordonnance for patient
  create: (patientId, data) => api.post(`/patients/${patientId}/ordonnances`, data),
  
  // Get PDF for ordonnance
  getPDF: (patientId, ordId) => {
    return axios.get(`${API_BASE_URL}/patients/${patientId}/ordonnances/${ordId}/pdf`, {
      responseType: 'blob',
    });
  },
};

// ========================
// CONFIG API
// ========================

export const configAPI = {
  // Get external service URLs
  getConfig: () => api.get('/config'),
};

export default api;