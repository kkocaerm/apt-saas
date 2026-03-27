import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Building2, LayoutDashboard, Home, Users, CreditCard,
  TrendingUp, Bell, MessageSquare, FileText, BarChart3,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Gösterge Paneli' },
  { to: '/units',         icon: Home,            label: 'Daireler' },
  { to: '/residents',     icon: Users,           label: 'Sakinler' },
  { to: '/dues',          icon: CreditCard,      label: 'Aidatlar' },
  { to: '/expenses',      icon: TrendingUp,      label: 'Gider & Gelir' },
  { to: '/announcements', icon: Bell,            label: 'Duyurular' },
  { to: '/complaints',    icon: MessageSquare,   label: 'Şikayetler' },
  { to: '/documents',     icon: FileText,        label: 'Belgeler' },
  { to: '/reports',       icon: BarChart3,       label: 'Raporlar' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-5'}`}
      style={{ background: 'var(--surface)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}>
          <Building2 size={18} className="text-white" />
        </div>
        <div className="overflow-hidden">
          <div className="font-black text-base tracking-tight leading-none">ApartmanPro</div>
          <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>YÖNETİM SİSTEMİ</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <div className="section-title px-3 mt-2">Menü</div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'rgba(14,165,233,0.15)', color: 'var(--accent)' }
              : { color: 'var(--text-muted)' }
            }>
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? '' : 'group-hover:text-accent'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(14,165,233,0.2)', color: 'var(--accent)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold truncate">{user?.full_name}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? 'Yönetici' : 'Sakin'}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full justify-center text-xs py-2">
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r" style={{ borderColor: 'var(--border)' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r" style={{ borderColor: 'var(--border)' }}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-muted)' }}>
            <Menu size={22} />
          </button>
          <span className="font-bold">ApartmanPro</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
