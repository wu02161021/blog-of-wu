import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastCtx {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    setItems(prev => [...prev.slice(-4), { id, message, type }])
    const timer = setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
      timers.current.delete(id)
    }, 3500)
    timers.current.set(id, timer)
  }, [])

  useEffect(() => {
    return () => { timers.current.forEach(t => clearTimeout(t)) }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map((item) => (
          <ToastBar key={item.id} item={item} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastBar({ item }: { item: ToastItem }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    gsap.fromTo(el, { x: 60, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.4)' })
    const timer = setTimeout(() => {
      gsap.to(el, { x: 40, opacity: 0, duration: 0.25, ease: 'power2.in' })
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const colors = {
    success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-400/40 bg-red-500/10 text-red-200',
    info: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div ref={ref} className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border backdrop-blur-xl px-4 py-3 text-sm shadow-2xl ${colors[item.type]}`}>
      <span className="text-base font-bold">{icons[item.type]}</span>
      <span>{item.message}</span>
    </div>
  )
}
