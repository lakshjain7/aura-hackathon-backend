import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('aura_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aura_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Complaint APIs ──
export const submitComplaint = (data) =>
  api.post('/api/complaint', data)

export const getComplaint = (id) =>
  api.get(`/api/complaint/${id}`)

export const getMyComplaints = (userId) =>
  api.get(`/api/complaints?user_id=${userId}`)

export const correctComplaint = (id, data) =>
  api.post(`/api/complaint/${id}/correction`, data)

export const reassignComplaint = (id, data) =>
  api.post(`/api/complaint/${id}/reassign`, data)

// ── Officer APIs ──
export const getOfficerAssignments = (officerId) =>
  api.get(`/api/officer/${officerId}/assignments`)

export const startComplaint = (officerId, complaintId) =>
  api.post(`/api/officer/${officerId}/start/${complaintId}`)

export const pingGPS = (data) =>
  api.post('/api/tracking/ping', data)

export const submitCheckpoint = (data) =>
  api.post('/api/tracking/checkpoint', data)

export const getLiveGPS = (complaintId) =>
  api.get(`/api/tracking/live/${complaintId}`)

// ── Admin APIs ──
export const getAdminStats = () =>
  api.get('/api/admin/stats')

export const getClusters = () =>
  api.get('/api/clusters')

export const sendClusterAlert = (clusterId) =>
  api.post(`/api/clusters/${clusterId}/alert`)

export const getAuditLogs = () =>
  api.get('/api/audit-logs')

// ── Auth APIs ──
export const requestOTP = (phone) =>
  api.post('/api/auth/request-otp', { phone })

export const verifyOTP = (data) =>
  api.post('/api/auth/verify-otp', data)

export const login = verifyOTP
export const register = (data) => api.post('/api/auth/register', data)

export const getUserProfile = () =>
  api.get('/api/user/profile')

// ── Audio ──
export const transcribeAudio = (formData) =>
  api.post('/api/sarvam/translate-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── SSE Stream ──
export const createComplaintStream = (complaintId) => {
  const token = localStorage.getItem('aura_token')
  return new EventSource(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/stream/complaint/${complaintId}?token=${token}`
  )
}
