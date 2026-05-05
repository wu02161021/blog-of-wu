import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/auth'
import { tokenStorage } from '../utils/token'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!currentPassword.trim()) {
      setError('请输入当前密码')
      return
    }
    if (!newPassword.trim()) {
      setError('请输入新密码')
      return
    }
    if (newPassword.length < 6) {
      setError('新密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    try {
      setSubmitting(true)
      const result = await authApi.changePassword({ currentPassword, newPassword })
      setMessage(result.message)
      tokenStorage.clear()
      setTimeout(() => navigate('/login', { replace: true }), 800)
    } catch (requestError) {
      console.error(requestError)
      setError('修改失败，请确认当前密码是否正确')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>修改密码</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            placeholder="当前密码"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            placeholder="新密码（至少6位）"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            placeholder="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error && <p className="form-message error">{error}</p>}
          {message && <p className="form-message success">{message}</p>}
          <button disabled={submitting} type="submit">
            {submitting ? '提交中...' : '确认修改'}
          </button>
          <Link to="/dashboard">返回控制台</Link>
        </form>
      </section>
    </main>
  )
}
