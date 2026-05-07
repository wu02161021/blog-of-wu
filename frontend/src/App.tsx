import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RouteTracker } from './components/RouteTracker'

const TechTimelinePage = lazy(() => import('./pages/TechTimelinePage').then(m => ({ default: m.TechTimelinePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
  </div>
)

function PersistentVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const loc = useLocation()
  const isHome = loc.pathname === '/'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.play().catch(() => {
      const resume = () => { el.play(); document.removeEventListener('pointerdown', resume) }
      document.addEventListener('pointerdown', resume)
    })
  }, [])

  return (
    <div className={isHome ? '' : 'opacity-0 pointer-events-none'} style={{ transition: 'opacity 0.3s' }}>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#0a0f1e] via-[#0d1528] to-[#050a18]" />
      <video
        ref={ref}
        autoPlay muted loop playsInline disableRemotePlayback preload="auto"
        className={`pointer-events-none fixed inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        src="/back.mp4"
        onCanPlay={() => setReady(true)}
      />
    </div>
  )
}

function App() {
  return (
    <>
      <PersistentVideo />
      <RouteTracker />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<TechTimelinePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
