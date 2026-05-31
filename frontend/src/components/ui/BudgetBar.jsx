// src/components/ui/BudgetBar.jsx
import { formatCurrency } from '../../utils'

export function BudgetBar({ spent, budget }) {
  if (!budget) return null
  const pct = Math.min(Math.round((spent / budget) * 100), 100)
  const over = pct >= 100
  const warn = pct >= 80

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Havi keret
        </span>
        <span className={`text-xs font-semibold ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-brand-400'}`}>
          {pct}%
        </span>
      </div>

      {(over || warn) && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-3 font-medium
          ${over
            ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
          }`}
        >
          {over
            ? `⚠ Túllépted a havi keretet! (${formatCurrency(spent - budget)}-vel)`
            : `⚠ A keret ${pct}%-a felhasználva`}
        </div>
      )}

      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-brand-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{formatCurrency(spent)}</span>
        <span>{formatCurrency(budget)}</span>
      </div>
    </div>
  )
}
