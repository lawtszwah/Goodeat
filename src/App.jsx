import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useCloud, CURRENCIES, getCurrency, setCurrencyPref } from './useCloud'
import Auth from './Auth'
import Onboarding from './Onboarding'
import ProfileSheet from './ProfileSheet'
import Avatar from './components/Avatar'
import Cook from './tabs/Cook'
import Wishes from './tabs/Wishes'
import Ledger from './tabs/Ledger'

const TABS = [
  { key: 'cook', label: '点菜', icon: '🍳' },
  { key: 'wish', label: '想吃', icon: '💭' },
  { key: 'ledger', label: '记账', icon: '💰' },
]

export default function App() {
  const [session, setSession] = useState(undefined) // undefined=未知, null=未登录

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <Center>🍳 加载中…</Center>
  }

  return (
    <div className="mx-auto h-full max-w-md bg-[#fff7f3]">
      {session ? <Shell session={session} /> : <Auth />}
    </div>
  )
}

function Center({ children }) {
  return <div className="flex h-full items-center justify-center text-gray-400">{children}</div>
}

function Shell({ session }) {
  const cloud = useCloud(session)
  const [tab, setTab] = useState('cook')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState(false)
  const [currency, setCurrencyState] = useState(getCurrency())

  const cur = CURRENCIES[currency] || '$'
  const setCurrency = (c) => { setCurrencyPref(c); setCurrencyState(c) }

  const celebrate = useCallback((text) => {
    setToast({ text, id: Date.now() })
    setTimeout(() => setToast(null), 1100)
  }, [])

  if (cloud.loading) return <Center>🍳 加载中…</Center>
  if (cloud.needOnboard) return <Onboarding session={session} onDone={cloud.refresh} />

  // 成员 map，方便按 id 取头像/名字
  const memberMap = {}
  for (const m of cloud.members) memberMap[m.id] = m

  const shared = { ...cloud, me: cloud.profile, memberMap, cur, celebrate }

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <header className="safe-top sticky top-0 z-10 bg-[#fff7f3]/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <h1 className="text-lg font-bold text-orange-600">我们的厨房 🍳</h1>
          <button onClick={() => setSettings(true)} className="flex items-center gap-1.5 rounded-full bg-orange-100 py-1 pl-1 pr-3 active:scale-95">
            <Avatar profile={cloud.profile} size={24} />
            <span className="text-sm font-medium text-orange-700">{cloud.profile?.display_name}</span>
          </button>
        </div>
      </header>

      {/* 内容 */}
      <main className="flex-1 overflow-y-auto px-4 pb-28">
        {tab === 'cook' && <Cook {...shared} />}
        {tab === 'wish' && <Wishes {...shared} />}
        {tab === 'ledger' && <Ledger {...shared} />}
      </main>

      {/* 底部 Tab */}
      <nav className="safe-bottom fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-orange-100 bg-white/95 backdrop-blur">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${tab === t.key ? 'text-orange-600' : 'text-gray-400'}`}
            >
              <span className={`text-xl ${tab === t.key ? 'scale-110' : ''} transition`}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 仪式感提示 */}
      {toast && (
        <div key={toast.id} className="animate-floatup pointer-events-none fixed bottom-32 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {toast.text}
        </div>
      )}

      {settings && (
        <ProfileSheet
          session={session}
          profile={cloud.profile}
          home={cloud.home}
          currency={currency}
          setCurrency={setCurrency}
          api={cloud.api}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  )
}
