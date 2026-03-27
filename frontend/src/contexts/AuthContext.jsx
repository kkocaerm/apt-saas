import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('full_name')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser({ token, role, full_name: name })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('full_name', data.full_name)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    setUser({ token: data.access_token, role: data.role, full_name: data.full_name })
    return data
  }

  const logout = () => {
    localStorage.clear()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
