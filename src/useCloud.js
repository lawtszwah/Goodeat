import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

// 统一的数据层：登录后加载本「小家」的所有数据，并实时同步
export function useCloud(session) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null) // 我的资料（含 household_id）
  const [members, setMembers] = useState([]) // 同家所有人，用来显示头像/名字
  const [home, setHome] = useState(null) // 小家信息（含邀请码）
  const [dishes, setDishes] = useState([])
  const [today, setToday] = useState([])
  const [wishes, setWishes] = useState([])
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)
  const [needOnboard, setNeedOnboard] = useState(false)

  const hid = profile?.household_id

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!data || !data.household_id) {
      setNeedOnboard(true)
      setProfile(data || null)
      return null
    }
    setNeedOnboard(false)
    setProfile(data)
    return data
  }, [userId])

  const loadAll = useCallback(async (householdId) => {
    const [h, m, d, t, w, l] = await Promise.all([
      supabase.from('households').select('*').eq('id', householdId).maybeSingle(),
      supabase.from('profiles').select('*').eq('household_id', householdId),
      supabase.from('dishes').select('*').eq('household_id', householdId).order('created_at'),
      supabase.from('today_items').select('*').eq('household_id', householdId).order('created_at'),
      supabase.from('wishes').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      supabase.from('ledger').select('*').eq('household_id', householdId).order('date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    setHome(h.data || null)
    setMembers(m.data || [])
    setDishes(d.data || [])
    setToday(t.data || [])
    setWishes(w.data || [])
    setLedger(l.data || [])
  }, [])

  const refresh = useCallback(async () => {
    const p = await loadProfile()
    if (p?.household_id) await loadAll(p.household_id)
  }, [loadProfile, loadAll])

  // 初始化
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const p = await loadProfile()
      if (active && p?.household_id) await loadAll(p.household_id)
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [loadProfile, loadAll])

  // 实时同步：对方改了，我这边自动刷新
  useEffect(() => {
    if (!hid) return
    const ch = supabase.channel('hh-' + hid)
    for (const tb of ['dishes', 'today_items', 'wishes', 'ledger', 'profiles']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: tb, filter: `household_id=eq.${hid}` }, () => loadAll(hid))
    }
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [hid, loadAll])

  // —— 增删改，改完立即刷新本地 ——
  const after = async (promise) => {
    const { error } = await promise
    if (error) { alert('出错了：' + error.message); return false }
    if (hid) await loadAll(hid)
    return true
  }

  const api = {
    // 菜库
    addDish: (d) => after(supabase.from('dishes').insert({ household_id: hid, created_by: userId, ...d })),
    updateDish: (id, d) => after(supabase.from('dishes').update(d).eq('id', id)),
    delDish: (id) => after(supabase.from('dishes').delete().eq('id', id)),

    // 今日菜单
    addToday: (dishId) => after(supabase.from('today_items').insert({ household_id: hid, dish_id: dishId, ordered_by: userId, done: false })),
    toggleToday: (id, done) => after(supabase.from('today_items').update({ done }).eq('id', id)),
    removeToday: (id) => after(supabase.from('today_items').delete().eq('id', id)),
    finishMeal: async (title, amount) => {
      await supabase.from('ledger').insert({ household_id: hid, created_by: userId, date: todayStr(), type: 'home', title, amount })
      await supabase.from('today_items').delete().eq('household_id', hid)
      if (hid) await loadAll(hid)
    },

    // 想吃清单（eaten=false）
    addWish: (w) => after(supabase.from('wishes').insert({ household_id: hid, created_by: userId, eaten: false, ...w })),
    updateWish: (id, w) => after(supabase.from('wishes').update(w).eq('id', id)),
    delWish: (id) => after(supabase.from('wishes').delete().eq('id', id)),

    // 记一次「吃过」：新增一条吃过记录(eaten=true) + 记一笔账，原想吃项保持不动
    logEaten: async (f) => {
      const { error } = await supabase.from('wishes').insert({
        household_id: hid, created_by: userId, eaten: true,
        name: f.name, shop: f.shop || null, type: f.type || 'takeout',
        reason: f.reason || null, price: Number(f.price) || 0, rating: f.rating || 0,
        image_url: f.image_url || null,
      })
      if (error) { alert('出错了：' + error.message); return false }
      const { error: ledgerError } = await supabase.from('ledger').insert({
        household_id: hid, created_by: userId, date: todayStr(),
        type: f.type || 'takeout', title: `${f.name}${f.shop ? '·' + f.shop : ''}`, amount: Number(f.price) || 0,
      })
      if (hid) await loadAll(hid)
      if (ledgerError) { alert('吃过记录已保存，但记账失败：' + ledgerError.message); return 'partial' }
      return true
    },

    // 账本
    addLedger: (entry) => after(supabase.from('ledger').insert({ household_id: hid, created_by: userId, ...entry })),
    delLedger: (id) => after(supabase.from('ledger').delete().eq('id', id)),

    // 个人资料
    updateProfile: (d) => after(supabase.from('profiles').update(d).eq('id', userId)),
  }

  return { profile, members, home, dishes, today, wishes, ledger, loading, needOnboard, hid, refresh, api }
}

export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 头像上传 → 返回公开 URL
export async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

const FOOD_PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function uploadFoodPhoto(householdId, userId, file) {
  const ext = FOOD_PHOTO_TYPES[file.type]
  if (!ext) throw new Error('请选择 JPG、PNG、WebP 或 GIF 图片')
  if (file.size > 5 * 1024 * 1024) throw new Error('照片不能超过 5 MB')
  const path = `${householdId}/${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('food-photos').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('food-photos').getPublicUrl(path)
  return data.publicUrl
}

// 用餐类型
export const MEAL_TYPES = [
  { key: 'home', label: '在家做', icon: '🍳' },
  { key: 'takeout', label: '点外卖', icon: '🛵' },
  { key: 'dineout', label: '出去吃', icon: '🍽️' },
]
export const mealType = (key) => MEAL_TYPES.find((m) => m.key === key) || MEAL_TYPES[0]

// 货币（存本机偏好）
export const CURRENCIES = { AUD: '$', USD: 'US$', CNY: '¥', EUR: '€' }
const CUR_KEY = 'home-order-currency'
export const getCurrency = () => localStorage.getItem(CUR_KEY) || 'AUD'
export const setCurrencyPref = (c) => localStorage.setItem(CUR_KEY, c)
