import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, X, User, Mail, Phone } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function AddResidentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'resident' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/auth/register', form)
      toast.success('Sakin eklendi')
      onSave()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata oluştu')
    } finally { setSaving(false) }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-bold">Yeni Sakin Ekle</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ad Soyad *</label>
            <input className="input" {...f('full_name')} required />
          </div>
          <div>
            <label className="label">E-posta *</label>
            <input className="input" type="email" {...f('email')} required />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" {...f('phone')} placeholder="+90 5XX XXX XX XX" />
          </div>
          <div>
            <label className="label">Şifre *</label>
            <input className="input" type="password" {...f('password')} required minLength={6} />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" {...f('role')}>
              <option value="resident">Sakin</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Residents() {
  const [residents, setResidents] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => api.get('/api/units/residents/').then(r => setResidents(r.data)).finally(() => setLoading(false))
  useEffect(load, [])

  const filtered = residents.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Sakinler</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{residents.length} sakin kayıtlı</p></div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Sakin Ekle</button>
      </div>

      <div className="card py-3">
        <input className="input" placeholder="İsim veya e-posta ile ara…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        : filtered.length === 0 ? <div className="empty-state"><Users size={48} style={{ color: 'var(--surface3)' }} /><p>Sakin bulunamadı</p></div>
        : <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Sakin', 'E-posta', 'Telefon', 'Rol', 'Kayıt Tarihi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--accent)' }}>
                        {r.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                      {r.role === 'admin' ? 'Yönetici' : 'Sakin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(r.created_at), 'd MMM yyyy', { locale: tr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {modal && <AddResidentModal onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />}
    </div>
  )
}
