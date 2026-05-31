// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { meAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../hooks'
import { ToastContainer } from '../components/ui/Toast'
import { getErrorMessage } from '../utils'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { dark, toggle }     = useTheme()
  const toast = useToast()

  const [form,    setForm]    = useState({
    monthly_budget: '',
    currency: 'HUF',
    dark_mode: dark,
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        monthly_budget: user.monthly_budget ?? '',
        currency: user.currency ?? 'HUF',
        dark_mode: dark,
      })
    }
  }, [user])   // eslint-disable-line

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await meAPI.updateSettings({
        monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : 0,
        currency: form.currency,
        dark_mode: form.dark_mode,
      })
      updateUser(res.data)
      if (form.dark_mode !== dark) toggle()
      toast.show('Beállítások mentve!')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />

      <h1 className="text-xl font-semibold">Beállítások</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        {/* Profil info (csak olvasható) */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Profil</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Név</label>
              <div className="input bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed">
                {user?.name}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="input bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Pénzügyi beállítások */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Pénzügyi beállítások</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Havi keret (Ft)
            </label>
            <input
              type="number" min="0" step="1000"
              value={form.monthly_budget}
              onChange={e => setForm(f => ({ ...f, monthly_budget: e.target.value }))}
              placeholder="pl. 200000"
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Figyelmeztetést kapsz, ha a havi kiadásaid elérik a 80%-ot.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Pénznem
            </label>
            <select
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="input"
            >
              <option value="HUF">HUF – Magyar forint</option>
              <option value="EUR">EUR – Euró</option>
              <option value="USD">USD – Dollár</option>
            </select>
          </div>
        </div>

        {/* Megjelenés */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Megjelenés</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Sötét mód</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Rendszer-beállítást is követheti automatikusan.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, dark_mode: !f.dark_mode }))}
              className={`relative w-11 h-6 rounded-full transition
                ${form.dark_mode ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                               transition-transform ${form.dark_mode ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Mentés...' : '✓ Beállítások mentése'}
        </button>
      </form>
    </div>
  )
}
