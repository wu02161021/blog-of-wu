import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import type { Group, Material, Object3D } from 'three'
import { ErrorBoundary } from './ErrorBoundary'

/* ── Data ── */
export const characters = [
  { id: 'kernel-bishop', modelPath: '/kernel-bishop-chess-piece/source/KernelBishop.glb', titleSegments: ['心有山海', '静水流深', '光而不耀'] as [string, string, string], tags: ['React · R3F 三维引擎', 'NestJS · 微服务架构', 'PostgreSQL · 数据建模'] as [string, string, string] },
  { id: 'corn-pawn', modelPath: '/corn-pawn-chess-piece/source/CornPawn.glb', titleSegments: ['清风徐来', '水波不兴', '岁月静好'] as [string, string, string], tags: ['GSAP · 硬件加速', 'Tailwind · 治愈美学', 'Framer Motion · 微交互'] as [string, string, string] },
  { id: 'corn-bishop', modelPath: '/corn-bishop-chess-piece/source/CornBishop.glb', titleSegments: ['行而不辍', '履践致远', '星河长明'] as [string, string, string], tags: ['TypeScript · 类型安全', 'ECharts · 数据叙事', 'WebSocket · 实时推送'] as [string, string, string] },
  { id: 'queen', modelPath: '/queen-chess-piece/source/Queen.glb', titleSegments: ['以梦为马', '不负韶华', '人间值得'] as [string, string, string], tags: ['品牌视觉 · 统一美学', '3D 渲染 · GPU 加速', '交互设计 · 人本理念'] as [string, string, string] },
]

/* ── Helpers ── */
function setModelOpacity(object: Object3D | null, opacity: number) {
  if (!object) return
  object.traverse((child) => {
    const m = child as Object3D & { material?: Material | Material[] }
    if (!m.material) return
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    for (const mat of mats) if ('opacity' in mat) { mat.transparent = opacity < 0.999; mat.opacity = opacity }
  })
}

/* ── 3D Avatar Model ── */
const AvatarModel = memo(function AvatarModel({
  activeIndex, mouseRef, scrollRef, reducedMotion, clickBoostRef,
}: {
  activeIndex: number
  mouseRef: MutableRefObject<{ x: number; y: number }>
  scrollRef: MutableRefObject<number>
  reducedMotion: boolean
  clickBoostRef: MutableRefObject<{ model: number }>
}) {
  const kernel = useGLTF(characters[0].modelPath)
  const pawn = useGLTF(characters[1].modelPath)
  const bishop = useGLTF(characters[2].modelPath)
  const queen = useGLTF(characters[3].modelPath)
  const models = useMemo(() => [kernel.scene.clone(true), pawn.scene.clone(true), bishop.scene.clone(true), queen.scene.clone(true)], [kernel.scene, pawn.scene, bishop.scene, queen.scene])
  const groupRef = useRef<Group>(null)
  const modelRefs = useRef<(Object3D | null)[]>([])
  const intro = useRef({ p: 0 })
  const motion = useRef({ x: 0, y: 0, s: 0 })
  const transition = useRef({ p: 1 })
  const currentIdx = useRef(activeIndex)
  const outgoingIdx = useRef<number | null>(null)

  useEffect(() => { gsap.fromTo(intro.current, { p: 0 }, { p: 1, duration: 1.8, ease: 'power3.out' }) }, [])

  useEffect(() => {
    if (activeIndex === currentIdx.current) return
    outgoingIdx.current = currentIdx.current
    currentIdx.current = activeIndex
    gsap.killTweensOf(transition.current)
    transition.current.p = 0
    gsap.to(transition.current, { p: 1, duration: reducedMotion ? 0.45 : 0.95, ease: 'power2.inOut', onComplete: () => { outgoingIdx.current = null } })
  }, [activeIndex, reducedMotion])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const fs = reducedMotion ? 0.03 : 0.07
    motion.current.x += (mouseRef.current.x - motion.current.x) * fs
    motion.current.y += (mouseRef.current.y - motion.current.y) * fs
    motion.current.s += (scrollRef.current - motion.current.s) * 0.06

    const mgx = reducedMotion ? 0.12 : 0.28; const mgy = reducedMotion ? 0.06 : 0.15
    const yf = reducedMotion ? 0.03 : 0.06
    const sc = 0.26 + intro.current.p * 0.72 + motion.current.s * (reducedMotion ? 0.08 : 0.16) + clickBoostRef.current.model * 0.22
    groupRef.current.scale.setScalar(sc)
    groupRef.current.position.set(motion.current.x * mgx, -0.16 + Math.sin(t * 0.85) * yf + motion.current.y * mgy - motion.current.s * 0.26, -3.8 + intro.current.p * 2.4 + motion.current.s * 0.55)
    groupRef.current.rotation.set(Math.sin(t * 0.55) * (reducedMotion ? 0.06 : 0.12) - motion.current.y * (reducedMotion ? 0.08 : 0.18), t * (reducedMotion ? 0.45 : 0.7) + motion.current.x * (reducedMotion ? 0.08 : 0.14), 0)

    const incoming = currentIdx.current; const outgoing = outgoingIdx.current; const p = transition.current.p
    modelRefs.current.forEach((model, idx) => {
      if (!model) return
      const show = idx === incoming || (outgoing !== null && idx === outgoing)
      model.visible = show
      if (!show) return
      const br = 1 + Math.sin(t * 0.9) * 0.012
      model.rotation.set(Math.sin(t * 0.6) * 0.025, t * 0.22, 0)
      if (outgoing !== null && idx === outgoing) {
        const s = br * (1 - 0.25 * p); model.scale.set(s, s, s); model.position.z = -0.9 * p; setModelOpacity(model, 1 - p)
      } else {
        const s = br * (0.78 + 0.22 * p); model.scale.set(s, s, s); model.position.z = -0.8 + 0.8 * p; setModelOpacity(model, p)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {models.map((model, idx) => (
        <primitive key={characters[idx].id} object={model} ref={(n: Object3D | null) => { modelRefs.current[idx] = n }} position={[0, -0.68, 0]} scale={1.62} visible={idx === activeIndex} />
      ))}
    </group>
  )
})

characters.forEach((item) => useGLTF.preload(item.modelPath))

/* ── Hero Section ── */
interface HeroSectionProps {
  activeIndex: number
  onSwitch: (dir: -1 | 1) => void
}

const t = {
  heroTitle: 'text-[28px] sm:text-[42px] lg:text-[52px] font-semibold tracking-[-0.02em] leading-[1.12]',
  tag: 'text-[11px] sm:text-[12px] font-medium tracking-[0.01em]',
}
const fx = {
  hero3d: 'text-slate-800 [text-shadow:0_1px_0_rgba(255,255,255,0.82),0_3px_10px_rgba(30,41,59,0.14)]',
  chip3d: 'text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,0.65),0_2px_6px_rgba(30,41,59,0.08)]',
}

export const HeroSection = memo(function HeroSection({ activeIndex, onSwitch }: HeroSectionProps) {
  const sceneRef = useRef<HTMLElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const clickBoostRef = useRef({ model: 0 })
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const char = characters[activeIndex]

  const handleModelClick = useCallback(() => {
    gsap.killTweensOf(clickBoostRef.current)
    gsap.fromTo(clickBoostRef.current, { model: 0 }, { model: 1, duration: 0.18, repeat: 1, yoyo: true, ease: 'power2.out' })
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }, [])
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = touchStartRef.current; if (!s) return
    const dx = e.changedTouches[0].clientX - s.x; const dy = e.changedTouches[0].clientY - s.y
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) onSwitch(dx > 0 ? -1 : 1)
    touchStartRef.current = null
  }, [onSwitch])

  const mdRef = useRef<{ x: number } | null>(null)
  const onMouseDown = useCallback((e: React.MouseEvent) => { mdRef.current = { x: e.clientX } }, [])
  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const s = mdRef.current; if (!s) return
    if (Math.abs(e.clientX - s.x) > 50) onSwitch(e.clientX > s.x ? -1 : 1)
    mdRef.current = null
  }, [onSwitch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') onSwitch(-1)
      else if (e.key === 'ArrowRight') onSwitch(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSwitch])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync(); mq.addEventListener('change', sync)

    if (canvasWrapRef.current) gsap.fromTo(canvasWrapRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' })
    if (titleRef.current) gsap.fromTo(titleRef.current.querySelectorAll('span'), { y: 34, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: 'back.out(1.7)' })
    if (tagRefs.current.length) gsap.fromTo(tagRefs.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, delay: 0.55, ease: 'power2.out' })

    const scene = sceneRef.current; if (!scene) return () => { mq.removeEventListener('change', sync) }
    const onMove = (e: MouseEvent) => {
      const r = scene.getBoundingClientRect()
      const xa = Math.max(-1.6, Math.min(1.6, ((e.clientX - r.left) / r.width - 0.5) * 2.7))
      const ya = Math.max(-1.6, Math.min(1.6, ((e.clientY - r.top) / r.height - 0.5) * 2.7))
      mouseRef.current.x = xa; mouseRef.current.y = ya
    }
    const onScroll = () => { scrollRef.current = Math.min(1, window.scrollY / 420) }
    const onLeave = () => { mouseRef.current.x = 0; mouseRef.current.y = 0 }
    scene.addEventListener('mousemove', onMove); scene.addEventListener('mouseleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { mq.removeEventListener('change', sync); scene.removeEventListener('mousemove', onMove); scene.removeEventListener('mouseleave', onLeave); window.removeEventListener('scroll', onScroll) }
  }, [reducedMotion])

  useEffect(() => {
    const items = [titleRef.current, ...tagRefs.current].filter(Boolean)
    if (!items.length) return
    gsap.fromTo(items, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: reducedMotion ? 0.35 : 0.62, stagger: 0.06, ease: 'power2.out' })
  }, [activeIndex, reducedMotion])

  return (
    <section
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 pb-16 pt-16 sm:px-6 sm:pt-24"
      ref={sceneRef}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseUp={onMouseUp}
    >
      <div className="relative h-[38vh] sm:h-[45vh] w-full max-w-2xl min-h-[220px] sm:min-h-[320px]" ref={canvasWrapRef}>
        <button aria-label="上一位" className="absolute left-[3%] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/20 text-slate-500 shadow-md backdrop-blur-2xl transition-all duration-300 hover:scale-110 hover:bg-white/55 hover:text-slate-800 hover:shadow-xl hover:border-white/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent group" onClick={() => onSwitch(-1)} type="button">
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button aria-label="下一位" className="absolute right-[3%] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/20 text-slate-500 shadow-md backdrop-blur-2xl transition-all duration-300 hover:scale-110 hover:bg-white/55 hover:text-slate-800 hover:shadow-xl hover:border-white/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent group" onClick={() => onSwitch(1)} type="button">
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        <ErrorBoundary>
          <Canvas camera={{ position: [0, 0.32, 4.6], fov: 32 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: 4 }} onPointerDown={handleModelClick}>
            <ambientLight intensity={0.55} />
            <hemisphereLight args={['#fff8ef', '#b8c8e8', 0.5]} />
            <directionalLight position={[3, 4, 3.5]} intensity={1.4} color="#fff8f0" />
            <directionalLight position={[-2.5, 1.8, 2]} intensity={0.8} color="#e8eeff" />
            <directionalLight position={[0, 2.5, -3.5]} intensity={0.55} color="#ffffff" />
            <directionalLight position={[0, -0.5, 2]} intensity={0.3} color="#fff4e8" />
            <pointLight position={[0, 1.8, 2.5]} intensity={0.8} color="#ffffff" />
            <AvatarModel activeIndex={activeIndex} mouseRef={mouseRef} scrollRef={scrollRef} reducedMotion={reducedMotion} clickBoostRef={clickBoostRef} />
            <ContactShadows position={[0, -1.18, 0]} opacity={0.42} scale={7} blur={2.2} far={3.5} />
          </Canvas>
        </ErrorBoundary>
      </div>

      <h1 className={`mt-6 text-center ${t.heroTitle} ${fx.hero3d}`} ref={titleRef}>
        <span className="inline-block">{char.titleSegments[0]}</span>{' '}
        <span className="inline-block">{char.titleSegments[1]}</span>{' '}
        <span className="inline-block">{char.titleSegments[2]}</span>
      </h1>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {char.tags.map((tag, idx) => (
          <span className={`rounded-full border border-slate-200/60 bg-white/55 px-3 py-1 text-slate-600 transition-all duration-300 ease-out hover:bg-white/85 hover:shadow-[0_0_18px_rgba(148,163,184,0.25)] hover:scale-[1.04] hover:border-slate-300/60 hover:text-slate-800 cursor-default select-none ${t.tag} ${fx.chip3d}`} key={tag} ref={n => { tagRefs.current[idx] = n }}>{tag}</span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {characters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => i !== activeIndex && onSwitch(i > activeIndex ? 1 : -1)}
              className={`rounded-full transition-all duration-500 ease-out ${
                i === activeIndex
                  ? 'h-2 w-7 bg-slate-700 shadow-[0_0_14px_rgba(51,65,85,0.55)]'
                  : 'h-2 w-2 bg-slate-300/50 hover:bg-slate-400/60 hover:scale-125 hover:shadow-[0_0_8px_rgba(148,163,184,0.35)]'
              }`}
              aria-label={c.titleSegments[2]}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-slate-400 tabular-nums select-none">{activeIndex + 1} / {characters.length}</span>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium tracking-[0.15em] text-slate-400/30 uppercase select-none">Scroll</span>
        <svg className="h-4 w-4 animate-bounce text-slate-400/35" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </section>
  )
})
