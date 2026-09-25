import { useState } from 'react'
import Avatar from '../components/Avatar'

const EMOJIS = ['🍅', '🥘', '🥬', '🍲', '🥦', '🍗', '🍤', '🍜', '🍚', '🥚', '🐟', '🍆', '🌶️', '🥩', '🍄', '🧄']
const blank = () => ({ id: null, name: '', emoji: '🍽️', category: '家常', cost: 10 })

export default function Cook({ dishes, today, memberMap, api, cur, celebrate }) {
  const [manage, setManage] = useState(false)
  const [form, setForm] = useState(null)

  const dishById = (id) => dishes.find((d) => d.id === id)
  const total = today.reduce((s, t) => s + Number(dishById(t.dish_id)?.cost || 0), 0)

  const addToToday = (dish) => {
    api.addToday(dish.id)
    celebrate(`已点「${dish.name}」🍳`)
  }

  const finishMeal = () => {
    if (today.length === 0) return
    const names = today.map((t) => dishById(t.dish_id)?.name).filter(Boolean).join('、')
    api.finishMeal(names, total)
    celebrate('开饭啦！已记一笔 🍽️')
  }

  const saveDish = () => {
    if (!form.name.trim()) return
    const fields = { name: form.name.trim(), emoji: form.emoji, category: form.category, cost: Number(form.cost) || 0 }
    if (form.id) api.updateDish(form.id, fields)
    else api.addDish(fields)
    setForm(null)
  }

  return (
    <div className="pt-2">
      {/* 今日菜单 */}
      {today.length > 0 && (
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center justify-between text-base font-bold text-gray-800">
            <span>今日菜单 · {today.length} 道</span>
            <span className="text-orange-500">{cur}{total}</span>
          </h2>
          <ul className="space-y-2">
            {today.map((t) => {
              const d = dishById(t.dish_id)
              if (!d) return null
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl bg-orange-50/60 px-3 py-2">
                  <button onClick={() => api.toggleToday(t.id, !t.done)} className="text-2xl active:scale-90">
                    {t.done ? '✅' : d.emoji}
                  </button>
                  <div className="flex-1">
                    <div className={`font-medium ${t.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{d.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Avatar profile={memberMap[t.ordered_by]} size={14} />
                      {memberMap[t.ordered_by]?.display_name} 点的 · {cur}{d.cost}
                    </div>
                  </div>
                  <button onClick={() => api.removeToday(t.id)} className="px-2 text-gray-300 active:text-red-400">✕</button>
                </li>
              )
            })}
          </ul>
          <button onClick={finishMeal} className="mt-4 w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]">
            🍽️ 这顿吃完啦（记一笔 {cur}{total}）
          </button>
        </section>
      )}

      {/* 菜库 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">家常菜库</h2>
          <button onClick={() => setManage((m) => !m)} className="text-sm font-medium text-orange-500">
            {manage ? '完成' : '管理'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {dishes.map((d) => (
            <div key={d.id} className="relative">
              <button
                onClick={() => (manage ? setForm({ ...d, cost: Number(d.cost) }) : addToToday(d))}
                className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-sm active:scale-95"
              >
                <span className="text-3xl">{d.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{d.name}</span>
                <span className="text-xs text-gray-400">{cur}{d.cost}</span>
              </button>
              {/* 谁加的 */}
              <div className="absolute left-1 top-1">
                <Avatar profile={memberMap[d.created_by]} size={18} />
              </div>
              {manage && (
                <button onClick={() => api.delDish(d.id)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-400 text-xs text-white shadow">✕</button>
              )}
            </div>
          ))}

          <button
            onClick={() => setForm(blank())}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-orange-200 p-3 text-orange-400 active:scale-95"
          >
            <span className="text-2xl">＋</span>
            <span className="text-sm">加新菜</span>
          </button>
        </div>
      </section>

      {/* 新增/编辑弹窗 */}
      {form && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={() => setForm(null)}>
          <div className="animate-pop w-full max-w-md rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center text-base font-bold text-gray-800">这道菜叫…</h3>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="菜名，比如 红烧排骨"
              className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-orange-400"
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm({ ...form, emoji: e })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${form.emoji === e ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-gray-50'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              参考成本 {cur}
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-24 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
              />
            </div>
            <button onClick={saveDish} className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]">保存</button>
          </div>
        </div>
      )}
    </div>
  )
}
