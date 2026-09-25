import { useState } from 'react'
import { supabase } from './supabase'
import { uploadAvatar } from './useCloud'

export default function Onboarding({ session, onDone }) {
  const [mode, setMode] = useState('create') // create | join
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBusy(true)
      const url = await uploadAvatar(session.user.id, file)
      setAvatarUrl(url)
    } catch (e2) {
      setErr('头像上传失败：' + e2.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    setErr('')
    if (!name.trim()) return setErr('给自己起个名字吧')
    if (mode === 'join' && !code.trim()) return setErr('请输入邀请码')
    setBusy(true)
    const rpc =
      mode === 'create'
        ? supabase.rpc('create_home', { p_display_name: name.trim(), p_avatar: avatarUrl })
        : supabase.rpc('join_home', { p_code: code.trim(), p_display_name: name.trim(), p_avatar: avatarUrl })
    const { error } = await rpc
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-8 py-10">
      <h1 className="mb-1 text-center text-xl font-bold text-orange-600">先建个小档案 👋</h1>
      <p className="mb-6 text-center text-sm text-gray-400">让对方知道是谁点的菜</p>

      {/* 头像 */}
      <div className="mb-5 flex flex-col items-center">
        <label className="cursor-pointer">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-3xl text-orange-400">📷</div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
        </label>
        <span className="mt-2 text-xs text-gray-400">点一下传头像</span>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="你的名字，比如 阿明"
        className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
      />

      {/* 创建 or 加入 */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 rounded-xl py-2.5 text-sm ${mode === 'create' ? 'bg-orange-100 font-bold text-orange-600 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-500'}`}
        >
          🏠 创建新的小家
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 rounded-xl py-2.5 text-sm ${mode === 'join' ? 'bg-orange-100 font-bold text-orange-600 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-500'}`}
        >
          🔑 用邀请码加入
        </button>
      </div>

      {mode === 'create' ? (
        <p className="mb-5 text-xs text-gray-400">创建后会生成一个邀请码，发给对方就能一起用。</p>
      ) : (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="输入对方给你的邀请码"
          className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 uppercase outline-none focus:border-orange-400"
        />
      )}

      {err && <div className="mb-3 text-sm text-red-500">{err}</div>}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? '稍等…' : '进入厨房 🍳'}
      </button>

      <button onClick={() => supabase.auth.signOut()} className="mt-4 text-center text-xs text-gray-400">
        退出登录
      </button>
    </div>
  )
}
