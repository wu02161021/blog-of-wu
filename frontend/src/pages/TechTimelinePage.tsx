import { lazy, memo, Suspense, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroSection, characters } from '../components/HeroSection'
import { ChessboardSection } from '../components/ChessboardSection'
import { ScrollProgress } from '../components/ScrollProgress'
import { BackToTop } from '../components/BackToTop'
import { ThemeToggle } from '../components/ThemeToggle'
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
        <ThemeToggle />
        <button
          className="rounded-full border border-white/60 bg-white/40 px-5 py-2 text-[11px] font-semibold tracking-[0.12em] text-slate-700/80 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-lg hover:border-white/80 active:scale-95"
          onClick={onEnterConsole}
        >Console</button>
      </div>
    </header>
  )
})

export function TechTimelinePage() {
  useAutoTheme()
  const navigate = useNavigate()
  const [isLeaving, setIsLeaving] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  const handleEnterConsole = useCallback(() => {
    if (isLeaving) return
    setIsLeaving(true)
    window.setTimeout(() => navigate('/login'), 320)
  }, [navigate, isLeaving])

  const switchCharacter = useCallback((dir: -1 | 1) => {
    setActiveIndex(prev => (prev + dir + characters.length) % characters.length)
  }, [])

  const handleOpenModal = useCallback(() => {
    window.setTimeout(() => setModalOpen(true), 260)
  }, [])

  return (
    <main id="homepage-root" className={`tech-page overflow-x-hidden transition-all duration-300 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>
      <div className="pointer-events-none fixed inset-0 animate-bg-drift bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.18),transparent_38%),radial-gradient(circle_at_84%_16%,rgba(167,139,250,0.18),transparent_36%),linear-gradient(155deg,#eef4ff_0%,#e8effc_35%,#dde7fb_72%,#eaf2ff_100%)]" style={{ backgroundSize: '120% 120%' }} />
      <div className="pointer-events-none fixed inset-0 opacity-70 animate-bg-shimmer bg-[radial-gradient(circle_at_52%_50%,rgba(255,255,255,0.68),rgba(255,255,255,0)_58%)]" style={{ backgroundSize: '150% 150%' }} />

      <ScrollProgress />
      <BackToTop />
      <FPSMonitor />

      <Header onEnterConsole={handleEnterConsole} />

      <HeroSection activeIndex={activeIndex} onSwitch={switchCharacter} />

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
