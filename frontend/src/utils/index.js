// ── Szám / pénz formázás ─────────────────────────────────────────────────
export function formatCurrency(amount, currency = 'HUF') {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n) {
  return new Intl.NumberFormat('hu-HU').format(n)
}

// ── Dátum formázás ────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatMonth(yearMonth) {
  // "2026-05" → "2026. május"
  if (!yearMonth) return ''
  const [y, m] = yearMonth.split('-')
  return new Date(y, m - 1).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7)  // "2026-05"
}

export function monthLabel(yearMonth) {
  // "2026-05" → "máj."
  const [y, m] = yearMonth.split('-')
  return new Date(y, m - 1).toLocaleDateString('hu-HU', { month: 'short' })
}

// ── Kategória szín → Tailwind bg ─────────────────────────────────────────
export function hexToRgba(hex, alpha = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── API hibaüzenet kinyerése ───────────────────────────────────────────────
export function getErrorMessage(err) {
  return err?.response?.data?.error || err?.message || 'Ismeretlen hiba.'
}

// ── Email validáció ────────────────────────────────────────────────────────
export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email)
}
