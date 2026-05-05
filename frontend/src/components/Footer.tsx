import { memo } from 'react'

export const Footer = memo(function Footer() {
  return (
    <footer className="relative border-t border-white/20 bg-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <span className="text-xs text-slate-500">© 2026 wu yu yang. All rights reserved.</span>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>QQ：421766153</span>
          <span className="text-slate-400">|</span>
          <span>Email：421766153@qq.com</span>
        </div>
      </div>
    </footer>
  )
})
