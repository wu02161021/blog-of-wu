import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number
}

export function MouseParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return

    let particles: Particle[] = []
    let mouse = { x: -100, y: -100 }
    let raf = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }

    const spawn = () => {
      if (mouse.x < 0) return
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 20,
          y: mouse.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 1,
          life: 0,
          maxLife: 40 + Math.random() * 30,
          size: 2 + Math.random() * 3,
        })
      }
      if (particles.length > 80) particles.splice(0, particles.length - 80)
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      spawn()

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.life++
        const alpha = 1 - p.life / p.maxLife
        if (alpha <= 0) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(125,211,252,${alpha * 0.6})`
        ctx.fill()
      }

      particles = particles.filter(p => p.life < p.maxLife)
      raf = requestAnimationFrame(draw)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />
}
