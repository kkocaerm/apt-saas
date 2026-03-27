import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Plus, Trash2, X } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const EXPENSE_CATS = ['Elektrik', 'Su', 'Doğalgaz', 'Temizlik', 'Güvenlik', 'Bakım-Onarım', 'Asansör', 'Sigorta', 'Vergi', 'Diğer']
const INCOME_CATS = ['Aidat', 'Kira Geliri', 'Faiz', 'Diğer']

function TxModal({ onClose, onSave }) {
  const [form, setForm] = useState({ type: 'expense', category: EXPENSE_CATS[0], description: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const cats = form.type === 'expense' ? EXPENSE_CATS : INCOME_CATS

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/transactions/', { ...form, amount: Number(form.amount) })
      toast.success('İşlem kaydedildi')
      onSave()
    } catch { toast.error('Hata oluştu') } finally { setSaving(false) }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-bold">Yeni İşlem</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-3">
              {[['expense','Gider'],['income','Gelir']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm(p => ({ ...p, type: val, category: val === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0] }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.type === val ? '' : ''}`}
                  style={form.type === val
                    ? { background: val === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: val === 'expense' ? '#ef4444' : '#10b981', borderColor: val === 'expense' ? '#ef4444' : '#10b981' }
                    : { background: 'var(--surface2)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="input" {...f('category')}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Açıklama</label>
            <input className="input" {...f('description')} placeholder="Opsiyonel" />
          </div>
          <div>
            <label className="label">Tutar (₺) *</label>
            <input className="input" type="number" step="0.01" {...f('amount')} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Expenses() {
  const [txs, setTxs] = useState([])
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get(`/api/transactions/${filter ? `?type=${filter}` : ''}`)
      .then(r => setTxs(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filter])

  const del = async (id) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return
    await api.delete(`/api/transactions/${id}`)
    toast.success('Silindi')
    load()
  }

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gider & Gelir</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Apartman mali yönetimi</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />İşlem Ekle</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Gelir', value: totalIncome, color: '#10b981', icon: TrendingUp },
          { label: 'Toplam Gider', value: totalExpense, color: '#ef4444', icon: TrendingDown },
          { label: 'Net Bakiye', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? '#0ea5e9' : '#ef4444', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-2xl font-black font-mono" style={{ color: s.color }}>₺{s.value.toLocaleString('tr-TR')}</div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold">Filtre:</span>
          {[['','Tümü'],['income','Gelir'],['expense','Gider']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors`}
              style={filter === val
                ? { background: 'rgba(14,165,233,0.2)', color: 'var(--accent)' }
                : { background: 'var(--surface2)', color: 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Tutar', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yükleniyor…</td></tr>
                : txs.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state"><TrendingUp size={40} style={{ color: 'var(--surface3)' }} /><p>İşlem kaydı yok</p></div></td></tr>
                  : txs.map(t => (
                    <tr key={t.id} className="table-row">
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(t.date), 'd MMM yyyy', { locale: tr })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                          {t.type === 'income' ? 'Gelir' : 'Gider'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{t.category}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{t.description || '—'}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(t.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && <TxModal onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />}
    </div>
  )
}
