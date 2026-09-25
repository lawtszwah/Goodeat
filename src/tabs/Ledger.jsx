import { useMemo } from 'react'
import { MEAL_TYPES, mealType } from '../useCloud'
import Avatar from '../components/Avatar'

export default function Ledger({ ledger, memberMap, api, cur }) {
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

      <div className="mb-3"><div className="section-eyebrow">HISTORY</div><h2 className="section-title">明细</h2></div>
      {grouped.length === 0 ? (
        <div className="glass-card py-12 text-center text-sm text-gray-500">
          还没有记录～<br />去「点菜」吃完一顿，或在「想吃」里吃一个，就会自动记账 💰
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
    </div>
  )
}
