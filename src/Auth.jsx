import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const fn =
      mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password: pw })
        : supabase.auth.signUp({ email, password: pw })
    const { error } = await fn
    setBusy(false)
    if (error) setErr(error.message)
    // 成功后 onAuthStateChange 会自动切到主界面
  }

  return (
    <div className="auth-page flex min-h-full flex-col items-center justify-center px-6">
      <div className="auth-emblem mb-6">🍳</div>
      <div className="mb-8 text-center">
        <div className="app-eyebrow">OUR LITTLE KITCHEN</div>
        <h1 className="app-title mt-2">我们的厨房</h1>
        <p className="mt-2 text-sm text-slate-500">两个人的点餐 · 想吃 · 记账</p>
      </div>

      <form onSubmit={submit} className="glass-card w-full max-w-sm space-y-3 p-5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
        />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="密码（至少 6 位）"
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
        />
        {err && <div className="text-sm text-red-500">{err}</div>}
        <button
          disabled={busy}
          className="primary-button w-full py-3 font-bold active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? '稍等…' : mode === 'login' ? '登录' : '注册'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr('') }}
        className="mt-5 text-sm text-orange-500"
      >
        {mode === 'login' ? '还没有账号？去注册' : '已有账号？去登录'}
      </button>
    </div>
  )
}
