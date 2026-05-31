// src/components/TransactionForm.jsx
import { useState, useEffect } from 'react'
import { transactionsAPI, categoriesAPI } from '../api'
import { getErrorMessage } from '../utils'

const EMPTY = {
  type: 'expense',
  title: '',
  amount: '',
  category_id: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export function TransactionForm({ open, initial, onSaved, onClose }) {
  const [form,    setForm]    = useState(EMPTY)
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Kategóriák betöltése
  useEffect(() => {
    if (!open) return
    categoriesAPI.list().then(r => setCats(r.data)).catch(() => {})
  }, [open])

  // Szerkesztési mód: form feltöltése
  useEffect(() => {
    setForm(initial
      ? { ...initial, amount: initial.amount, category_id: initial.category_id || '' }
      : EMPTY
    )
    setError('')
  }, [initial, open])

  if (!open) return null

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function validate() {
    const amount = parseFloat(form.amount)
    if (!form.title.trim()) return 'A megnevezés nem lehet üres.'
    if (isNaN(amount) || amount <= 0) return 'Az összeg pozitív szám kell legyen.'
    if (amount > 100_000_000) return 'Az összeg legfeljebb 100 000 000 Ft lehet.'
    if (!form.date) return 'A dátum megadása kötelező.'
    const today = new Date().toISOString().slice(0, 10)
    if (form.date > today) return 'A dátum nem lehet jövőbeli.'
    const year = parseInt(form.date.slice(0, 4))
    if (year < 2000) return 'A dátum legkorábban 2000. január 1. lehet.'
    return null
  }

  async function submit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
      }
      if (initial?.id) {
        await transactionsAPI.update(initial.id, payload)
      } else {
        await transactionsAPI.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold">
            {initial?.id ? 'Tranzakció szerkesztése' : 'Új tranzakció'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={submit} noValidate className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Típus toggle */}
          <div className="flex gap-2">
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition
                  ${form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-brand-400 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
              >
                {t === 'expense' ? '↓ Kiadás' : '↑ Bevétel'}
              </button>
            ))}
          </div>

          {/* Cím */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Megnevezés *
            </label>
            <input
              name="title" value={form.title} onChange={change}
              required placeholder="pl. Aldi bevásárlás"
              className="input"
            />
          </div>

          {/* Összeg + Dátum */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Összeg (Ft) *
              </label>
              <input
                name="amount" value={form.amount} onChange={change}
                required type="number" min="1" step="1"
                placeholder="5000"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Dátum *
              </label>
              <input
                name="date" value={form.date} onChange={change}
                required type="date"
                max={new Date().toISOString().slice(0, 10)}
                min="2000-01-01"
                className="input"
              />
            </div>
          </div>

          {/* Kategória */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Kategória
            </label>
            <select name="category_id" value={form.category_id} onChange={change} className="input">
              <option value="">– Nincs kategória –</option>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Megjegyzés */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Megjegyzés
            </label>
            <textarea
              name="notes" value={form.notes} onChange={change}
              rows={2} placeholder="Opcionális..."
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Mégse</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Mentés...' : initial?.id ? 'Mentés' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
