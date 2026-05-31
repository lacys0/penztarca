// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage, validateEmail } from '../utils'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name || form.name.trim().length < 2) return setError('A név legalább 2 karakter legyen.')
    if (!form.email) return setError('Az email cím megadása kötelező.')
    if (!validateEmail(form.email)) return setError('Adj meg érvényes email címet.')
    if (!form.password) return setError('A jelszó megadása kötelező.')
    if (form.password.length < 8) return setError('A jelszó legalább 8 karakter legyen.')
    if (!/[A-Z]/.test(form.password)) return setError('A jelszónak tartalmaznia kell legalább egy nagybetűt.')
    if (!/[0-9]/.test(form.password)) return setError('A jelszónak tartalmaznia kell legalább egy számot.')
    setLoading(true)
    setError('')
    try {
      await register(form)
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brand-400 text-white text-2xl mb-4 shadow-lg">
            💰
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fiók létrehozása</h1>
          <p className="text-sm text-gray-500 mt-1">Ingyenes regisztráció</p>
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
                Teljes név
              </label>
              <input
                name="name" required minLength={2}
                value={form.name} onChange={change}
                placeholder="Kovács Nóra"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Email cím
              </label>
              <input
                name="email" type="email" required
                value={form.email} onChange={change}
                placeholder="nora@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Jelszó
              </label>
              <input
                name="password" type="password" required minLength={8}
                value={form.password} onChange={change}
                placeholder="Min. 8 kar., nagybetű és szám"
                className="input"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Legalább 8 karakter, egy nagybetű és egy szám.
              </p>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Regisztráció...' : 'Regisztráció'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Már van fiókod?{' '}
            <Link to="/login" className="text-brand-400 hover:underline font-medium">
              Bejelentkezés
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
