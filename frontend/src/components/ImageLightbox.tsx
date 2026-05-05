import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface LightboxImage {
  src: string
  alt: string
}

interface Props {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (overlayRef.current) gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    if (imgRef.current) gsap.fromTo(imgRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' })
  }, [])

  const goTo = useCallback((dir: -1 | 1) => {
    const next = (index + dir + images.length) % images.length
    gsap.fromTo(imgRef.current, { scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0, duration: 0.15, onComplete: () => {
      setIndex(next)
      gsap.fromTo(imgRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.4)' })
    }})
  }, [index, images.length])

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      else if (e.key === 'ArrowLeft') goTo(-1)
      else if (e.key === 'ArrowRight') goTo(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <button onClick={handleClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white">✕</button>

      <button onClick={() => goTo(-1)} className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur text-2xl transition hover:bg-white/20 hover:text-white">‹</button>

      <img
        ref={imgRef}
        src={images[index].src}
        alt={images[index].alt}
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
      />

      <button onClick={() => goTo(1)} className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur text-2xl transition hover:bg-white/20 hover:text-white">›</button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-white/10 backdrop-blur px-4 py-2">
        <span className="text-sm text-white/70">{index + 1} / {images.length}</span>
        <p className="text-xs text-white/50 truncate max-w-[200px]">{images[index].alt}</p>
      </div>
    </div>
  )
}
