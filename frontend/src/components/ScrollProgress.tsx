import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-[2px]">
      <div
        className="h-full rounded-r-full transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)',
          boxShadow: '0 0 8px rgba(56,189,248,0.5)',
        }}
      />
    </div>
  )
}
