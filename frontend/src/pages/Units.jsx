import { useEffect, useState } from 'react'
import { Home, Plus, Edit2, Trash2, User, X } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'

function UnitModal({ unit, buildings, residents, onClose, onSave }) {
  const [form, setForm] = useState(unit || { number: '', floor: '', type: '2+1', area_m2: '', monthly_dues: 600, building_id: buildings[0]?.id || '', resident_id: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (unit) {
        await api.put(`/api/units/${unit.id}`, { monthly_dues: Number(form.monthly_dues), resident_id: form.resident_id || null, type: form.type, area_m2: Number(form.area_m2) || null })
        toast.success('Daire güncellendi')
      } else {
        await api.post('/api/units/', { ...form, floor: Number(form.floor) || null, area_m2: Number(form.area_m2) || null, monthly_dues: Number(form.monthly_dues), building_id: Number(form.building_id) })
        toast.success('Daire eklendi')
      }
      onSave()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{unit ? 'Daireyi Düzenle' : 'Yeni Daire Ekle'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daire No *</label>
              <input className="input" {...f('number')} required disabled={!!unit} />
            </div>
            <div>
              <label className="label">Kat</label>
              <input className="input" type="number" {...f('floor')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tip</label>
              <select className="input" {...f('type')}>
                {['1+1','2+1','3+1','4+1','Dubleks','Stüdyo'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Alan (m²)</label>
              <input className="input" type="number" {...f('area_m2')} />
            </div>
          </div>
          <div>
            <label className="label">Aylık Aidat (₺)</label>
            <input className="input" type="number" {...f('monthly_dues')} required />
          </div>
          {!unit && (
            <div>
              <label className="label">Bina</label>
              <select className="input" {...f('building_id')}>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Sakin (opsiyonel)</label>
            <select className="input" {...f('resident_id')}>
              <option value="">— Boş —</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
            </select>
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

export default function Units() {
  const [units, setUnits] = useState([])
  const [buildings, setBuildings] = useState([])
  const [residents, setResidents] = useState([])
  const [modal, setModal] = useState(null) // null | 'add' | unit
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/api/units/'), api.get('/api/units/buildings/'), api.get('/api/units/residents/')])
      .then(([u, b, r]) => { setUnits(u.data); setBuildings(b.data); setResidents(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const del = async (id) => {
    if (!confirm('Bu daireyi silmek istediğinize emin misiniz?')) return
    await api.delete(`/api/units/${id}`)
    toast.success('Daire silindi')
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Daireler</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{units.length} daire kayıtlı</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={16} />Daire Ekle</button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {units.map(u => (
          <div key={u.id} className="card hover:border-blue-500/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: u.is_occupied ? 'rgba(14,165,233,0.15)' : 'rgba(148,163,184,0.1)' }}>
                  <Home size={18} style={{ color: u.is_occupied ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <div className="font-bold text-lg leading-tight">No: {u.number}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kat {u.floor ?? '—'} · {u.type ?? '—'}</div>
                </div>
              </div>
              <span className={`badge ${u.is_occupied ? 'badge-blue' : 'badge-gray'}`}>
                {u.is_occupied ? 'Dolu' : 'Boş'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Aidat</span>
                <span className="font-semibold font-mono">₺{u.monthly_dues.toLocaleString('tr-TR')}</span>
              </div>
              {u.area_m2 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Alan</span>
                  <span className="font-mono">{u.area_m2} m²</span>
                </div>
              )}
              {u.resident && (
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <User size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm truncate">{u.resident.full_name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="btn-ghost flex-1 justify-center py-2 text-xs" onClick={() => setModal(u)}>
                <Edit2 size={13} /> Düzenle
              </button>
              <button className="btn-danger flex-1 justify-center py-2 text-xs" onClick={() => del(u.id)}>
                <Trash2 size={13} /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <div className="empty-state">
          <Home size={48} style={{ color: 'var(--surface3)' }} />
          <p>Henüz daire eklenmedi</p>
          <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} />İlk Daireyi Ekle</button>
        </div>
      )}

      {modal && (
        <UnitModal
          unit={modal === 'add' ? null : modal}
          buildings={buildings}
          residents={residents}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
