// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsAPI, transactionsAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { StatCard }          from '../components/ui/StatCard'
import { BudgetBar }         from '../components/ui/BudgetBar'
import { PageSpinner }       from '../components/ui/Spinner'
import { TrendChart }        from '../components/charts/TrendChart'
import { CategoryPieChart }  from '../components/charts/CategoryPieChart'
import { TransactionForm }   from '../components/TransactionForm'
import { formatCurrency, formatDate, currentMonth } from '../utils'
import { useToast }          from '../hooks'
import { ToastContainer }    from '../components/ui/Toast'

export default function Dashboard() {
  const { user }  = useAuth()
  const month     = currentMonth()
  const toast     = useToast()

  const [stats,     setStats]     = useState(null)
  const [trend,     setTrend]     = useState([])
  const [recent,    setRecent]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, t, r] = await Promise.all([
        statsAPI.monthly(month),
        statsAPI.trend(),
        transactionsAPI.list({ limit: 6 }),
      ])
      setStats(s.data)
      setTrend(t.data)
      setRecent(r.data.data)
    } catch {
      toast.show('Hiba az adatok betöltésekor', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])   // eslint-disable-line

  if (loading) return <PageSpinner />

  const income  = stats?.total_income  ?? 0
  const expense = stats?.total_expense ?? 0
  const balance = stats?.balance       ?? 0
  const budget  = stats?.monthly_budget ?? user?.monthly_budget ?? 0
  const budgetPct = budget > 0 ? (expense / budget) * 100 : 0

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />

      {/* Költségvetési riasztás banner */}
      {budget > 0 && budgetPct >= 80 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
          ${budgetPct >= 100
            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}>
          <span className="text-xl">{budgetPct >= 100 ? '🚨' : '⚠️'}</span>
          <span>
            {budgetPct >= 100
              ? `Túllépted a havi keretet! ${formatCurrency(expense - budget)}-vel többet költöttél a tervezettnél.`
              : `A havi keret ${Math.round(budgetPct)}%-a elfogyott. Már csak ${formatCurrency(budget - expense)} maradt.`
            }
          </span>
        </div>
      )}

      {/* Fejléc */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Jó napot, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('hu-HU', { year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Új tranzakció
        </button>
      </div>

      {/* Stat kártyák */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Bevétel"
          value={formatCurrency(income)}
          icon="↑"
          iconBg="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300"
          sub="ebben a hónapban"
        />
        <StatCard
          label="Kiadás"
          value={formatCurrency(expense)}
          icon="↓"
          iconBg="bg-red-100 dark:bg-red-900 text-red-500"
          sub="ebben a hónapban"
        />
        <StatCard
          label="Egyenleg"
          value={formatCurrency(balance)}
          icon="≈"
          iconBg="bg-blue-100 dark:bg-blue-900 text-blue-500"
          sub={balance >= 0 ? 'Pozitív egyenleg ✓' : 'Negatív egyenleg!'}
          subColor={balance >= 0 ? 'text-brand-400' : 'text-red-500'}
        />
        <StatCard
          label="Tranzakciók"
          value={recent.length > 0 ? `${recent.length}+` : '0'}
          icon="⊟"
          iconBg="bg-purple-100 dark:bg-purple-900 text-purple-500"
          sub="legutóbbi"
        />
      </div>

      {/* Keret figyelés */}
      {budget > 0 && <BudgetBar spent={expense} budget={budget} />}

      {/* Diagramok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart data={trend} />
        <CategoryPieChart data={stats?.by_category ?? []} />
      </div>

      {/* Legutóbbi tranzakciók */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Legutóbbi tranzakciók</h3>
          <Link to="/transactions" className="text-xs text-brand-400 hover:underline">
            Összes →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Még nincsenek tranzakciók. Adj hozzá egyet!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50
                                         dark:hover:bg-gray-800/50 transition">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    background: t.category_color ? t.category_color + '22' : '#f3f4f6',
                    color: t.category_color || '#6b7280',
                  }}
                >
                  {t.type === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span>{formatDate(t.date)}</span>
                    {t.category_name && (
                      <>
                        <span>·</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: (t.category_color || '#888') + '22',
                            color: t.category_color || '#666',
                          }}
                        >
                          {t.category_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-brand-400' : 'text-red-500'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tranzakció form modal */}
      <TransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false)
          toast.show('Tranzakció hozzáadva!')
          load()
        }}
      />
    </div>
  )
}
