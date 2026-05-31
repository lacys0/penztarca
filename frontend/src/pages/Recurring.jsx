import { useState, useEffect } from 'react'
import { recurringAPI, categoriesAPI } from '../api'
import { ToastContainer } from '../components/ui/Toast'
import { ConfirmModal }   from '../components/ui/ConfirmModal'
import { PageSpinner }    from '../components/ui/Spinner'
import { formatCurrency, formatDate, getErrorMessage } from '../utils'
import { useToast } from '../hooks'

const FREQ_LABELS = {
  daily:   'Naponta',
  weekly:  'Hetente',
  monthly: 'Havonta',
  yearly:  'Évente',
}

const EMPTY = {
  type: 'expense', title: '', amount: '',
  category_id: '', frequency: 'monthly',
  next_due: new Date().toISOString().slice(0, 10), notes: '',
}

export default function Recurring() {
  const toast = useToast()
  const [items,    setItems]    = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function load() {
    setLoading(true)
    try {
      const [recRes, catRes] = await Promise.all([recurringAPI.list(), categoriesAPI.list()])
      setItems(recRes.data)
      setCats(catRes.data)
    } catch {
      toast.show('Betöltési hiba', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])  // eslint-disable-line

  async function generate() {
    try {
      const res = await recurringAPI.generate()
      if (res.data.generated > 0) {
        toast.show(`${res.data.generated} tranzakció létrehozva!`)
        load()
      } else {
        toast.show('Nincs esedékes tétel')
      }
    } catch {
      toast.show('Generálás sikertelen', 'error')
    }
  }

  function openNew() {
    setEditing(null); setForm(EMPTY); setError(''); setShowForm(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      type: item.type, title: item.title, amount: item.amount,
      category_id: item.category_id || '', frequency: item.frequency,
      next_due: item.next_due, notes: item.notes || '', active: item.active,
    })
    setError(''); setShowForm(true)
  }

  async function toggleActive(item) {
    try {
      await recurringAPI.update(item.id, { ...item, active: !item.active })
      load()
    } catch {
      toast.show('Hiba', 'error')
    }
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('A megnevezés nem lehet üres.')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Az összeg pozitív szám kell legyen.')
    if (!form.next_due) return setError('A következő dátum megadása kötelező.')
    setSaving(true); setError('')
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id || null }
      if (editing) {
        await recurringAPI.update(editing.id, payload)
        toast.show('Módosítva!')
      } else {
        await recurringAPI.create(payload)
        toast.show('Ismétlődő létrehozva!')
      }
      setShowForm(false); load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await recurringAPI.remove(deleting.id)
      toast.show('Törölve')
      setDeleting(null); load()
    } catch {
      toast.show('Törlés sikertelen', 'error')
    }
  }

  if (loading) return <PageSpinner />

  const active   = items.filter(i => i.active)
  const inactive = items.filter(i => !i.active)

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ismétlődő tranzakciók</h1>
        <div className="flex gap-2">
          <button onClick={generate} className="btn-ghost text-sm">⟳ Generálás</button>
          <button onClick={openNew}  className="btn-primary">+ Új</button>
        </div>
      </div>

      <div className="text-xs text-gray-400 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg">
        A „Generálás" gombra kattintva az esedékes ismétlődő tételek automatikusan bekerülnek a tranzakciók közé.
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-400">
          Még nincs ismétlődő tranzakció. Hozz létre egyet!
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Aktív ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map(item => (
                  <RecurringCard key={item.id} item={item}
                    onEdit={() => openEdit(item)}
                    onToggle={() => toggleActive(item)}
                    onDelete={() => setDeleting(item)} />
                ))}
              </div>
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Inaktív ({inactive.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {inactive.map(item => (
                  <RecurringCard key={item.id} item={item}
                    onEdit={() => openEdit(item)}
                    onToggle={() => toggleActive(item)}
                    onDelete={() => setDeleting(item)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold">
                {editing ? 'Szerkesztés' : 'Új ismétlődő tranzakció'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <form onSubmit={save} noValidate className="p-5 space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                {['expense', 'income'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      form.type === t
                        ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-brand-400 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                    {t === 'expense' ? '↓ Kiadás' : '↑ Bevétel'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Megnevezés *</label>
                <input name="title" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="pl. Netflix előfizetés" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Összeg (Ft) *</label>
                  <input type="number" min="1" required value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="4990" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gyakoriság *</label>
                  <select value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="input">
                    {Object.entries(FREQ_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Következő dátum *</label>
                  <input type="date" required value={form.next_due}
                    onChange={e => setForm(f => ({ ...f, next_due: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Kategória</label>
                  <select value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="input">
                    <option value="">– Nincs –</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Megjegyzés</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input resize-none" placeholder="Opcionális..." />
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
        title="Ismétlődő törlése"
        message={`Biztosan törlöd: „${deleting?.title}"? A már létrehozott tranzakciókat ez nem érinti.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function RecurringCard({ item, onEdit, onToggle, onDelete }) {
  return (
    <div className="card p-4 flex items-center gap-3 group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ background: item.category_color || '#888' }}
      >
        {item.type === 'income' ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {FREQ_LABELS[item.frequency]} · Következő: {formatDate(item.next_due)}
          {item.category_name && ` · ${item.category_name}`}
        </div>
      </div>
      <div className={`text-sm font-semibold flex-shrink-0 ${item.type === 'income' ? 'text-brand-400' : 'text-red-500'}`}>
        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <button onClick={onToggle} title={item.active ? 'Kikapcsolás' : 'Bekapcsolás'}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-xs">
          {item.active ? '⏸' : '▶'}
        </button>
        <button onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-xs">✎</button>
        <button onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-gray-400 hover:text-red-500 text-xs">✕</button>
      </div>
    </div>
  )
}
