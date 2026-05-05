import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { authApi } from '../services/auth'
import { tokenStorage } from '../utils/token'

export function ProtectedRoute() {
  const token = tokenStorage.getAccessToken()
  const [checking, setChecking] = useState(Boolean(token))
  const [authed, setAuthed] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setAuthed(false)
      return
    }

    let cancelled = false
    const verify = async () => {
      try {
        await authApi.profile()
        if (!cancelled) {
          setAuthed(true)
        }
      } catch {
        tokenStorage.clear()
        if (!cancelled) {
          setAuthed(false)
        }
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [token])

  if (token && checking) {
    return <main className="dashboard-layout"><p className="dashboard-loading">正在校验登录状态...</p></main>
  }

  if (!token || !authed) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
