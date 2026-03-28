import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Building2, LayoutDashboard, Home, Users, CreditCard,
  TrendingUp, Bell, MessageSquare, FileText, BarChart3,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',     Icon: LayoutDashboard, label: 'Gösterge Paneli' },
  { to: '/units',         Icon: Home,            label: 'Daireler' },
  { to: '/residents',     Icon: Users,           label: 'Sakinler' },
  { to: '/dues',          Icon: CreditCard,      label: 'Aidatlar' },
  { to: '/expenses',      Icon: TrendingUp,      label: 'Gider & Gelir' },
  { to: '/announcements', Icon: Bell,            label: 'Duyurular' },
  { to: '/complaints',    Icon: MessageSquare,   label: 'Şikayetler' },
  { to: '/documents',     Icon: FileText,        label: 'Belgeler' },
  { to: '/reports',       Icon: BarChart3,       label: 'Raporlar' },
]

function SidebarInner({ onNav }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingLeft: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#f1f5f9', lineHeight: 1 }}>ApartmanPro</div>
          <div style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace', marginTop: 3, letterSpacing: '0.08em' }}>YÖNETİM SİSTEMİ</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', padding: '0 12px', marginBottom: 8 }}>Menü</div>
        {NAV.map(({ to, Icon, label }) => {
          const active = location.pathname === to
          return (
            <NavLink key={to} to={to} onClick={onNav}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
                background: active ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: active ? '#0ea5e9' : '#94a3b8',
              }}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={13} />}
            </NavLink>
          )
        })}
      </div>

      {/* User */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(14,165,233,0.2)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'Y'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Yönetici'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{user?.role === 'admin' ? 'Yönetici' : 'Sakin'}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const sidebarStyle = {
    width: 256, minWidth: 256, height: '100%',
    background: '#0f172a',
    borderRight: '1px solid rgba(148,163,184,0.12)',
    padding: '20px 16px', boxSizing: 'border-box', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0f1e', fontFamily: "'Syne', sans-serif" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={sidebarStyle}>
          <SidebarInner />
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)} />
          <div style={{ ...sidebarStyle, position: 'relative', zIndex: 1, height: '100vh' }}>
            <button onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <SidebarInner onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.12)', background: '#0f172a', flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
              <Menu size={22} />
            </button>
            <span style={{ fontWeight: 700, color: '#f1f5f9' }}>ApartmanPro</span>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px' }}>
          <Outlet />
        </div>
      </div>

    </div>
  )
}
