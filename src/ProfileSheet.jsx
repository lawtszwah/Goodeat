import { useState } from 'react'
import { supabase } from './supabase'
import { uploadAvatar, CURRENCIES } from './useCloud'
import Avatar from './components/Avatar'

export default function ProfileSheet({ session, profile, home, currency, setCurrency, api, onClose }) {
  const [name, setName] = useState(profile?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadAvatar(session.user.id, file)
      setAvatarUrl(url)
      await api.updateProfile({ avatar_url: url })
    } catch (e2) {
      alert('头像上传失败：' + e2.message)
    } finally {
      setBusy(false)
    }
  }

  const saveName = async () => {
    if (name.trim() && name.trim() !== profile?.display_name) {
      await api.updateProfile({ display_name: name.trim() })
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(home?.invite_code || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* 忽略 */ }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="animate-pop max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-5 text-center text-base font-bold text-gray-800">我的资料</h3>

        {/* 头像 + 名字 */}
        <div className="mb-5 flex flex-col items-center">
          <label className="cursor-pointer">
            <Avatar profile={{ display_name: name, avatar_url: avatarUrl }} size={88} />
            <input type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
          </label>
          <span className="mt-2 text-xs text-gray-400">{busy ? '上传中…' : '点头像可更换'}</span>
        </div>

        <div className="mb-2 text-sm font-medium text-gray-600">名字</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="mb-5 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-orange-400"
        />

        {/* 邀请码 */}
        <div className="mb-2 text-sm font-medium text-gray-600">邀请码（发给对方一起用）</div>
        <button
          onClick={copyCode}
          className="mb-5 flex w-full items-center justify-between rounded-xl bg-orange-50 px-4 py-3 active:scale-[0.99]"
        >
          <span className="font-mono text-lg font-bold tracking-widest text-orange-600">{home?.invite_code || '—'}</span>
          <span className="text-sm text-orange-500">{copied ? '已复制 ✓' : '点击复制'}</span>
        </button>

        {/* 货币 */}
        <div className="mb-2 text-sm font-medium text-gray-600">货币</div>
        <div className="mb-6 flex gap-2">
          {Object.entries(CURRENCIES).map(([codeKey, sym]) => (
            <button
              key={codeKey}
              onClick={() => setCurrency(codeKey)}
              className={`flex-1 rounded-xl py-2.5 text-sm ${currency === codeKey ? 'bg-orange-100 font-bold text-orange-600 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-500'}`}
            >
              {sym} {codeKey}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mb-2 w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]">
          完成
        </button>
        <button onClick={() => supabase.auth.signOut()} className="w-full py-2 text-center text-sm text-gray-400">
          退出登录
        </button>
      </div>
    </div>
  )
}
