import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import type { Group, Material, Object3D } from 'three'
import { ErrorBoundary } from './ErrorBoundary'

/* ── Data ── */
export const characters = [
  { id: 'kernel-bishop', modelPath: '/kernel-bishop-chess-piece/source/KernelBishop.glb', titleSegments: ['全栈架构', '极致性能', 'Kernel Bishop'] as [string, string, string], tags: ['React · R3F 三维引擎', 'NestJS · 微服务架构', 'PostgreSQL · 数据建模'] as [string, string, string], subtitle: '以代码为棋，布全局之局。从交互到服务端，每一层都追求极致的可维护与高性能。', bubble: '我是 Kernel Bishop，执棋布局，掌控全栈。' },
  { id: 'corn-pawn', modelPath: '/corn-pawn-chess-piece/source/CornPawn.glb', titleSegments: ['产品体验', '丝滑动效', 'Corn Pawn'] as [string, string, string], tags: ['GSAP · 硬件加速', 'Tailwind · 治愈美学', 'Framer Motion · 微交互'] as [string, string, string], subtitle: '一兵一卒，皆是体验。用柔和而精准的动效，让每一次点击都成为享受。', bubble: '我是 Corn Pawn，守护每一个像素的温度。' },
  { id: 'corn-bishop', modelPath: '/corn-bishop-chess-piece/source/CornBishop.glb', titleSegments: ['数据智能', '可视化洞察', 'Corn Bishop'] as [string, string, string], tags: ['TypeScript · 类型安全', 'ECharts · 数据叙事', 'WebSocket · 实时推送'] as [string, string, string], subtitle: '数据是新时代的棋盘，洞察是致胜的关键。让每一个数字都讲述它的故事。', bubble: '我是 Corn Bishop，用数据描绘世界的轮廓。' },
  { id: 'queen', modelPath: '/queen-chess-piece/source/Queen.glb', titleSegments: ['创意设计', '视觉叙事', 'Queen'] as [string, string, string], tags: ['品牌视觉 · 统一美学', '3D 渲染 · GPU 加速', '交互设计 · 人本理念'] as [string, string, string], subtitle: '皇后之棋，万象皆美。以视觉叙事串联页面，让技术与艺术在此相遇。', bubble: '我是 Queen，执掌全局之美，定义视觉边界。' },
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

  useEffect(() => { gsap.fromTo(intro.current, { p: 0 }, { p: 1, duration: 2.25, ease: 'elastic.out(1,0.55)' }) }, [])

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

    const mgx = reducedMotion ? 0.14 : 0.38; const mgy = reducedMotion ? 0.08 : 0.2
    const yf = reducedMotion ? 0.04 : 0.09
    const sc = 0.22 + intro.current.p * 0.76 + motion.current.s * (reducedMotion ? 0.1 : 0.2) + clickBoostRef.current.model * 0.26
    groupRef.current.scale.setScalar(sc)
    groupRef.current.position.set(motion.current.x * mgx, -0.24 + Math.sin(t * 0.95) * yf + motion.current.y * mgy - motion.current.s * 0.3, -3.95 + intro.current.p * 2.55 + motion.current.s * 0.66)
    groupRef.current.rotation.set(Math.sin(t * 0.6) * (reducedMotion ? 0.08 : 0.16) - motion.current.y * (reducedMotion ? 0.1 : 0.24), t * (reducedMotion ? 0.52 : 0.85) + motion.current.x * (reducedMotion ? 0.1 : 0.18), 0)

    const incoming = currentIdx.current; const outgoing = outgoingIdx.current; const p = transition.current.p
    modelRefs.current.forEach((model, idx) => {
      if (!model) return
      const show = idx === incoming || (outgoing !== null && idx === outgoing)
      model.visible = show
      if (!show) return
      const br = 1 + Math.sin(t * 1.2) * 0.016
      model.rotation.set(Math.sin(t * 0.8) * 0.03, t * 0.25, 0)
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
        <primitive key={characters[idx].id} object={model} ref={(n: Object3D | null) => { modelRefs.current[idx] = n }} position={[0, -0.82, 0]} scale={1.42} visible={idx === activeIndex} />
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
  body: 'text-[13px] sm:text-[16px] font-normal leading-7',
}
const fx = {
  hero3d: 'text-slate-800 [text-shadow:0_1px_0_rgba(255,255,255,0.82),0_3px_10px_rgba(30,41,59,0.14)]',
  body3d: 'text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,0.72),0_3px_8px_rgba(30,41,59,0.1)]',
  chip3d: 'text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,0.65),0_2px_6px_rgba(30,41,59,0.08)]',
}

export const HeroSection = memo(function HeroSection({ activeIndex, onSwitch }: HeroSectionProps) {
  const sceneRef = useRef<HTMLElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
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
    if (bubbleRef.current) gsap.fromTo(bubbleRef.current, { scale: 1 }, { scale: 1.06, duration: 0.16, repeat: 1, yoyo: true, ease: 'power2.out' })
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
    if (subtitleRef.current) gsap.fromTo(subtitleRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, delay: 0.7, duration: 0.7, ease: 'power2.out' })

    const scene = sceneRef.current; if (!scene) return () => { mq.removeEventListener('change', sync) }
    const onMove = (e: MouseEvent) => {
      const r = scene.getBoundingClientRect()
      const xa = Math.max(-1.6, Math.min(1.6, ((e.clientX - r.left) / r.width - 0.5) * 2.7))
      const ya = Math.max(-1.6, Math.min(1.6, ((e.clientY - r.top) / r.height - 0.5) * 2.7))
      mouseRef.current.x = xa; mouseRef.current.y = ya
      if (bubbleRef.current) gsap.to(bubbleRef.current, { x: xa * (reducedMotion ? 10 : 28), y: ya * (reducedMotion ? 8 : 20), rotateZ: xa * (reducedMotion ? 2.4 : 5.8), duration: reducedMotion ? 0.45 : 0.82, ease: 'power3.out', overwrite: true })
    }
    const onScroll = () => { scrollRef.current = Math.min(1, window.scrollY / 420) }
    const onLeave = () => { mouseRef.current.x = 0; mouseRef.current.y = 0; if (bubbleRef.current) gsap.to(bubbleRef.current, { x: 0, y: 0, rotateZ: 0, duration: 0.7, ease: 'power3.out' }) }
    scene.addEventListener('mousemove', onMove); scene.addEventListener('mouseleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { mq.removeEventListener('change', sync); scene.removeEventListener('mousemove', onMove); scene.removeEventListener('mouseleave', onLeave); window.removeEventListener('scroll', onScroll) }
  }, [reducedMotion])

  useEffect(() => {
    const items = [titleRef.current, subtitleRef.current, bubbleRef.current, ...tagRefs.current].filter(Boolean)
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
        <button aria-label="上一位" className="absolute left-[3%] top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/25 text-slate-600/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/50 hover:text-slate-800 hover:shadow-xl hover:border-white/80 active:scale-95" onClick={() => onSwitch(-1)} type="button"><span className="text-2xl leading-none font-light">‹</span></button>
        <button aria-label="下一位" className="absolute right-[3%] top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/25 text-slate-600/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/50 hover:text-slate-800 hover:shadow-xl hover:border-white/80 active:scale-95" onClick={() => onSwitch(1)} type="button"><span className="text-2xl leading-none font-light">›</span></button>
        <ErrorBoundary>
          <Canvas camera={{ position: [0, 0.12, 5.15], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerDown={handleModelClick}>
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#fff8ef', '#c8d4ff', 0.55]} />
            <directionalLight position={[2.3, 3.5, 4]} intensity={1.1} color="#fff4e8" />
            <directionalLight position={[-2.3, 1.6, 1.6]} intensity={0.7} color="#dbe7ff" />
            <directionalLight position={[0, 2.2, -3]} intensity={0.42} color="#ffffff" />
            <pointLight position={[0.2, 1.6, 1.8]} intensity={0.65} color="#ffffff" />
            <AvatarModel activeIndex={activeIndex} mouseRef={mouseRef} scrollRef={scrollRef} reducedMotion={reducedMotion} clickBoostRef={clickBoostRef} />
            <ContactShadows position={[0, -1.28, 0]} opacity={0.36} scale={6.6} blur={2.6} far={3.8} />
          </Canvas>
        </ErrorBoundary>
        <div className="pointer-events-none absolute right-[6%] top-[10%] rounded-2xl border border-white/70 bg-white/85 px-5 py-3 text-slate-700 shadow-[0_16px_36px_rgba(30,41,59,0.16)] backdrop-blur-2xl" ref={bubbleRef}>
          <span className={`${t.body} ${fx.body3d}`}>{char.bubble}</span>
        </div>
      </div>

      <h1 className={`mt-6 text-center ${t.heroTitle} ${fx.hero3d}`} ref={titleRef}>
        <span className="inline-block">{char.titleSegments[0]}</span>{' '}
        <span className="inline-block">{char.titleSegments[1]}</span>{' '}
        <span className="inline-block">{char.titleSegments[2]}</span>
      </h1>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {char.tags.map((tag, idx) => (
          <span className={`rounded-full border border-slate-300/70 bg-white/65 px-3 py-1 text-slate-700 transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:scale-105 hover:border-sky-300/80 cursor-default ${t.tag} ${fx.chip3d}`} key={tag} ref={n => { tagRefs.current[idx] = n }}>{tag}</span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {characters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => i !== activeIndex && onSwitch(i > activeIndex ? 1 : -1)}
              className={`rounded-full transition-all duration-500 ${
                i === activeIndex
                  ? 'h-2 w-7 bg-slate-700 shadow-[0_0_12px_rgba(51,65,85,0.5)]'
                  : 'h-2 w-2 bg-slate-400/40 hover:bg-slate-400/70 hover:scale-125'
              }`}
              aria-label={c.titleSegments[2]}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-slate-500 tabular-nums">{activeIndex + 1} / {characters.length}</span>
      </div>

      <p className={`mt-5 max-w-2xl text-center ${t.body} ${fx.body3d}`} ref={subtitleRef}>{char.subtitle}</p>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-bounce">
        <span className="text-xl text-slate-400/40">⌄</span>
      </div>
    </section>
  )
})
