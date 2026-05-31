// src/components/charts/CategoryPieChart.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold">{d.category_name}</p>
      <p className="text-gray-500">{formatCurrency(d.total)} ({d.pct}%)</p>
    </div>
  )
}

export function CategoryPieChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="card p-4 flex items-center justify-center h-48 text-sm text-gray-400">
        Nincs kiadás ebben a hónapban
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Kiadások kategóriánként
      </h3>
      <div className="flex gap-4 items-center">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={40} outerRadius={65}
              dataKey="total"
              nameKey="category_name"
              strokeWidth={2}
              stroke="transparent"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || '#888'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Jelmagyarázat */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {data.slice(0, 6).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: d.color }}
              />
              <span className="truncate text-gray-600 dark:text-gray-400 flex-1">
                {d.category_name}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">
                {d.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
