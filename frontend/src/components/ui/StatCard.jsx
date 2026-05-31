// src/components/ui/StatCard.jsx
export function StatCard({ label, value, sub, subColor = 'text-gray-400', icon, iconBg }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
      {sub && <div className={`text-xs ${subColor}`}>{sub}</div>}
    </div>
  )
}
