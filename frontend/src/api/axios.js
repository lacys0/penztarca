import axios from 'axios'

const api = axios.create({
  baseURL: '/api',          // Vite proxy átirányítja → localhost:4000/api
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: auto Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: 401 → kijelentkezés (kivéve auth végpontok) ───────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
