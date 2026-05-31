// src/components/ui/ConfirmModal.jsx
export function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost">Mégse</button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                       bg-red-500 hover:bg-red-600 text-white transition"
          >
            Törlés
          </button>
        </div>
      </div>
    </div>
  )
}
