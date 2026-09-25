import { useState } from 'react'
import { createPortal } from 'react-dom'
import Avatar from '../components/Avatar'
import FoodPhoto from '../components/FoodPhoto'
import FoodImage from '../components/FoodImage'
import { uploadFoodPhoto } from '../useCloud'

const EMOJIS = ['🍅', '🥘', '🥬', '🍲', '🥦', '🍗', '🍤', '🍜', '🍚', '🥚', '🐟', '🍆', '🌶️', '🥩', '🍄', '🧄']
const blank = () => ({ id: null, name: '', emoji: '🍽️', image_url: null, photoFile: null, category: '家常', cost: 10 })

export default function Cook({ dishes, today, memberMap, api, cur, celebrate, hid, me }) {
  const [manage, setManage] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dishById = (id) => dishes.find((d) => d.id === id)
  const total = today.reduce((s, t) => s + Number(dishById(t.dish_id)?.cost || 0), 0)
  const keyword = search.trim().toLocaleLowerCase()
  const visibleDishes = keyword ? dishes.filter((d) => d.name.toLocaleLowerCase().includes(keyword)) : dishes

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

  const saveDish = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const imageUrl = form.photoFile ? await uploadFoodPhoto(hid, me.id, form.photoFile) : form.image_url || null
      const fields = { name: form.name.trim(), emoji: form.emoji, image_url: imageUrl, category: form.category, cost: Number(form.cost) || 0 }
      const saved = form.id ? await api.updateDish(form.id, fields) : await api.addDish(fields)
      if (saved) setForm(null)
    } catch (err) {
      setError('照片上传失败：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content pt-2">
      {/* 今日菜单 */}
      {today.length > 0 && (
        <section className="glass-card featured-card mb-6 p-4">
          <h2 className="mb-3 flex items-center justify-between text-base font-bold text-slate-800">
            <span>今日菜单 · {today.length} 道</span>
            <span className="accent-text">{cur}{total}</span>
          </h2>
          <ul className="space-y-2">
            {today.map((t) => {
              const d = dishById(t.dish_id)
              if (!d) return null
              return (
                <li key={t.id} className="glass-row flex items-center gap-3 px-3 py-2">
                  <button onClick={() => api.toggleToday(t.id, !t.done)} className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl active:scale-90" aria-label={t.done ? `标记${d.name}未完成` : `标记${d.name}完成`}>
                    {t.done ? '✅' : <FoodImage imageUrl={d.image_url} emoji={d.emoji} imageClassName="h-10 w-10 rounded-xl" />}
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
          <button onClick={finishMeal} className="primary-button mt-4 w-full py-3 font-bold active:scale-[0.98]">
            🍽️ 这顿吃完啦（记一笔 {cur}{total}）
          </button>
        </section>
      )}

      {/* 家常菜 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div><div className="section-eyebrow">DISCOVER & PICK</div><h2 className="section-title">家常菜</h2></div>
          <button onClick={() => setManage((m) => !m)} className="text-sm font-semibold accent-text">
            {manage ? '完成' : '管理'}
          </button>
        </div>

        <div className="dish-search mb-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            aria-label="搜索家常菜"
            placeholder="搜索菜名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="清空搜索">✕</button>}
        </div>

        {keyword && visibleDishes.length === 0 && (
          <p className="dish-search-empty" role="status">没有找到相关菜品</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {visibleDishes.map((d) => (
            <div key={d.id} className="relative">
              <button
                onClick={() => (manage ? (setError(''), setForm({ ...d, photoFile: null, cost: Number(d.cost) })) : addToToday(d))}
                className="glass-card dish-card flex w-full flex-col items-center gap-1 p-3 active:scale-95"
              >
                <FoodImage imageUrl={d.image_url} emoji={d.emoji} className="text-3xl" imageClassName="h-12 w-12 rounded-xl" />
                <span className="dish-name text-sm font-medium text-gray-700">{d.name}</span>
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
            onClick={() => { setError(''); setForm(blank()) }}
            className="add-card flex flex-col items-center justify-center gap-1 p-3 active:scale-95"
          >
            <span className="text-2xl">＋</span>
            <span className="text-sm">加新菜</span>
          </button>
        </div>
      </section>

      {/* 新增/编辑弹窗 */}
      {form && createPortal(
        <div className="sheet-backdrop fixed inset-0 z-30 flex items-end justify-center" onClick={() => { if (!saving) setForm(null) }}>
          <div className="glass-sheet animate-pop w-full max-w-md p-5 pb-8" onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => setForm({ ...form, emoji: e, image_url: null, photoFile: null })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${form.emoji === e && !form.image_url && !form.photoFile ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-gray-50'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <FoodPhoto
              label="菜品照片"
              imageUrl={form.image_url}
              file={form.photoFile}
              onChange={({ file, imageUrl }) => setForm({ ...form, photoFile: file, image_url: imageUrl })}
            />
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              参考成本 {cur}
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-24 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
              />
            </div>
            {error && <p className="mb-3 text-sm text-red-500" role="alert">{error}</p>}
            <button onClick={saveDish} disabled={saving} className="primary-button w-full py-3 font-bold active:scale-[0.98] disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
