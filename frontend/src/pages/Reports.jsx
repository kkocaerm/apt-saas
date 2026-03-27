import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Users, Home, CreditCard, AlertCircle } from 'lucide-react'
import api from '../api/client'

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

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [txSummary, setTxSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/reports/summary'),
      api.get('/api/reports/dues-trend'),
      api.get('/api/transactions/summary'),
    ]).then(([s, t, tx]) => { setSummary(s.data); setTrend(t.data); setTxSummary(tx.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  const radialData = [{ name: 'Tahsilat', value: summary?.collection_rate || 0, fill: '#0ea5e9' }]
  const occupancyData = [{ name: 'Doluluk', value: summary?.total_units > 0 ? Math.round(summary.occupied_units / summary.total_units * 100) : 0, fill: '#10b981' }]

  return (
    <div className="space-y-8 animate-fade">
      <div>
        <h1 className="page-title">Raporlar & Analizler</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Apartman performans özeti</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Home, label: 'Toplam Daire', value: summary?.total_units, sub: `${summary?.occupied_units} dolu`, color: '#0ea5e9' },
          { icon: Users, label: 'Sakin', value: summary?.total_residents, sub: 'kayıtlı', color: '#10b981' },
          { icon: CreditCard, label: 'Aylık Beklenen', value: `₺${(summary?.monthly_dues_expected || 0).toLocaleString('tr-TR')}`, sub: 'bu ay', color: '#f59e0b' },
          { icon: AlertCircle, label: 'Açık Şikayet', value: summary?.open_complaints, sub: 'bekliyor', color: '#ef4444' },
        ].map(m => (
          <div key={m.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}20` }}>
                <m.icon size={16} style={{ color: m.color }} />
              </div>
            </div>
            <div className="text-2xl font-black">{m.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Radial charts row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Tahsilat Oranı', value: summary?.collection_rate, suffix: '%', data: radialData, color: '#0ea5e9' },
          { title: 'Doluluk Oranı', value: summary?.total_units > 0 ? Math.round(summary.occupied_units / summary.total_units * 100) : 0, suffix: '%', data: occupancyData, color: '#10b981' },
        ].map(r => (
          <div key={r.title} className="card col-span-1">
            <div className="section-title">{r.title}</div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <RadialBarChart width={96} height={96} innerRadius={28} outerRadius={44} data={r.data} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: 'var(--surface2)' }} dataKey="value" cornerRadius={4} />
                </RadialBarChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black">{r.value}{r.suffix}</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: r.color }}>{r.value}{r.suffix}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {r.color === '#0ea5e9' 
                    ? `₺${(summary?.monthly_dues_collected || 0).toLocaleString('tr-TR')} tahsil`
                    : `${summary?.occupied_units} / ${summary?.total_units} daire`}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Finance summary */}
        <div className="card sm:col-span-2">
          <div className="section-title">Mali Özet</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Toplam Gelir', value: txSummary?.total_income || 0, color: '#10b981' },
              { label: 'Toplam Gider', value: txSummary?.total_expense || 0, color: '#ef4444' },
              { label: 'Net Bakiye', value: txSummary?.balance || 0, color: (txSummary?.balance || 0) >= 0 ? '#0ea5e9' : '#ef4444' },
            ].map(f => (
              <div key={f.label} className="text-center">
                <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                <div className="text-xl font-black font-mono" style={{ color: f.color }}>
                  ₺{f.value.toLocaleString('tr-TR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dues trend chart */}
      <div className="card">
        <div className="section-title">Son 6 Ay Aidat Trendi</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="paidGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" name="Beklenen" stroke="#475569" fill="transparent" strokeWidth={2} strokeDasharray="4 2" />
            <Area type="monotone" dataKey="paid" name="Tahsil" stroke="#0ea5e9" fill="url(#paidGrad2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        {/* Rate table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Dönem', 'Beklenen', 'Tahsil', 'Tahsilat Oranı'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trend.map(t => (
                <tr key={t.label} className="table-row">
                  <td className="px-3 py-2 font-mono text-xs">{t.label}</td>
                  <td className="px-3 py-2 font-mono">₺{t.total.toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#10b981' }}>₺{t.paid.toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface3)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${t.rate}%`, background: t.rate > 80 ? '#10b981' : t.rate > 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-mono w-10 text-right">%{t.rate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly income/expense */}
      {txSummary?.monthly?.length > 0 && (
        <div className="card">
          <div className="section-title">Aylık Gelir / Gider Karşılaştırması</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={txSummary.monthly} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
