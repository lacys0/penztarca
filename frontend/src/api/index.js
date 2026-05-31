import api from './axios'

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
}

// ── Me / Settings ─────────────────────────────────────────────────────────
export const meAPI = {
  getProfile:     ()     => api.get('/me'),
  updateSettings: (data) => api.put('/me/settings', data),
}

// ── Transactions ──────────────────────────────────────────────────────────
export const transactionsAPI = {
  list:   (params) => api.get('/transactions', { params }),
  get:    (id)     => api.get(`/transactions/${id}`),
  create: (data)   => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id)     => api.delete(`/transactions/${id}`),
}

// ── Categories ─────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   ()         => api.get('/categories'),
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id)       => api.delete(`/categories/${id}`),
}

// ── Stats ─────────────────────────────────────────────────────────────────
export const statsAPI = {
  monthly: (month) => api.get('/stats/monthly', { params: { month } }),
  trend:   ()      => api.get('/stats/trend'),
}

// ── Recurring Transactions ────────────────────────────────────────────────
export const recurringAPI = {
  list:     ()         => api.get('/recurring'),
  create:   (data)     => api.post('/recurring', data),
  update:   (id, data) => api.put(`/recurring/${id}`, data),
  remove:   (id)       => api.delete(`/recurring/${id}`),
  generate: ()         => api.post('/recurring/generate'),
}
