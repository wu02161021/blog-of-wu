import { useCallback, useEffect, useRef, useState } from 'react'
import { authApi } from '../services/auth'

type Props = {
  onVerified: (ticket: string) => void
  onTicketRevoked?: () => void
  disabled?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function SlideCaptchaDeepSpace({ onVerified, onTicketRevoked, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const knobCenterRef = useRef(22)
  const onVerifiedRef = useRef(onVerified)
  const onTicketRevokedRef = useRef(onTicketRevoked)
  onVerifiedRef.current = onVerified
  onTicketRevokedRef.current = onTicketRevoked

  const [loading, setLoading] = useState(true)
  const [captchaId, setCaptchaId] = useState<string | null>(null)
  const [trackW, setTrackW] = useState(280)
  const [knobR, setKnobR] = useState(22)
  const [knobCenterPx, setKnobCenterPx] = useState(22)
  const [verified, setVerified] = useState(false)
  const [hint, setHint] = useState('')
  const [shake, setShake] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)
  const dragRef = useRef<{ active: boolean; pointerId: number } | null>(null)

  useEffect(() => {
    knobCenterRef.current = knobCenterPx
  }, [knobCenterPx])

  const loadCaptcha = useCallback(async () => {
    setLoading(true)
    setHint('')
    setVerified(false)
    setSuccessFlash(false)
    onTicketRevokedRef.current?.()
    try {
      const meta = await authApi.createSlideCaptcha()
      setCaptchaId(meta.captchaId)
      setTrackW(meta.trackInnerWidthPx)
      setKnobR(meta.knobRadiusPx)
      const start = meta.knobRadiusPx
      setKnobCenterPx(start)
      knobCenterRef.current = start
    } catch {
      setHint('无法获取验证码，请检查网络或后端')
      setCaptchaId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCaptcha()
  }, [loadCaptcha])

  const margin = knobR + 6
  const minCenter = knobR
  const maxCenter = trackW - knobR
  const targetTickLeft = trackW - margin
  const renderedTrackW = trackRef.current?.getBoundingClientRect().width ?? trackW

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left
      const scale = trackW / Math.max(rect.width, 1)
      const virtualX = x * scale
      const next = clamp(Math.round(virtualX), minCenter, maxCenter)
      knobCenterRef.current = next
      setKnobCenterPx(next)
    },
    [maxCenter, minCenter, trackW],
  )

  const onPointerDownKnob = (event: React.PointerEvent) => {
    if (disabled || loading || verified || !captchaId) return
    event.preventDefault()
    dragRef.current = { active: true, pointerId: event.pointerId }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromClientX(event.clientX)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag?.active || event.pointerId !== drag.pointerId) return
    updateFromClientX(event.clientX)
  }

  const endDrag = async (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag?.active || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    setDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // noop
    }

    if (disabled || loading || verified || !captchaId) return

    const center = knobCenterRef.current
    try {
      setHint('校验中…')
      const { ticket } = await authApi.verifySlideCaptcha({ captchaId, sliderCenterPx: center })
      setVerified(true)
      setHint('验证通过')
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 560)
      onVerifiedRef.current(ticket)
    } catch {
      setShake(true)
      setTimeout(() => setShake(false), 420)
      setHint('未对准，请重试')
      await loadCaptcha()
    }
  }

  const knobDiameter = knobR * 2
  const renderedScale = renderedTrackW / Math.max(trackW, 1)
  const knobLeft = (knobCenterPx - knobR) * renderedScale
  const trailWidth = Math.max(knobCenterPx - knobR, 0)

  return (
    <div className={`ds-slide-captcha ${shake ? 'ds-slide-captcha--shake' : ''}`} aria-live="polite">
      <div className="ds-slide-main">
        <div
          ref={trackRef}
          className={`ds-slide-track tech-stars ${dragging ? 'is-dragging' : ''} ${successFlash ? 'is-success' : ''}`}
          style={{ opacity: disabled ? 0.55 : 1 }}
        >
          <div className="ds-slide-orbit" />
          <div className="ds-slide-track__glow" />
          <div className="ds-slide-trail" style={{ width: trailWidth * renderedScale }} />
          <div className="ds-slide-track__ticks" aria-hidden>
            <span className="ds-slide-track__tick ds-slide-track__tick--ghost" style={{ left: '18%' }} />
            <span className="ds-slide-track__tick ds-slide-track__tick--target" style={{ left: targetTickLeft * renderedScale }} />
          </div>
          <div
            className={`ds-slide-knob ${verified ? 'ds-slide-knob--ok' : ''}`}
            style={{
              width: knobDiameter,
              height: knobDiameter,
              left: knobLeft,
              top: `calc(50% - ${knobR}px)`,
            }}
            onPointerDown={onPointerDownKnob}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="slider"
            aria-valuemin={minCenter}
            aria-valuemax={maxCenter}
            aria-valuenow={knobCenterPx}
            aria-disabled={disabled || loading || verified}
            tabIndex={disabled || loading || verified ? -1 : 0}
          >
            <span className="ds-slide-knob__ring" />
            <span className="ds-slide-knob__core" />
          </div>
          <div className="ds-slide-scan" aria-hidden />
          {successFlash && <div className="ds-slide-success-flash" aria-hidden />}
        </div>
        <button
          type="button"
          className={`ds-slide-refresh ${loading ? 'is-loading' : ''}`}
          disabled={loading || disabled}
          onClick={() => void loadCaptcha()}
          aria-label="刷新验证码"
          title="刷新验证码"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.4-5.7" />
            <path d="M20 4v4h-4" />
          </svg>
        </button>
      </div>
      {hint && <div className={verified ? 'ds-slide-hint ds-slide-hint--ok' : 'ds-slide-hint'}>{hint}</div>}
    </div>
  )
}
