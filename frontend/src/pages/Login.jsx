import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Building2, Lock, Mail, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@apartman.com')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Giriş başarılı!')
      navigate('/dashboard')
    } catch {
      toast.error('E-posta veya şifre hatalı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#0ea5e9 1px,transparent 1px),linear-gradient(90deg,#0ea5e9 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />

      <div className="w-full max-w-md animate-fade">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}>
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">ApartmanPro</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yönetim Sistemi</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold mb-1">Giriş Yap</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Yönetici panelinize erişin</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@apartman.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl text-xs" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
            <strong className="text-white">Demo Hesap:</strong><br />
            admin@apartman.com / admin123
          </div>
        </div>
      </div>
    </div>
  )
}
