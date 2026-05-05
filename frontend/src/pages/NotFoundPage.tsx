import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

export function NotFoundPage() {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const children = el.querySelectorAll('.fade-up')
    gsap.fromTo(children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' })
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{
      background: 'radial-gradient(circle at 20% 10%, rgba(56,189,248,0.12), transparent 40%), linear-gradient(170deg, #030712 0%, #0b1022 100%)',
    }}>
      <div ref={ref} className="text-center">
        <div className="fade-up text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-slate-800 select-none"
          style={{ textShadow: '0 0 80px rgba(56,189,248,0.3), 0 0 160px rgba(168,85,247,0.2)' }}>
          404
        </div>
        <h1 className="fade-up mt-2 text-2xl font-semibold text-slate-200 sm:text-3xl">页面未找到</h1>
        <p className="fade-up mt-2 text-sm text-slate-400">你访问的页面不存在或已被移除</p>
        <div className="fade-up mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-400 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
          >返回首页</button>
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95"
          >返回上页</button>
        </div>
      </div>
    </main>
  )
}
