// ─── Announcements ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2, X, AlertCircle } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function AnnModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', content: '', is_urgent: false })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/announcements/', form)
      toast.success('Duyuru yayınlandı')
      onSave()
    } catch { toast.error('Hata') } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-bold">Yeni Duyuru</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Başlık *</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">İçerik *</label>
            <textarea className="input min-h-[120px] resize-none" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_urgent} onChange={e => setForm(p => ({ ...p, is_urgent: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium" style={{ color: form.is_urgent ? '#ef4444' : 'var(--text)' }}>🚨 Acil Duyuru</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>{saving ? 'Yayınlanıyor…' : 'Yayınla'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Announcements() {
  const [anns, setAnns] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/api/announcements/').then(r => setAnns(r.data)).finally(() => setLoading(false))
  useEffect(load, [])

  const del = async (id) => {
    if (!confirm('Duyuruyu silmek istediğinize emin misiniz?')) return
    await api.delete(`/api/announcements/${id}`)
    toast.success('Duyuru silindi')
    load()
  }

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Duyurular</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{anns.length} duyuru</p></div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Duyuru Ekle</button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        : anns.length === 0 ? <div className="empty-state"><Bell size={48} style={{ color: 'var(--surface3)' }} /><p>Duyuru yok</p></div>
        : <div className="space-y-4">
          {anns.map(a => (
            <div key={a.id} className={`card border-l-4 ${a.is_urgent ? '' : ''}`} style={{ borderLeftColor: a.is_urgent ? '#ef4444' : '#0ea5e9' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.is_urgent ? '' : ''}`}
                    style={{ background: a.is_urgent ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)' }}>
                    {a.is_urgent ? <AlertCircle size={16} style={{ color: '#ef4444' }} /> : <Bell size={16} style={{ color: 'var(--accent)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{a.title}</h3>
                      {a.is_urgent && <span className="badge badge-red text-[10px] flex-shrink-0">ACİL</span>}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{a.content}</p>
                    <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(a.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                    </div>
                  </div>
                </div>
                <button onClick={() => del(a.id)} className="btn-danger p-2 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      }
      {modal && <AnnModal onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />}
    </div>
  )
}

export default Announcements
