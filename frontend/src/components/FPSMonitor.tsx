import { useEffect, useRef, useState } from 'react'

export function FPSMonitor() {
  const [fps, setFps] = useState(0)
  const [mem, setMem] = useState(0)
  const [show, setShow] = useState(false)
  const frames = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'F2') setShow(prev => !prev) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!show) return
    let raf = 0
    const tick = () => {
      frames.current++
      const now = performance.now()
      if (now - last.current >= 1000) {
        setFps(frames.current)
        frames.current = 0
        last.current = now
        if ((performance as any).memory) {
          setMem(Math.round((performance as any).memory.usedJSHeapSize / 1048576))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 z-[70] rounded-xl border border-white/20 bg-black/60 backdrop-blur-md px-4 py-2.5 text-xs font-mono text-white shadow-xl">
      <div className="flex items-center gap-4">
        <span>FPS <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-amber-400' : 'text-emerald-400'}>{fps}</span></span>
        {mem > 0 && <span>MEM <span className="text-sky-400">{mem}MB</span></span>}
        <span className="text-slate-500 text-[10px]">F2 开关</span>
      </div>
    </div>
  )
}
