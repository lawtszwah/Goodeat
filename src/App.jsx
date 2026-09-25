import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useCloud, CURRENCIES, getCurrency, setCurrencyPref } from './useCloud'
import Auth from './Auth'
import Onboarding from './Onboarding'
import ProfileSheet from './ProfileSheet'
import Avatar from './components/Avatar'
import useTheme from './useTheme'
import Cook from './tabs/Cook'
import Wishes from './tabs/Wishes'
import Ledger from './tabs/Ledger'

const TABS = [
  { key: 'cook', label: '点菜', icon: '🍳' },
  { key: 'wish', label: '想吃', icon: '💭' },
  { key: 'ledger', label: '记账', icon: '💰' },
]

export default function App() {
  const [themePreference, setThemePreference] = useTheme()
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
    <div className="app-frame mx-auto h-full max-w-md">
      {session ? <Shell session={session} themePreference={themePreference} setThemePreference={setThemePreference} /> : <Auth />}
    </div>
  )
}

function Center({ children }) {
  return <div className="flex h-full items-center justify-center text-gray-400">{children}</div>
}

function Shell({ session, themePreference, setThemePreference }) {
  const cloud = useCloud(session)
  if (cloud.loading) return <Center>🍳 加载中…</Center>
  if (cloud.needOnboard) return <Onboarding session={session} onDone={cloud.refresh} />
  return <KitchenShell session={session} cloud={cloud} themePreference={themePreference} setThemePreference={setThemePreference} />
}

export function KitchenShell({ session, cloud, themePreference, setThemePreference }) {
  const [tab, setTab] = useState('cook')
  const tabIndexRef = useRef(0)
  const trackRef = useRef(null)
  const indicatorRef = useRef(null)
  const gestureRef = useRef(null)
  const suppressClickUntilRef = useRef(0)
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState(false)
  const [currency, setCurrencyState] = useState(getCurrency())

  const cur = CURRENCIES[currency] || '$'
  const setCurrency = (c) => { setCurrencyPref(c); setCurrencyState(c) }

  const celebrate = useCallback((text) => {
    setToast({ text, id: Date.now() })
    setTimeout(() => setToast(null), 1100)
  }, [])

  const trackNode = useCallback((node) => {
    trackRef.current = node
    if (node) node.style.transform = `translate3d(${-tabIndexRef.current * 100}%, 0, 0)`
  }, [])

  const indicatorNode = useCallback((node) => {
    indicatorRef.current = node
    if (node) node.style.transform = `translate3d(calc(${tabIndexRef.current * 100}% + ${tabIndexRef.current * 3}px), 0, 0)`
  }, [])

  const selectTab = (index) => {
    if (index < 0 || index >= TABS.length) return
    tabIndexRef.current = index
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${-index * 100}%, 0, 0)`
    if (indicatorRef.current) indicatorRef.current.style.transform = `translate3d(calc(${index * 100}% + ${index * 3}px), 0, 0)`
    setTab(TABS[index].key)
  }

  const onTouchStart = (event) => {
    gestureRef.current = null
    if (event.touches.length !== 1 || event.target.closest('input, textarea, select, .sheet-backdrop')) return
    const touch = event.touches[0]
    gestureRef.current = { x: touch.clientX, y: touch.clientY, lastX: touch.clientX, lastAt: performance.now(), velocity: 0, dx: 0, mode: null }
  }

  const onTouchMove = (event) => {
    const gesture = gestureRef.current
    if (!gesture || event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - gesture.x
    const dy = touch.clientY - gesture.y
    if (!gesture.mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      gesture.mode = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'horizontal' : 'vertical'
      if (gesture.mode === 'horizontal') {
        trackRef.current?.classList.add('is-dragging')
        indicatorRef.current?.classList.add('is-dragging')
      }
    }
    if (gesture.mode !== 'horizontal') return

    const index = tabIndexRef.current
    const width = event.currentTarget.clientWidth || 1
    const edgeDrag = (index === 0 && dx > 0) || (index === TABS.length - 1 && dx < 0)
    const visualDx = Math.max(-width, Math.min(width, dx * (edgeDrag ? 0.28 : 1)))
    const indicatorStep = (indicatorRef.current?.getBoundingClientRect().width || 0) + 3
    const now = performance.now()
    const elapsed = now - gesture.lastAt
    if (elapsed > 0) gesture.velocity = (touch.clientX - gesture.lastX) / elapsed
    gesture.lastX = touch.clientX
    gesture.lastAt = now
    gesture.dx = dx
    if (trackRef.current) trackRef.current.style.transform = `translate3d(calc(${-index * 100}% + ${visualDx}px), 0, 0)`
    if (indicatorRef.current) indicatorRef.current.style.transform = `translate3d(calc(${index * 100}% + ${index * 3}px + ${(-visualDx / width) * indicatorStep}px), 0, 0)`
  }

  const finishTouch = (cancelled = false) => {
    const gesture = gestureRef.current
    gestureRef.current = null
    if (gesture?.mode !== 'horizontal') return
    const index = tabIndexRef.current
    const width = trackRef.current?.parentElement?.clientWidth || 1
    const flick = Math.abs(gesture.dx) > 18 && Math.abs(gesture.velocity) > 0.4 && performance.now() - gesture.lastAt < 120
    const shouldMove = !cancelled && (Math.abs(gesture.dx) > Math.min(80, width * 0.2) || flick)
    const next = shouldMove ? Math.max(0, Math.min(TABS.length - 1, index - Math.sign(gesture.dx))) : index
    // Commit the dragged position before enabling the settling animation.
    if (trackRef.current) void trackRef.current.offsetWidth
    trackRef.current?.classList.remove('is-dragging')
    indicatorRef.current?.classList.remove('is-dragging')
    suppressClickUntilRef.current = performance.now() + 180
    selectTab(next)
  }

  // 成员 map，方便按 id 取头像/名字
  const memberMap = {}
  for (const m of cloud.members) memberMap[m.id] = m

  const shared = { ...cloud, me: cloud.profile, memberMap, cur, celebrate }

  return (
    <div className="app-shell flex h-full flex-col">
      {/* 顶栏 */}
      <header className="app-header safe-top sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div>
            <div className="app-eyebrow">OUR LITTLE KITCHEN</div>
            <h1 className="app-title">我们的厨房</h1>
          </div>
          <button onClick={() => setSettings(true)} className="profile-trigger" aria-label="打开我的资料">
            <Avatar profile={cloud.profile} size={28} />
            <span className="max-w-20 truncate text-sm font-semibold">{cloud.profile?.display_name}</span>
          </button>
        </div>
      </header>

      {/* 内容 */}
      <main
        className="tab-viewport flex-1"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => finishTouch()}
        onTouchCancel={() => finishTouch(true)}
        onClickCapture={(event) => {
          if (performance.now() < suppressClickUntilRef.current) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        <div ref={trackNode} className="tab-track">
          <section className="tab-page app-content" aria-hidden={tab !== 'cook'} inert={tab !== 'cook' ? '' : undefined}>
            <Cook {...shared} />
          </section>
          <section className="tab-page app-content" aria-hidden={tab !== 'wish'} inert={tab !== 'wish' ? '' : undefined}>
            <Wishes {...shared} />
          </section>
          <section className="tab-page app-content" aria-hidden={tab !== 'ledger'} inert={tab !== 'ledger' ? '' : undefined}>
            <Ledger {...shared} />
          </section>
        </div>
      </main>

      {/* 底部 Tab */}
      <nav className="tab-dock-wrap safe-bottom fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2" aria-label="主导航">
        <div className="tab-dock flex">
          <span ref={indicatorNode} className="tab-indicator" aria-hidden="true" />
          {TABS.map((t, index) => (
            <button
              key={t.key}
              onClick={() => selectTab(index)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={`tab-item flex flex-1 flex-col items-center gap-0.5 text-xs transition ${tab === t.key ? 'is-active' : ''}`}
            >
              <span className="tab-emoji" aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 仪式感提示 */}
      {toast && (
        <div key={toast.id} className="glass-toast animate-floatup pointer-events-none fixed bottom-32 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap px-4 py-2 text-sm font-bold">
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
          themePreference={themePreference}
          setThemePreference={setThemePreference}
          api={cloud.api}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  )
}
