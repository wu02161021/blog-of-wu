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
      className="glass-btn fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 hover:border-white/70 hover:shadow-[0_4px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]"
      aria-label="回到顶部"
      style={{ opacity: 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
