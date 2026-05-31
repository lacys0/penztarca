// src/pages/Transactions.jsx
import { useState, useEffect, useCallback } from 'react'
import { transactionsAPI, categoriesAPI } from '../api'
import { TransactionForm }  from '../components/TransactionForm'
import { ConfirmModal }     from '../components/ui/ConfirmModal'
import { PageSpinner }      from '../components/ui/Spinner'
import { ToastContainer }   from '../components/ui/Toast'
import { formatCurrency, formatDate, currentMonth } from '../utils'
import { useDebounce, useToast } from '../hooks'

const TYPES = [
  { value: '', label: 'Összes' },
  { value: 'expense', label: 'Kiadás' },
  { value: 'income',  label: 'Bevétel' },
]

export default function Transactions() {
  const toast = useToast()

  const [txns,       setTxns]       = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [typeF,      setTypeF]      = useState('')
  const [month,      setMonth]      = useState(currentMonth())
  const [offset,     setOffset]     = useState(0)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [cats,       setCats]       = useState([])
  const [catF,       setCatF]       = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [amountMin,  setAmountMin]  = useState('')
  const [amountMax,  setAmountMax]  = useState('')
  const [showExtra,  setShowExtra]  = useState(false)

  const debouncedSearch = useDebounce(search)
  const LIMIT = 20

  useEffect(() => {
    categoriesAPI.list().then(r => setCats(r.data)).catch(() => {})
  }, [])

  function buildFilterParams(overrides = {}) {
    return {
      month:       month || undefined,
      type:        typeF || undefined,
      search:      debouncedSearch || undefined,
      category_id: catF || undefined,
      date_from:   (!month && dateFrom) ? dateFrom : undefined,
      date_to:     (!month && dateTo)   ? dateTo   : undefined,
      amount_min:  amountMin || undefined,
      amount_max:  amountMax || undefined,
      ...overrides,
    }
  }

  async function exportCSV() {
    try {
      const res = await transactionsAPI.list(buildFilterParams({ limit: 10000, offset: 0 }))
      const rows = res.data.data
      if (rows.length === 0) { toast.show('Nincs exportálható adat', 'error'); return }

      const header = ['Dátum', 'Megnevezés', 'Típus', 'Összeg (HUF)', 'Kategória', 'Megjegyzés']
      const lines = rows.map(t => [
        t.date,
        `"${t.title.replace(/"/g, '""')}"`,
        t.type === 'income' ? 'Bevétel' : 'Kiadás',
        t.amount,
        t.category_name || '',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(';'))

      const csv = '﻿' + [header.join(';'), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `penztarca_${month || 'osszes'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.show('Export sikertelen', 'error')
    }
  }

  const hasExtraFilter = catF || dateFrom || dateTo || amountMin || amountMax

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionsAPI.list(buildFilterParams({ limit: LIMIT, offset }))
      setTxns(res.data.data)
      setTotal(res.data.total)
    } catch {
      toast.show('Hiba a tranzakciók betöltésekor', 'error')
    } finally {
      setLoading(false)
    }
  }, [month, typeF, debouncedSearch, catF, dateFrom, dateTo, amountMin, amountMax, offset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setOffset(0) }, [month, typeF, debouncedSearch, catF, dateFrom, dateTo, amountMin, amountMax])
  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await transactionsAPI.remove(deleting.id)
      toast.show('Tranzakció törölve')
      setDeleting(null)
      load()
    } catch {
      toast.show('Törlés sikertelen', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />

      {/* Fejléc */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tranzakciók</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-sm">
            ⬇ CSV
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">
            + Új
          </button>
        </div>
      </div>

      {/* Szűrők */}
      <div className="card p-3 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Keresés..."
            className="input flex-1"
          />
          <input
            type="month" value={month}
            onChange={e => setMonth(e.target.value)}
            className="input w-auto"
          />
          <div className="flex gap-1">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeF(t.value)}
                className={`px-3 py-2 rounded-lg text-sm transition
                  ${typeF === t.value
                    ? 'bg-brand-400 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setShowExtra(v => !v)}
              className={`px-3 py-2 rounded-lg text-sm transition
                ${(showExtra || hasExtraFilter)
                  ? 'bg-brand-400 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              title="Speciális szűrők"
            >
              ⚙ {hasExtraFilter ? '●' : ''}
            </button>
          </div>
        </div>

        {showExtra && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Kategória</label>
              <select value={catF} onChange={e => setCatF(e.target.value)} className="input text-sm">
                <option value="">Összes</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Dátumtól</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                disabled={!!month} className="input text-sm disabled:opacity-40" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Dátumig</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                disabled={!!month} className="input text-sm disabled:opacity-40" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Min Ft</label>
                <input type="number" min="0" value={amountMin}
                  onChange={e => setAmountMin(e.target.value)}
                  placeholder="0" className="input text-sm" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Max Ft</label>
                <input type="number" min="0" value={amountMax}
                  onChange={e => setAmountMax(e.target.value)}
                  placeholder="∞" className="input text-sm" />
              </div>
            </div>
            {hasExtraFilter && (
              <button
                onClick={() => { setCatF(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax('') }}
                className="col-span-2 sm:col-span-4 text-xs text-red-400 hover:text-red-600 text-left"
              >
                ✕ Speciális szűrők törlése
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : txns.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">
            Nincs találat a megadott szűrőkre.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {txns.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
              >
                {/* Ikon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{
                    background: (t.category_color || '#888') + '22',
                    color: t.category_color || '#666',
                  }}
                >
                  {t.type === 'income' ? '↑' : '↓'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
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
                    {t.notes && <span className="italic truncate max-w-[120px]">· {t.notes}</span>}
                  </div>
                </div>

                {/* Összeg */}
                <div className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-brand-400' : 'text-red-500'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </div>

                {/* Akciók */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  <button
                    onClick={() => { setEditing(t); setShowForm(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400
                               hover:text-gray-700 dark:hover:text-gray-200 text-xs transition"
                    title="Szerkesztés"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => setDeleting(t)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-gray-400
                               hover:text-red-600 text-xs transition"
                    title="Törlés"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lapozó */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{total} találat</span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                className="btn-ghost text-xs py-1 px-2 disabled:opacity-40"
              >
                ← Előző
              </button>
              <button
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(o => o + LIMIT)}
                className="btn-ghost text-xs py-1 px-2 disabled:opacity-40"
              >
                Következő →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form + Megerősítő modal */}
      <TransactionForm
        open={showForm}
        initial={editing}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={() => {
          setShowForm(false)
          setEditing(null)
          toast.show(editing ? 'Tranzakció módosítva!' : 'Tranzakció hozzáadva!')
          load()
        }}
      />
      <ConfirmModal
        open={!!deleting}
        title="Tranzakció törlése"
        message={`Biztosan törlöd: „${deleting?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
