import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/auth'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!token) {
      setError('重置链接缺少令牌，请重新获取邮件链接')
      return
    }
    if (!newPassword.trim()) {
      setError('请输入新密码')
      return
    }
    if (newPassword.length < 6) {
      setError('密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.resetPassword({ token, newPassword })
      setMessage(result.message)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      setError('重置失败，请确认链接有效')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>重置密码</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            placeholder="输入新密码"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            placeholder="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="form-message error">{error}</p>}
          {message && <p className="form-message success">{message}</p>}
          <button disabled={submitting} type="submit">
            {submitting ? '重置中...' : '确认重置'}
          </button>
          <Link to="/login">返回登录</Link>
        </form>
      </section>
    </main>
  )
}
