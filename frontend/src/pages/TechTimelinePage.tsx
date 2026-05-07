import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { ChessboardSection } from '../components/ChessboardSection'
import { ScrollProgress } from '../components/ScrollProgress'
import { BackToTop } from '../components/BackToTop'
import { Footer } from '../components/Footer'
import { FPSMonitor } from '../components/FPSMonitor'
import { useAutoTheme } from '../hooks/useAutoTheme'

const ChessboardModal = lazy(() => import('../components/ChessboardModal').then(m => ({ default: m.ChessboardModal })))

const Header = memo(function Header({
  onEnterConsole,
}: {
  onEnterConsole: () => void
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex w-full items-center justify-between p-4 sm:p-6">
      <div />
      <div className="flex items-center gap-2">
        <button
          className="glass-btn rounded-full px-5 py-2.5 min-h-[44px] text-[11px] font-semibold tracking-[0.12em] text-slate-700/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:shadow-[0_4px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] active:scale-95"
          onClick={onEnterConsole}
        >Console</button>
      </div>
    </header>
  )
})

function VideoBackground() {
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.play().catch(() => {
      const resume = () => { el.play(); document.removeEventListener('pointerdown', resume) }
      document.addEventListener('pointerdown', resume)
    })
  }, [])

  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#0a0f1e] via-[#0d1528] to-[#050a18]" />
      <video
        ref={ref}
        autoPlay muted loop playsInline disableRemotePlayback preload="auto"
        className={`pointer-events-none fixed inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        src="/back.mp4"
        onCanPlay={() => setReady(true)}
      />
    </>
  )
}

export function TechTimelinePage() {
  useAutoTheme()
  const navigate = useNavigate()
  const [isLeaving, setIsLeaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleEnterConsole = useCallback(() => {
    if (isLeaving) return
    setIsLeaving(true)
    window.setTimeout(() => navigate('/login'), 320)
  }, [navigate, isLeaving])

  const handleOpenModal = useCallback(() => {
    window.setTimeout(() => setModalOpen(true), 260)
  }, [])

  return (
    <main id="homepage-root" className={`tech-page overflow-x-hidden transition-all duration-300 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>
      <VideoBackground />

      <ScrollProgress />
      <BackToTop />
      <FPSMonitor />

      <Header onEnterConsole={handleEnterConsole} />

      <HeroSection />

      <ChessboardSection onOpenModal={handleOpenModal} />

      <Footer />

      {modalOpen && (
        <Suspense fallback={null}>
          <ChessboardModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </Suspense>
      )}
    </main>
  )
}
