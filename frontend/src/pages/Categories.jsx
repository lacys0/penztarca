// src/pages/Categories.jsx
import { useState } from 'react'
import { categoriesAPI } from '../api'
import { useFetch, useToast } from '../hooks'
import { ConfirmModal }   from '../components/ui/ConfirmModal'
import { PageSpinner }    from '../components/ui/Spinner'
import { ToastContainer } from '../components/ui/Toast'
import { getErrorMessage } from '../utils'

const COLORS = [
  '#1D9E75','#185FA5','#BA7517','#993556','#3B6D11',
  '#A32D2D','#534AB7','#D85A30','#888780','#0891b2',
]

const EMPTY_FORM = { name: '', color: '#1D9E75', icon: 'ti-tag' }

export default function Categories() {
  const toast = useToast()
  const { data: cats, loading, refetch } = useFetch(() => categoriesAPI.list())

  const [form,     setForm]     = useState(EMPTY_FORM)
  const [editing,  setEditing]  = useState(null)   // null = új, obj = szerkesztés
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon || 'ti-tag' })
    setError('')
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('A kategória neve nem lehet üres.')
    if (form.name.trim().length < 2) return setError('A kategória neve legalább 2 karakter legyen.')
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await categoriesAPI.update(editing.id, form)
        toast.show('Kategória módosítva!')
      } else {
        await categoriesAPI.create(form)
        toast.show('Kategória létrehozva!')
      }
      setShowForm(false)
      refetch()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await categoriesAPI.remove(deleting.id)
      toast.show('Kategória törölve')
      setDeleting(null)
      refetch()
    } catch {
      toast.show('Törlés sikertelen (lehet, hogy tranzakció tartozik hozzá)', 'error')
    }
  }

  if (loading) return <PageSpinner />

  const global = cats?.filter(c => !c.user_id) ?? []
  const own    = cats?.filter(c =>  c.user_id) ?? []

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kategóriák</h1>
        <button onClick={openNew} className="btn-primary">+ Új kategória</button>
      </div>

      {/* Saját kategóriák */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Saját kategóriák ({own.length})
        </h2>
        {own.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-400">
            Még nincs saját kategóriád. Hozz létre egyet!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {own.map(c => (
              <CategoryCard
                key={c.id}
                cat={c}
                editable
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Globális kategóriák */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Rendszer kategóriák ({global.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {global.map(c => <CategoryCard key={c.id} cat={c} />)}
        </div>
      </section>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold">
                {editing ? 'Kategória szerkesztése' : 'Új kategória'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <form onSubmit={save} noValidate className="p-5 space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Név *</label>
                <input
                  required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="pl. Lakás"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Szín</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition border-2 ${
                        form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-full cursor-pointer border-0"
                    title="Egyéni szín"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Mégse</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Mentés...' : editing ? 'Mentés' : 'Létrehozás'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Kategória törlése"
        message={`Biztosan törlöd: „${deleting?.name}"? A hozzá tartozó tranzakciók kategória nélkül maradnak.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function CategoryCard({ cat, editable, onEdit, onDelete }) {
  return (
    <div className="card p-4 flex items-center gap-3 group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ background: cat.color }}
      >
        {cat.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{cat.name}</div>
        <div className="text-xs text-gray-400">{cat.user_id ? 'Saját' : 'Rendszer'}</div>
      </div>
      {editable && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-xs">
            ✎
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-gray-400 hover:text-red-500 text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
