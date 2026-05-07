import { memo } from 'react'

const t = {
  heroTitle: 'text-[28px] sm:text-[42px] lg:text-[52px] font-semibold tracking-[-0.02em] leading-[1.12]',
}
const fx = {
  hero3d: 'text-white [text-shadow:0_1px_0_rgba(255,255,255,0.35),0_3px_20px_rgba(2,8,20,0.55)]',
}

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
      <h1 className={`mt-6 text-center ${t.heroTitle} ${fx.hero3d}`}>
        <span className="inline-block">心有山海</span>{' '}
        <span className="inline-block">静而无忧</span>
      </h1>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase select-none">Scroll</span>
        <svg className="h-4 w-4 animate-bounce text-white/45" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </section>
  )
})
