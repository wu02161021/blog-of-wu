import { memo, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { ErrorBoundary } from './ErrorBoundary'
import { ChessboardSkeleton } from './Skeletons'
import { mediaApi, type MediaImage, type MediaVideo } from '../services/media'
import { API_BASE_URL } from '../config/env'
import { ImageLightbox } from './ImageLightbox'

function toFullUrl(url: string) {
  if (url.startsWith('http')) return url
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.replace(/\/api$/, '') + url
  }
  return url
}

/* ── 3D Chessboard ── */
const ChessBoardModel = memo(function ChessBoardModel() {
  const { scene } = useGLTF('/autumn-chess-board/source/ChessBoard.glb')
  return <primitive object={scene.clone(true)} />
})
useGLTF.preload('/autumn-chess-board/source/ChessBoard.glb')

const ChessBoardCanvas = memo(function ChessBoardCanvas() {
  return (
    <Canvas camera={{ position: [1.5, 2, 3.8], fov: 36 }} gl={{ antialias: true }}>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#fff8ef', '#c8d4ff', 0.45]} />
      <directionalLight position={[3, 4, 3]} intensity={0.9} color="#fff4e8" />
      <directionalLight position={[-2, 1.5, 1.5]} intensity={0.5} color="#dbe7ff" />
      <pointLight position={[0, 2, 2]} intensity={0.6} color="#ffffff" />
      <Suspense fallback={null}><ChessBoardModel /></Suspense>
      <ContactShadows position={[0, -0.9, 0]} opacity={0.3} scale={5} blur={2.4} far={3} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
    </Canvas>
  )
})

/* ── Lazy container ── */
function LazyBlock({ children, placeholder }: { children: React.ReactNode; placeholder?: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return <div ref={ref} className="h-full w-full">{visible ? children : placeholder}</div>
}

/* ── Section ── */
interface ChessboardSectionProps {
  onOpenModal: () => void
}

export const ChessboardSection = memo(function ChessboardSection({ onOpenModal }: ChessboardSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [images, setImages] = useState<MediaImage[]>([])
  const [videos, setVideos] = useState<MediaVideo[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const fetchMedia = useCallback(async () => {
    try {
      const [imgs, vids] = await Promise.all([mediaApi.listImages(), mediaApi.listVideos()])
      setImages(imgs)
      setVideos(vids)
    } catch { /* fallback to empty */ }
  }, [])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  useEffect(() => {
    const el = sectionRef.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const el = sectionRef.current; if (!el) return
    const cards = el.querySelectorAll('.s2-card, .s2-module')
    gsap.fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' })
  }, [visible])

  return (
    <>
    <section ref={sectionRef} className="relative flex min-h-screen w-full items-center px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 lg:flex-row lg:h-[75vh]">
        {/* Left: Chessboard */}
        <div
          className="s2-card group relative h-[320px] sm:h-[400px] lg:h-auto flex-1 cursor-pointer overflow-hidden rounded-3xl border border-white/50 bg-white/15 backdrop-blur-md shadow-[0_20px_50px_rgba(15,23,42,0.10),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-500 hover:shadow-[0_32px_72px_rgba(15,23,42,0.20),0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:border-white/70 lg:min-h-full"
          onClick={onOpenModal}
        >
          <ErrorBoundary>
            <LazyBlock placeholder={<ChessboardSkeleton />}>
              <ChessBoardCanvas />
            </LazyBlock>
          </ErrorBoundary>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/70 via-white/30 to-transparent" />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/50 bg-white/55 px-6 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur-md transition-all duration-300 group-hover:bg-white/75 group-hover:border-white/80 group-hover:scale-105 shadow-md">查看全部</span>
        </div>

        {/* Right: Modules - bigger */}
        <div className="flex flex-col gap-6 lg:w-[45%] lg:h-full">
          {/* 图片 */}
          <div className="s2-module flex flex-1 flex-col rounded-3xl border border-white/50 bg-white/30 backdrop-blur-md p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300 hover:shadow-[0_20px_44px_rgba(15,23,42,0.13),0_0_0_1px_rgba(255,255,255,0.06)_inset] min-h-0">
            <div className="mb-4 flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-400 to-indigo-400" />
                <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-800">图片</h3>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden min-h-0">
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                  <span className="text-xs">暂无图片</span>
                </div>
              ) : (
                <div className="flex h-full gap-3 animate-carousel-slide">
                  {[...images, ...images].map((img, i) => (
                    <div
                      key={`${img.id}-${i}`}
                      onClick={() => { setLightboxIndex(i % images.length); setLightboxOpen(true) }}
                      className="group/img shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/60 bg-white/30 transition-all duration-300 hover:border-sky-400/70 hover:shadow-xl"
                      style={{ width: 'calc((100% - 12px) / 2)' }}
                    >
                      <img src={toFullUrl(img.fileUrl)} alt={img.title} className="h-full w-full object-cover transition duration-300 group-hover/img:scale-110" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
              {/* fade edges */}
              {images.length > 0 && (
                <>
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/30 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/30 z-10" />
                </>
              )}
            </div>
          </div>

          {/* 视频 */}
          <div className="s2-module flex flex-1 flex-col rounded-3xl border border-white/50 bg-white/30 backdrop-blur-md p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300 hover:shadow-[0_20px_44px_rgba(15,23,42,0.13),0_0_0_1px_rgba(255,255,255,0.06)_inset] min-h-0">
            <div className="mb-4 flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-800">视频</h3>
              </div>
            </div>
            <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-1 min-h-0">
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                  <span className="text-xs">暂无视频</span>
                </div>
              ) : (
                videos.map((vid) => (
                  <div key={vid.id} className="group/vid shrink-0 rounded-2xl border border-white/60 bg-white/30 overflow-hidden transition-all duration-300 hover:border-sky-400/70 hover:shadow-xl">
                    <video src={toFullUrl(vid.fileUrl)} controls preload="metadata" className="w-full aspect-video object-cover bg-black/20" />
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{vid.title}</p>
                        {vid.description && <p className="mt-0.5 text-xs text-slate-500 truncate">{vid.description}</p>}
                      </div>
                      {vid.duration && <span className="text-xs text-slate-400 shrink-0 font-medium">{vid.duration}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images.map(img => ({ src: toFullUrl(img.fileUrl), alt: img.title }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
})
