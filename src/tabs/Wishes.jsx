import { useState } from 'react'
import { MEAL_TYPES, mealType } from '../useCloud'
import Avatar from '../components/Avatar'

const blankWish = () => ({ kind: 'wish', id: null, name: '', shop: '', type: 'takeout', reason: '', price: 20 })
const blankEaten = () => ({ kind: 'eaten', name: '', shop: '', type: 'takeout', reason: '', price: 20 })

const dateOf = (row) => (row.created_at ? row.created_at.slice(0, 10) : '')

export default function Wishes({ wishes, memberMap, api, cur, celebrate }) {
  const [form, setForm] = useState(null)
  const [eating, setEating] = useState(null) // 正在记一笔的想吃项 + 这次开销
  const [picked, setPicked] = useState(null)

  const todo = wishes.filter((w) => !w.eaten)
  const eaten = wishes.filter((w) => w.eaten)

  const roll = () => {
    if (todo.length === 0) return
    const pick = todo[Math.floor(Math.random() * todo.length)]
    setPicked(pick.id)
    celebrate(`就吃「${pick.name}」吧！🎲`)
  }

  // 想吃清单：吃一次 → 先填这次开销，再记入吃过 + 记账，清单里这条保留
  const startEat = (w) => setEating({ ...w, price: Number(w.price) || 0 })
  const confirmEat = () => {
    const price = Number(eating.price) || 0
    api.logEaten({ name: eating.name, shop: eating.shop, type: eating.type, reason: eating.reason, price })
    celebrate(`${mealType(eating.type).icon} 记一笔 ${cur}${price}`)
    setEating(null)
  }

  const save = () => {
    if (!form.name.trim()) return
    const fields = { name: form.name.trim(), shop: form.shop, type: form.type, reason: form.reason, price: Number(form.price) || 0 }
    if (form.kind === 'eaten') {
      api.logEaten(fields)
      celebrate(`${mealType(fields.type).icon} 记一笔 ${cur}${fields.price}`)
    } else if (form.id) {
      api.updateWish(form.id, fields)
    } else {
      api.addWish(fields)
    }
    setForm(null)
  }

  return (
    <div className="pt-2">
      <button
        onClick={roll}
        disabled={todo.length === 0}
        className="mb-5 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-400 py-4 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-40"
      >
        🎲 今天吃啥？帮我们决定
      </button>

      {/* 想吃清单 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">想吃清单 · {todo.length}</h2>
        <button onClick={() => setForm(blankWish())} className="text-sm font-medium text-orange-500">＋ 添加</button>
      </div>

      <ul className="space-y-3">
        {todo.map((w) => {
          const t = mealType(w.type)
          return (
            <li key={w.id} className={`rounded-2xl bg-white p-4 shadow-sm transition ${picked === w.id ? 'ring-2 ring-pink-400' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-bold text-gray-800">
                    {w.name}
                    {picked === w.id && <span className="ml-2 text-xs text-pink-500">← 今天就它！</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {t.icon} {t.label} {w.shop && `· ${w.shop}`} {w.price ? `· ${cur}${w.price}` : ''}
                  </div>
                  {w.reason && <div className="mt-1 text-sm text-gray-500">💬 {w.reason}</div>}
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Avatar profile={memberMap[w.created_by]} size={16} />
                    {memberMap[w.created_by]?.display_name} 加的
                  </div>
                </div>
                <button onClick={() => setForm({ kind: 'wish', ...w, price: Number(w.price) })} className="px-2 text-gray-300">✎</button>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => startEat(w)} className="flex-1 rounded-xl bg-orange-500 py-2 text-sm font-bold text-white active:scale-95">
                  ✅ 吃了一次（记一笔）
                </button>
                <button onClick={() => api.delWish(w.id)} className="rounded-xl bg-gray-100 px-4 text-sm text-gray-500 active:scale-95">删</button>
              </div>
            </li>
          )
        })}
        {todo.length === 0 && (
          <li className="rounded-2xl bg-white/60 py-10 text-center text-sm text-gray-400">还没有想吃的，点上面「添加」记一个 ✨</li>
        )}
      </ul>

      {/* 吃过 */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">吃过 · {eaten.length}</h2>
          <button onClick={() => setForm(blankEaten())} className="text-sm font-medium text-orange-500">＋ 直接记一笔</button>
        </div>
        {eaten.length === 0 ? (
          <div className="rounded-2xl bg-white/60 py-8 text-center text-sm text-gray-400">
            还没有吃过的记录～<br />清单里点「吃了一次」，或这里「直接记一笔」
          </div>
        ) : (
          <ul className="space-y-2">
            {eaten.map((w) => {
              const t = mealType(w.type)
              return (
                <li key={w.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{w.name}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {t.icon} {t.label} · {dateOf(w)} {w.price ? `· ${cur}${w.price}` : ''}
                      </div>
                      <div className="mt-1 flex gap-0.5 text-sm">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => api.updateWish(w.id, { rating: s })}>
                            {s <= (w.rating || 0) ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => api.delWish(w.id)} className="text-gray-300 active:text-red-400">✕</button>
                      <button
                        onClick={() => api.addWish({ name: w.name, shop: w.shop, type: w.type, reason: w.reason, price: Number(w.price) || 0 })}
                        className="whitespace-nowrap text-xs text-orange-400"
                      >
                        想再吃
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 这次吃了多少钱 */}
      {eating && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={() => setEating(null)}>
          <div className="animate-pop w-full max-w-md rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center text-base font-bold text-gray-800">
              {mealType(eating.type).icon} {eating.name}
            </h3>
            <p className="mb-5 mt-1 text-center text-sm text-gray-400">这次花了多少？</p>
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-orange-500">{cur}</span>
              <input
                type="number"
                autoFocus
                value={eating.price}
                onChange={(e) => setEating({ ...eating, price: e.target.value })}
                className="w-32 rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl font-bold outline-none focus:border-orange-400"
              />
            </div>
            <button onClick={confirmEat} className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]">
              记入吃过
            </button>
          </div>
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      {form && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={() => setForm(null)}>
          <div className="animate-pop w-full max-w-md rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center text-base font-bold text-gray-800">
              {form.kind === 'eaten' ? '记一笔吃过的' : form.id ? '改一下' : '想吃点什么？'}
            </h3>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={form.kind === 'eaten' ? '吃了什么，比如 火锅' : '想吃的，比如 麻辣烫'}
              className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
            />
            <div className="mb-3 flex gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setForm({ ...form, type: m.key })}
                  className={`flex-1 rounded-xl py-2.5 text-sm ${form.type === m.key ? 'bg-orange-100 font-bold text-orange-600 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-500'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <input
              value={form.shop}
              onChange={(e) => setForm({ ...form, shop: e.target.value })}
              placeholder="哪家店 / 哪道菜（可不填）"
              className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
            />
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder={form.kind === 'eaten' ? '备注（可不填）' : '为什么想吃（可不填）'}
              className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
            />
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              {form.kind === 'eaten' ? '花了' : '大概花费'} {cur}
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-24 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
              />
            </div>
            <button onClick={save} className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]">
              {form.kind === 'eaten' ? '记入吃过' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
