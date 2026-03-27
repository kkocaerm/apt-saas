import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Units from './pages/Units'
import Dues from './pages/Dues'
import Expenses from './pages/Expenses'
import Announcements from './pages/Announcements'
import Complaints from './pages/Complaints'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Residents from './pages/Residents'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="units" element={<Units />} />
        <Route path="residents" element={<Residents />} />
        <Route path="dues" element={<Dues />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
