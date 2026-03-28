import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
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

function SidebarContent({ onNavClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="flex flex-col h-full p-4"
      style={{ background: 'var(--surface)', minHeight: '100%' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}>
          <Building2 size={18} color="white" />
        </div>
        <div>
          <div className="font-black text-base tracking-tight leading-none" style={{ color: 'var(--text)' }}>ApartmanPro</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>YÖNETİM SİSTEMİ</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 12px', marginBottom: 8 }}>
          Menü
        </div>
        {nav.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
                background: isActive ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="flex-shrink-0" style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(14,165,233,0.2)', color: 'var(--accent)',
            fontSize: 13, fontWeight: 700, flexShrink: 0
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'Y'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Yönetici'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? 'Yönetici' : 'Sakin'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 16px' }}
        >
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Desktop sidebar — always visible on lg+ */}
      <div style={{
        width: 256,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column'
      }}
        className="hidden lg:flex">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="lg:hidden">
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
            borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column'
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', zIndex: 1 }}
            >
              <X size={20} />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <div
          className="lg:hidden"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)', flexShrink: 0
          }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-muted)' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: 700 }}>ApartmanPro</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}
          className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
