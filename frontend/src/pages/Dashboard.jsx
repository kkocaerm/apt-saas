import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Building2, Users, CreditCard, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import api from '../api/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ icon: Icon, label, value, sub, color = '#0ea5e9', trend }) {
  return (
    <div className="stat-card animate-fade">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          <div className="text-3xl font-black tracking-tight">{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t flex items-center gap-1 text-xs" style={{ borderColor: 'var(--border)' }}>
          {trend >= 0
            ? <TrendingUp size={12} style={{ color: '#10b981' }} />
            : <TrendingDown size={12} style={{ color: '#ef4444' }} />}
          <span style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>{Math.abs(trend)}%</span>
          <span style={{ color: 'var(--text-muted)' }}>geçen aya göre</span>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 text-sm shadow-xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span className="font-medium">₺{Number(p.value).toLocaleString('tr-TR')}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [txSummary, setTxSummary] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/reports/summary'),
      api.get('/api/reports/dues-trend'),
      api.get('/api/transactions/summary'),
      api.get('/api/announcements/'),
      api.get('/api/complaints/?status=open'),
    ]).then(([s, t, tx, ann, comp]) => {
      setSummary(s.data)
      setTrend(t.data)
      setTxSummary(tx.data)
      setAnnouncements(ann.data.slice(0, 3))
      setComplaints(comp.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const now = new Date()
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {format(now, 'EEEE, d MMMM yyyy', { locale: tr })}
          </div>
          <h1 className="page-title">Gösterge Paneli</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Sistem Aktif
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Toplam Daire" value={summary?.total_units ?? 0}
          sub={`${summary?.occupied_units ?? 0} dolu`} color="#0ea5e9" />
        <StatCard icon={Users} label="Sakin" value={summary?.total_residents ?? 0}
          sub="aktif sakin" color="#10b981" />
        <StatCard icon={CreditCard} label="Tahsilat Oranı"
          value={`%${summary?.collection_rate ?? 0}`}
          sub={`₺${(summary?.monthly_dues_collected ?? 0).toLocaleString('tr-TR')} / ₺${(summary?.monthly_dues_expected ?? 0).toLocaleString('tr-TR')}`}
          color="#f59e0b" />
        <StatCard icon={TrendingUp} label="Bakiye"
          value={`₺${(summary?.balance ?? 0).toLocaleString('tr-TR')}`}
          sub="tüm zamanlar" color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dues trend */}
        <div className="card lg:col-span-2">
          <div className="section-title">Aidat Tahsilat Trendi</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Beklenen" stroke="#475569" fill="url(#totalGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="paid" name="Tahsil" stroke="#0ea5e9" fill="url(#paidGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense categories */}
        <div className="card">
          <div className="section-title">Gider Dağılımı</div>
          {txSummary?.expense_by_category?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={txSummary.expense_by_category} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {txSummary.expense_by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₺${v.toLocaleString('tr-TR')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {txSummary.expense_by_category.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: 'var(--text-muted)' }}>{c.category}</span>
                    </div>
                    <span className="font-medium">₺{c.amount.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state text-sm">
              <TrendingDown size={32} style={{ color: 'var(--surface3)' }} />
              Gider kaydı yok
            </div>
          )}
        </div>
      </div>

      {/* Income/Expense bar chart */}
      {txSummary?.monthly?.length > 0 && (
        <div className="card">
          <div className="section-title">Aylık Gelir / Gider</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={txSummary.monthly} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="card">
          <div className="section-title">Son Duyurular</div>
          {announcements.length === 0 ? (
            <div className="empty-state text-sm"><Bell size={28} style={{ color: 'var(--surface3)' }} />Duyuru yok</div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface2)' }}>
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${a.is_urgent ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.content}</div>
                    <div className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(a.created_at), 'd MMM yyyy', { locale: tr })}
                    </div>
                  </div>
                  {a.is_urgent && <span className="badge badge-red flex-shrink-0 text-[10px]">ACİL</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints */}
        <div className="card">
          <div className="section-title">Açık Şikayetler</div>
          {complaints.length === 0 ? (
            <div className="empty-state text-sm"><CheckCircle size={28} style={{ color: '#10b981' }} />Açık şikayet yok</div>
          ) : (
            <div className="space-y-2">
              {complaints.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl table-row"
                  style={{ background: 'var(--surface2)', borderColor: 'transparent' }}>
                  <AlertCircle size={16} style={{ color: c.priority === 'high' ? '#ef4444' : '#f59e0b' }} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.resident?.full_name} · {format(new Date(c.created_at), 'd MMM', { locale: tr })}
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 text-[10px] ${
                    c.priority === 'high' ? 'badge-red' : c.priority === 'low' ? 'badge-gray' : 'badge-yellow'
                  }`}>{c.priority === 'high' ? 'Yüksek' : c.priority === 'low' ? 'Düşük' : 'Normal'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
