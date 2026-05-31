// src/components/ui/Toast.jsx
export function ToastContainer({ toasts, remove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer transition
            ${t.type === 'success' ? 'bg-brand-400 text-white' : ''}
            ${t.type === 'error'   ? 'bg-red-500 text-white'   : ''}
            ${t.type === 'warning' ? 'bg-amber-400 text-white' : ''}
          `}
        >
          <span>
            {t.type === 'success' && '✓'}
            {t.type === 'error'   && '✕'}
            {t.type === 'warning' && '⚠'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
