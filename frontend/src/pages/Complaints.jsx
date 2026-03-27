import { useEffect, useState } from 'react'
import { MessageSquare, Plus, ChevronDown, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const STATUS_MAP = {
  open: { label: 'Açık', cls: 'badge-red', icon: AlertCircle },
  in_progress: { label: 'İşlemde', cls: 'badge-yellow', icon: Clock },
  resolved: { label: 'Çözüldü', cls: 'badge-green', icon: CheckCircle },
}

function ResponseModal({ complaint, onClose, onSave }) {
  const [response, setResponse] = useState(complaint.admin_response || '')
  const [status, setStatus] = useState(complaint.status)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/api/complaints/${complaint.id}`, { status, admin_response: response })
      toast.success('Yanıt kaydedildi')
      onSave()
    } catch { toast.error('Hata') } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">Şikayet Yanıtla</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--surface2)' }}>
          <div className="text-xs uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Şikayet</div>
          <div className="font-semibold">{complaint.title}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{complaint.description}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{complaint.resident?.full_name}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Durum</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
            </select>
          </div>
          <div>
            <label className="label">Yönetici Yanıtı</label>
            <textarea className="input min-h-[100px] resize-none" value={response} onChange={e => setResponse(e.target.value)} placeholder="Sakinlere iletilecek yanıt…" />
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

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get(`/api/complaints/${filterStatus ? `?status=${filterStatus}` : ''}`)
      .then(r => setComplaints(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [filterStatus])

  const del = async (id) => {
    if (!confirm('Şikayeti silmek istediğinize emin misiniz?')) return
    await api.delete(`/api/complaints/${id}`)
    toast.success('Silindi')
    load()
  }

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Şikayetler</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{complaints.length} şikayet</p>
        </div>
        <div className="flex gap-2">
          {[['', 'Tümü'], ['open', 'Açık'], ['in_progress', 'İşlemde'], ['resolved', 'Çözüldü']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={filterStatus === val ? { background: 'rgba(14,165,233,0.2)', color: 'var(--accent)' } : { background: 'var(--surface2)', color: 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        : complaints.length === 0 ? <div className="empty-state"><MessageSquare size={48} style={{ color: 'var(--surface3)' }} /><p>Şikayet yok</p></div>
        : <div className="space-y-3">
          {complaints.map(c => {
            const s = STATUS_MAP[c.status]
            const Icon = s.icon
            return (
              <div key={c.id} className="card hover:border-blue-500/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${s.cls}`}><Icon size={11} />{s.label}</span>
                      <span className={`badge ${c.priority === 'high' ? 'badge-red' : c.priority === 'low' ? 'badge-gray' : 'badge-yellow'} text-[10px]`}>
                        {c.priority === 'high' ? 'Yüksek' : c.priority === 'low' ? 'Düşük' : 'Normal'}
                      </span>
                      {c.category && <span className="badge badge-blue text-[10px]">{c.category}</span>}
                    </div>
                    <h3 className="font-bold text-sm">{c.title}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                    {c.admin_response && (
                      <div className="mt-2 p-3 rounded-lg text-sm" style={{ background: 'var(--surface2)', borderLeft: '2px solid var(--accent)' }}>
                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--accent)' }}>Yönetici Yanıtı: </span>
                        {c.admin_response}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{c.resident?.full_name ?? '—'}</span>
                      <span>·</span>
                      <span>{format(new Date(c.created_at), 'd MMM yyyy', { locale: tr })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setSelected(c)} className="btn-ghost text-xs py-1.5">Yanıtla</button>
                    <button onClick={() => del(c.id)} className="btn-danger p-2"><X size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      }

      {selected && <ResponseModal complaint={selected} onClose={() => setSelected(null)} onSave={() => { setSelected(null); load() }} />}
    </div>
  )
}
