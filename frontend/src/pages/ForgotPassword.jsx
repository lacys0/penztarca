import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../api'
import { getErrorMessage, validateEmail } from '../utils'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!email) return setError('Az email cím megadása kötelező.')
    if (!validateEmail(email)) return setError('Adj meg érvényes email címet.')
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email })
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Elfelejtett jelszó</h1>
          <p className="text-sm text-gray-500 mt-1">Elküldjük a visszaállítási linket</p>
        </div>

        <div className="card p-6 shadow-lg">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ha ez az email cím regisztrálva van, küldtünk egy visszaállítási linket.
                Nézd meg a postaládád (spam mappát is)!
              </p>
              <Link to="/login" className="btn-primary w-full justify-center py-2.5 block text-center">
                Vissza a bejelentkezéshez
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
                  Email cím
                </label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="demo@penztarca.hu"
                  className="input"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? 'Küldés...' : 'Link küldése'}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-xs text-gray-500 mt-5">
              Vissza a{' '}
              <Link to="/login" className="text-brand-400 hover:underline font-medium">
                bejelentkezéshez
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
