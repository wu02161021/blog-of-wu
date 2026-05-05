import { memo } from 'react'

export const Waveform = memo(function Waveform({ active, boost = 0 }: { active: boolean; boost?: number }) {
  if (!active) {
    return <span className="inline-block w-4 text-center text-slate-500">○</span>
  }

  return (
    <span className="inline-flex items-end gap-[1.5px] h-4 align-middle">
      {[0.6, 0.9, 0.4, 1, 0.5, 0.8, 0.3, 0.7].map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-gradient-to-t from-sky-400 to-indigo-400"
          style={{
            height: `${Math.max(4, h * 14 * (1 + boost * 0.5))}px`,
            animation: `waveform-bar ${0.5 + i * 0.12}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </span>
  )
})
