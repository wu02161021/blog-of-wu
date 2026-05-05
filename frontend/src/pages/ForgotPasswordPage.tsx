import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('请输入邮箱')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('邮箱格式不正确')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.forgotPassword({ email: normalizedEmail })
      setMessage(result.message)
      setEmail(normalizedEmail)
    } catch (requestError) {
      console.error(requestError)
      setError('发送失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>找回密码</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            placeholder="请输入注册邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="form-message error">{error}</p>}
          {message && <p className="form-message success">{message}</p>}
          <button disabled={submitting} type="submit">
            {submitting ? '提交中...' : '发送重置邮件'}
          </button>
          <Link to="/login">返回登录</Link>
        </form>
      </section>
    </main>
  )
}
