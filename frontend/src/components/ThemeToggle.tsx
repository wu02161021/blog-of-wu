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
      className="rounded-full border border-white/50 bg-white/30 px-3 py-1.5 text-sm backdrop-blur-md transition-all duration-300 hover:bg-white/50 hover:shadow-md active:scale-95"
      aria-label="切换主题"
    >
      {dark ? '☀️ 浅色' : '🌙 深色'}
    </button>
  )
})
