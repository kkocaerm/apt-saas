import { useEffect, useState } from 'react'
import { FileText, Upload, Download, Trash2, X, File } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const CATS = ['invoice', 'minutes', 'contract', 'other']
const CAT_LABELS = { invoice: 'Fatura', minutes: 'Toplantı Tutanağı', contract: 'Sözleşme', other: 'Diğer' }
const CAT_COLORS = { invoice: '#f59e0b', minutes: '#0ea5e9', contract: '#8b5cf6', other: '#94a3b8' }

function UploadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'other' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Dosya seçiniz')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', file)
      await api.post('/api/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Belge yüklendi')
      onSave()
    } catch { toast.error('Yükleme başarısız') } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-bold">Belge Yükle</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Başlık *</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Açıklama</label>
            <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Dosya *</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? '' : ''}`}
              style={{ borderColor: file ? 'var(--accent)' : 'var(--border)', background: file ? 'rgba(14,165,233,0.05)' : 'transparent' }}
              onClick={() => document.getElementById('fileInput').click()}>
              <input id="fileInput" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
              {file ? (
                <div>
                  <File size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Dosya seçmek için tıklayın</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, DOC, XLS, JPG, PNG</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving || !file}>
              {saving ? 'Yükleniyor…' : 'Yükle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [modal, setModal] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get(`/api/documents/${filterCat ? `?category=${filterCat}` : ''}`)
      .then(r => setDocs(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [filterCat])

  const del = async (id) => {
    if (!confirm('Belgeyi silmek istediğinize emin misiniz?')) return
    await api.delete(`/api/documents/${id}`)
    toast.success('Belge silindi')
    load()
  }

  const download = async (id, title) => {
    try {
      const res = await api.get(`/api/documents/download/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = title; a.click()
    } catch { toast.error('İndirme başarısız') }
  }

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Belgeler</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{docs.length} belge</p></div>
        <button className="btn-primary" onClick={() => setModal(true)}><Upload size={16} />Belge Yükle</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCat('')} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={!filterCat ? { background: 'rgba(14,165,233,0.2)', color: 'var(--accent)' } : { background: 'var(--surface2)', color: 'var(--text-muted)' }}>
          Tümü
        </button>
        {CATS.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={filterCat === c ? { background: `${CAT_COLORS[c]}20`, color: CAT_COLORS[c] } : { background: 'var(--surface2)', color: 'var(--text-muted)' }}>
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        : docs.length === 0 ? <div className="empty-state"><FileText size={48} style={{ color: 'var(--surface3)' }} /><p>Belge yok</p></div>
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map(d => (
            <div key={d.id} className="card group hover:border-blue-500/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${CAT_COLORS[d.category] || '#94a3b8'}20` }}>
                  <FileText size={18} style={{ color: CAT_COLORS[d.category] || '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{d.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge text-[10px]" style={{ background: `${CAT_COLORS[d.category] || '#94a3b8'}20`, color: CAT_COLORS[d.category] || '#94a3b8' }}>
                      {CAT_LABELS[d.category] || 'Diğer'}
                    </span>
                    {d.file_size && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{(d.file_size / 1024).toFixed(1)} KB</span>}
                  </div>
                  {d.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{d.description}</p>}
                  <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(d.created_at), 'd MMM yyyy', { locale: tr })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => download(d.id, d.title)} className="btn-ghost flex-1 justify-center py-2 text-xs">
                  <Download size={13} /> İndir
                </button>
                <button onClick={() => del(d.id)} className="btn-danger px-3 py-2 text-xs"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      }

      {modal && <UploadModal onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />}
    </div>
  )
}
