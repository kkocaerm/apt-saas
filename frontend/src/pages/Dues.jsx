import { useEffect, useState } from 'react'
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, Zap, FileText, Filter } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const STATUS_MAP = {
  paid: { label: 'Ödendi', cls: 'badge-green', icon: CheckCircle, color: '#10b981' },
  pending: { label: 'Bekliyor', cls: 'badge-yellow', icon: Clock, color: '#f59e0b' },
  overdue: { label: 'Gecikmiş', cls: 'badge-red', icon: AlertCircle, color: '#ef4444' },
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

export default function Dues() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dues, setDues] = useState([])
  const [summary, setSummary] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/api/dues/?year=${year}&month=${month}${filterStatus ? `&status=${filterStatus}` : ''}`),
      api.get(`/api/dues/summary/monthly?year=${year}&month=${month}`)
    ]).then(([d, s]) => { setDues(d.data); setSummary(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [year, month, filterStatus])

  const generate = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post(`/api/dues/generate/${year}/${month}`)
      toast.success(data.message)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    } finally { setGenerating(false) }
  }

  const markPaid = async (id) => {
    await api.put(`/api/dues/${id}/status`, { status: 'paid' })
    toast.success('Ödeme kaydedildi ✓')
    load()
  }

  const markOverdue = async (id) => {
    await api.put(`/api/dues/${id}/status`, { status: 'overdue' })
    toast.success('Gecikmiş olarak işaretlendi')
    load()
  }

  const downloadInvoice = async (id) => {
    try {
      const res = await api.get(`/api/documents/generate-invoice/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `aidat_${id}.pdf`; a.click()
      toast.success('Fatura indiriliyor')
    } catch { toast.error('Fatura oluşturulamadı') }
  }

  const filtered = filterStatus ? dues.filter(d => d.status === filterStatus) : dues

  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Aidat Yönetimi</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Aylık aidat takip ve tahsilat</p>
        </div>
        <button onClick={generate} disabled={generating} className="btn-primary">
          <Zap size={16} />
          {generating ? 'Oluşturuluyor…' : 'Aidatları Oluştur'}
        </button>
      </div>

      {/* Period selector */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="label mb-0">Yıl:</label>
            <select className="input w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="label mb-0">Ay:</label>
            <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tümü</option>
              <option value="pending">Bekliyor</option>
              <option value="paid">Ödendi</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Beklenen', value: summary.total_expected, color: '#94a3b8' },
            { label: 'Tahsil', value: summary.collected, color: '#10b981' },
            { label: 'Bekleyen', value: summary.pending, color: '#f59e0b' },
            { label: 'Gecikmiş', value: summary.overdue, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card py-4">
              <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="text-2xl font-black font-mono" style={{ color: s.color }}>₺{s.value.toLocaleString('tr-TR')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Collection rate bar */}
      {summary && (
        <div className="card py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Tahsilat Oranı</span>
            <span className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>%{summary.collection_rate}</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'var(--surface3)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${summary.collection_rate}%`, background: summary.collection_rate > 80 ? '#10b981' : summary.collection_rate > 50 ? '#f59e0b' : '#ef4444' }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>{summary.paid_count} / {summary.total_records} daire</span>
            <span>{MONTHS[month - 1]} {year}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Daire', 'Sakin', 'Tutar', 'Son Ödeme', 'Durum', 'İşlem'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yükleniyor…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <CreditCard size={40} style={{ color: 'var(--surface3)' }} />
                    <p>Bu döneme ait aidat kaydı yok</p>
                    <button onClick={generate} className="btn-primary text-sm"><Zap size={14} />Aidatları Oluştur</button>
                  </div>
                </td></tr>
              ) : filtered.map(d => {
                const s = STATUS_MAP[d.status]
                const Icon = s.icon
                return (
                  <tr key={d.id} className="table-row">
                    <td className="px-4 py-3 font-bold">No: {d.unit?.number}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{d.unit?.resident?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold">₺{d.amount.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {d.due_date ? format(new Date(d.due_date), 'd MMM yyyy', { locale: tr }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.cls}`}>
                        <Icon size={11} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {d.status !== 'paid' && (
                          <button onClick={() => markPaid(d.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            Öde
                          </button>
                        )}
                        {d.status === 'pending' && (
                          <button onClick={() => markOverdue(d.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            Gecik
                          </button>
                        )}
                        <button onClick={() => downloadInvoice(d.id)}
                          className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }} title="PDF İndir">
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
