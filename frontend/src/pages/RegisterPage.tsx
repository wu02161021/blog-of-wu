import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import gsap from 'gsap'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/auth'
import { SlideCaptchaDeepSpace } from '../components/SlideCaptchaDeepSpace'
import { tokenStorage } from '../utils/token'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 2l20 20" />
      <path d="M4.4 6.3C2.6 8.1 1.5 10 1.5 10s3.7 6.5 10.5 6.5c2.4 0 4.4-.8 6-1.9" />
      <path d="M9.2 9.2a4 4 0 0 0 5.6 5.6" />
      <path d="M12 5.5c6.8 0 10.5 6.5 10.5 6.5a17 17 0 0 1-1.8 2.6" />
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordTip, setShowPasswordTip] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaTicket, setCaptchaTicket] = useState<string | null>(null)
  const [captchaMountKey, setCaptchaMountKey] = useState(0)

  useEffect(() => {
    if (!panelRef.current) return
    gsap.fromTo(
      panelRef.current,
      { y: 30, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out' },
    )
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!captchaTicket) {
      setError('请先完成滑动验证')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.register({ name, email, password, captchaTicket })
      if (result.accessToken) {
        tokenStorage.setAccessToken(result.accessToken, true)
        setMessage('管理员账号注册成功，正在进入主控制台...')
        setTimeout(() => navigate('/dashboard', { replace: true }), 600)
      } else {
        setMessage(result.message ?? '注册申请已提交，请等待管理员审批')
        setTimeout(() => navigate('/login', { replace: true }), 900)
      }
    } catch (err) {
      console.error(err)
      setCaptchaTicket(null)
      setCaptchaMountKey((key) => key + 1)
      setError('注册失败，请检查信息后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-layout" style={{ background: 'url(/Register.webp) center/cover no-repeat', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 'clamp(32px, 10vw, 140px)' }}>
      <div className="pointer-events-none fixed inset-0 bg-black/30" />
      <section className="login-panel" ref={panelRef}>
        <h1>邮箱注册</h1>
        <p className="login-subtitle">初始化身份轨道 · CREATE ACCOUNT</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input placeholder="昵称" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="field-label-row">
            <label htmlFor="register-password">密码</label>
            <button
              type="button"
              className="pwd-tip-trigger"
              aria-label="查看密码要求"
              onClick={() => setShowPasswordTip((prev) => !prev)}
            >
              ?
            </button>
          </div>
          {showPasswordTip && (
            <p className="pwd-tip-text">密码要求：至少 6 位，建议包含字母、数字和符号组合。</p>
          )}
          <div className="password-field">
            <input
              id="register-password"
              placeholder="密码（至少6位）"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="ghost-button"
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <SlideCaptchaDeepSpace
            key={captchaMountKey}
            disabled={submitting}
            onTicketRevoked={() => setCaptchaTicket(null)}
            onVerified={(ticket) => setCaptchaTicket(ticket)}
          />
          {error && <p className="form-message error">{error}</p>}
          {message && <p className="form-message success">{message}</p>}
          <button disabled={submitting || !captchaTicket} type="submit">
            {submitting ? '提交中...' : '提交注册申请'}
          </button>
          <Link to="/login">返回登录</Link>
        </form>
      </section>
    </main>
  )
}
