import { useEffect } from 'react'

function isNight(): boolean {
  const h = new Date().getHours()
  return h < 6 || h >= 19
}

export function useAutoTheme() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute('data-theme', isNight() ? 'dark' : 'light')
    }
    apply()
    const timer = setInterval(apply, 60000)
    return () => clearInterval(timer)
  }, [])
}
