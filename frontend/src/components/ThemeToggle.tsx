import { memo, useCallback, useEffect, useState } from 'react'

export const ThemeToggle = memo(function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  useEffect(() => {
    const el = document.documentElement
    if (!el.hasAttribute('data-theme')) el.setAttribute('data-theme', 'light')
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      className="glass-btn rounded-full px-3 py-1.5 text-sm transition-all duration-300 hover:border-white/70 hover:shadow-[0_4px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] active:scale-95"
      aria-label="切换主题"
    >
      {dark ? '☀️ 浅色' : '🌙 深色'}
    </button>
  )
})
