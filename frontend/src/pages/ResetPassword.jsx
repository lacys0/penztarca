import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../api'
import { getErrorMessage } from '../utils'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form,    setForm]    = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.password) return setError('Az új jelszó megadása kötelező.')
    if (form.password.length < 8) return setError('A jelszó legalább 8 karakter legyen.')
    if (form.password !== form.confirm) return setError('A két jelszó nem egyezik.')
    setLoading(true)
    setError('')
    try {
      await authAPI.resetPassword({ token, password: form.password })
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brand-400 text-white text-2xl mb-4 shadow-lg">
            💰
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Új jelszó beállítása</h1>
          <p className="text-sm text-gray-500 mt-1">Add meg az új jelszavadat</p>
        </div>

        <div className="card p-6 shadow-lg">
          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600">Érvénytelen link. Kérj új visszaállítási emailt.</p>
              <Link to="/forgot-password" className="btn-primary w-full justify-center py-2.5 block text-center">
                Új link kérése
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Jelszavad sikeresen megváltozott. Bejelentkezhetsz az új jelszóval.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center py-2.5 block text-center">
                Bejelentkezés
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400
                                px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Új jelszó
                </label>
                <input
                  type="password" required minLength={8}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 karakter"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Jelszó megerősítése
                </label>
                <input
                  type="password" required minLength={8}
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Ismételd meg a jelszót"
                  className="input"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? 'Mentés...' : 'Jelszó mentése'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
