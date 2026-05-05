import { useCallback, useEffect, useState } from 'react'
import gsap from 'gsap'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const refCallback = useCallback((el: HTMLButtonElement | null) => {
    if (!el) return
    if (visible) {
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' })
    } else {
      gsap.to(el, { opacity: 0, scale: 0.8, duration: 0.2, ease: 'power2.in' })
    }
  }, [visible])

  return (
    <button
      ref={refCallback}
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-500 shadow-lg backdrop-blur-xl transition-colors hover:bg-white/80 hover:text-slate-700"
      aria-label="回到顶部"
      style={{ opacity: 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
