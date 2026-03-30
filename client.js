import axios from 'axios'

// Öncelik sırası:
// 1. public/config.js → window.__API_BASE_URL__ (rebuild gerektirmez)
// 2. Vite env var → import.meta.env.VITE_API_URL (build sırasında set edilmeli)
// 3. Boş string → Vite dev proxy devreye girer (sadece local)
const BASE =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  import.meta.env.VITE_API_URL ||
  ''

console.log('[API] Base URL:', BASE || '(relative / dev proxy)')

const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
