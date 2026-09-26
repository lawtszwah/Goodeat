import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MEAL_TYPES, mealType, todayStr } from '../useCloud'
import Avatar from '../components/Avatar'

export default function Ledger({ ledger, memberMap, api, cur }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const canSave = form && form.title.trim() && form.date && form.amount !== '' && Number.isFinite(Number(form.amount)) && Number(form.amount) >= 0

  const save = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const saved = await api.addLedger({
        date: form.date,
        type: form.type,
        title: form.title.trim(),
        amount: Number(form.amount),
      })
      if (saved) setForm(null)
    } finally {
      setSaving(false)
    }
  }

  const thisMonth = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const rows = ledger.filter((r) => r.date.startsWith(prefix))
    const by = {}
    for (const m of MEAL_TYPES) by[m.key] = 0
    for (const r of rows) by[r.type] = (by[r.type] || 0) + Number(r.amount)
    const total = Object.values(by).reduce((s, v) => s + v, 0)
    return { by, total, count: rows.length }
  }, [ledger])

  const grouped = useMemo(() => {
    const map = {}
    for (const r of ledger) (map[r.date] ||= []).push(r)
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [ledger])

  return (
    <div className="page-content pt-2">
      <section className="glass-card ledger-summary mb-6 p-5">
        <div className="section-eyebrow">THIS MONTH</div>
        <div className="mt-1 text-sm text-slate-600">本月吃饭花了</div>
        <div className="ledger-total mt-1 text-4xl font-bold">{cur}{thisMonth.total}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          {MEAL_TYPES.map((m) => (
            <div key={m.key} className="glass-row px-3 py-2">
              <div className="text-slate-600">{m.icon} {m.label}</div>
              <div className="text-lg font-bold">{cur}{thisMonth.by[m.key] || 0}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">本月共 {thisMonth.count} 笔</div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <div><div className="section-eyebrow">HISTORY</div><h2 className="section-title">明细</h2></div>
        <button
          type="button"
          onClick={() => setForm({ title: '', amount: '', type: 'takeout', date: todayStr() })}
          className="text-sm font-semibold accent-text"
        >
          ＋ 记一笔
        </button>
      </div>
      {grouped.length === 0 ? (
        <div className="glass-card py-12 text-center text-sm text-gray-500">
          还没有记录～<br />点上方「记一笔」手动添加，或吃完一顿后自动记账 💰
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, rows]) => (
            <div key={date}>
              <div className="mb-2 text-xs font-medium text-gray-400">{date}</div>
              <ul className="space-y-2">
                {rows.map((r) => {
                  const t = mealType(r.type)
                  return (
                    <li key={r.id} className="glass-card flex items-center gap-3 px-4 py-3">
                      <span className="text-xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{r.title}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          {t.label} · <Avatar profile={memberMap[r.created_by]} size={14} /> {memberMap[r.created_by]?.display_name || ''}
                        </div>
                      </div>
                      <span className="font-bold text-gray-700">{cur}{r.amount}</span>
                      <button onClick={() => api.delLedger(r.id)} className="text-gray-300 active:text-red-400">✕</button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {form && createPortal(
        <div className="sheet-backdrop fixed inset-0 z-30 flex items-end justify-center" onClick={() => { if (!saving) setForm(null) }}>
          <div className="glass-sheet animate-pop w-full max-w-md p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center text-base font-bold text-gray-800">记一笔</h3>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="吃了什么，比如 火锅"
              aria-label="吃了什么"
              className="mb-3 w-full px-4 py-3 outline-none"
            />
            <div className="mb-3 flex gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setForm({ ...form, type: m.key })}
                  className={`flex-1 rounded-xl py-2.5 text-sm ${form.type === m.key ? 'bg-orange-100 font-bold text-orange-600 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-500'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              花了 {cur}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                aria-label="花费金额"
                className="w-28 px-3 py-2 outline-none"
              />
            </div>
            <div className="mb-5 flex items-center gap-2 text-sm text-gray-600">
              日期
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                aria-label="记账日期"
                className="px-3 py-2 outline-none"
              />
            </div>
            <button onClick={save} disabled={saving || !canSave} className="primary-button w-full py-3 font-bold disabled:opacity-50">
              {saving ? '保存中…' : '保存记录'}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
