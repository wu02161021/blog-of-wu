import { memo } from 'react'

export const Footer = memo(function Footer() {
  return (
    <footer className="relative border-t border-white/20 bg-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-6">
        <span className="text-xs text-slate-500">© 2026 Blog of Wuyuyang</span>
      </div>
    </footer>
  )
})
