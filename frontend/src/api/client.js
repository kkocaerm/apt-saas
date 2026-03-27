import axios from 'axios'

// Local dev: boş string → Vite proxy devreye girer
// Render prod: VITE_API_URL=https://apartman-backend.onrender.com
const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
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
