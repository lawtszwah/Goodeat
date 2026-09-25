import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kitchen-theme'
const isManualTheme = (value) => value === 'light' || value === 'dark'

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isManualTheme(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export default function useTheme() {
  const [preference, setPreference] = useState(readPreference)

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const dark = preference === 'dark' || (preference === 'system' && systemTheme.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171923' : '#f7edf0')
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', dark ? 'black-translucent' : 'default')
    }

    const syncPreference = (event) => {
      if (event.key === STORAGE_KEY) setPreference(isManualTheme(event.newValue) ? event.newValue : 'system')
    }

    applyTheme()
    if (systemTheme.addEventListener) systemTheme.addEventListener('change', applyTheme)
    else systemTheme.addListener(applyTheme)
    window.addEventListener('storage', syncPreference)
    return () => {
      if (systemTheme.removeEventListener) systemTheme.removeEventListener('change', applyTheme)
      else systemTheme.removeListener(applyTheme)
      window.removeEventListener('storage', syncPreference)
    }
  }, [preference])

  const changePreference = (value) => {
    if (value !== 'system' && !isManualTheme(value)) return
    setPreference(value)
    try {
      if (value === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // The current session can still change theme when storage is unavailable.
    }
  }

  return [preference, changePreference]
}
