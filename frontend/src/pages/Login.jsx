// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage, validateEmail } from '../utils'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!form.email) return setError('Az email cím megadása kötelező.')
    if (!validateEmail(form.email)) return setError('Adj meg érvényes email címet.')
    if (!form.password) return setError('A jelszó megadása kötelező.')
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brand-400 text-white text-2xl mb-4 shadow-lg">
            💰
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pénztárca</h1>
          <p className="text-sm text-gray-500 mt-1">Bejelentkezés a fiókodba</p>
        </div>

        <div className="card p-6 shadow-lg">
          <form onSubmit={submit} noValidate className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400
                              px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Email cím
              </label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="demo@penztarca.hu"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Jelszó
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:underline">
                  Elfelejtett jelszó?
                </Link>
              </div>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Nincs még fiókod?{' '}
            <Link to="/register" className="text-brand-400 hover:underline font-medium">
              Regisztrálj
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Demo: <span className="font-mono">demo@penztarca.hu</span> / <span className="font-mono">Demo1234!</span>
        </div>
      </div>
    </div>
  )
}
