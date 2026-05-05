import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import gsap from 'gsap'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/auth'
import { LoginScene } from '../components/LoginScene'
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

export function LoginPage() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordTip, setShowPasswordTip] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaTicket, setCaptchaTicket] = useState<string | null>(null)
  const [captchaMountKey, setCaptchaMountKey] = useState(0)

  useEffect(() => {
    if (tokenStorage.getAccessToken()) {
      navigate('/dashboard', { replace: true })
      return
    }
    if (!panelRef.current) return
    if (sceneRef.current) {
      gsap.fromTo(sceneRef.current, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' })
    }
    gsap.fromTo(
      panelRef.current,
      { y: 30, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out' },
    )

    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { backgroundPositionX: '0%' },
        { backgroundPositionX: '100%', duration: 4, repeat: -1, ease: 'none' },
      )
    }

    const formItems = panelRef.current.querySelectorAll('.login-form > *')
    if (formItems.length > 0) {
      gsap.fromTo(
        formItems,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.45, delay: 0.22, ease: 'power2.out' },
      )
    }
  }, [])

  const validate = () => {
    if (!email.trim()) return '请输入邮箱'
    if (!/^\S+@\S+\.\S+$/.test(email)) return '邮箱格式不正确'
    if (!password.trim()) return '请输入密码'
    if (password.length < 6) return '密码至少6位'
    if (!captchaTicket) return '请先完成滑动验证'
    return ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    const ticket = captchaTicket
    if (!ticket) {
      setError('请先完成滑动验证')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await authApi.login({ email, password, captchaTicket: ticket })

      if (!result.accessToken) {
        throw new Error('登录返回缺少 accessToken')
      }

      tokenStorage.setAccessToken(result.accessToken, rememberMe)
      setSuccess('登录成功，正在进入主控制台...')
      setTimeout(() => navigate('/dashboard', { replace: true }), 500)
    } catch (requestError) {
      console.error(requestError)
      setCaptchaTicket(null)
      setCaptchaMountKey((key) => key + 1)
      const errorMessage =
        typeof requestError === 'object' &&
        requestError &&
        'response' in requestError &&
        typeof (requestError as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message
          : '登录失败，请检查账号密码或后端服务'
      setError(errorMessage || '登录失败，请检查账号密码或后端服务')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-layout">
      <div className="login-scene-wrap" ref={sceneRef}>
        <LoginScene />
      </div>

      <section className="login-panel" ref={panelRef}>
        <p className="login-badge">DEEP SPACE ACCESS</p>
        <h1 ref={titleRef}>欢迎登录</h1>
        <p className="login-subtitle">wu yu yang</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <div className="field-label-row">
            <label htmlFor="password">密码</label>
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
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
            />
            <button
              className="ghost-button"
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          <SlideCaptchaDeepSpace
            key={captchaMountKey}
            disabled={isSubmitting}
            onTicketRevoked={() => setCaptchaTicket(null)}
            onVerified={(ticket) => setCaptchaTicket(ticket)}
          />

          <div className="form-extra">
            <label className="checkbox-label" htmlFor="rememberMe">
              <input
                checked={rememberMe}
                id="rememberMe"
                name="rememberMe"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              记住登录状态
            </label>
            <Link className="forgot-link" to="/forgot-password">
              忘记密码?
            </Link>
          </div>

          {error && <p className="form-message error">{error}</p>}
          {success && <p className="form-message success">{success}</p>}

          <button disabled={isSubmitting || !captchaTicket} type="submit">
            {isSubmitting ? '登录中...' : '登录'}
          </button>

          <p className="panel-footnote">登录即表示你同意平台服务条款与隐私政策</p>
          <p className="panel-footnote">
            还没有账号？<Link className="forgot-link" to="/register">去注册</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
