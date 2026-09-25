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
    <div className="pt-2">
      <section className="mb-5 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-5 text-white shadow">
        <div className="text-sm opacity-80">本月吃饭花了</div>
        <div className="mt-1 text-4xl font-bold">{cur}{thisMonth.total}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          {MEAL_TYPES.map((m) => (
            <div key={m.key} className="rounded-xl bg-white/15 px-3 py-2">
              <div className="opacity-80">{m.icon} {m.label}</div>
              <div className="text-lg font-bold">{cur}{thisMonth.by[m.key] || 0}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs opacity-70">本月共 {thisMonth.count} 笔</div>
      </section>

      <h2 className="mb-3 text-base font-bold text-gray-800">明细</h2>
      {grouped.length === 0 ? (
        <div className="rounded-2xl bg-white/60 py-12 text-center text-sm text-gray-400">
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
                    <li key={r.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
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
