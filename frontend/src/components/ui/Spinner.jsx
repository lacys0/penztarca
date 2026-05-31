// src/components/ui/Spinner.jsx
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-[3px]'
  return (
    <div className={`${s} rounded-full border-brand-400 border-t-transparent animate-spin`} />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
    </div>
  )
}
