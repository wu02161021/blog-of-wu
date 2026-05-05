import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { authApi } from '../services/auth'

function getVisitorId() {
  const key = 'visitor_id_v1'
  const cached = localStorage.getItem(key)
  if (cached) return cached
  const next = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, next)
  return next
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile'
  return 'desktop'
}

function getBrowserName() {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Safari/')) return 'Safari'
  return 'Other'
}

function getSource() {
  if (!document.referrer) return 'direct'
  try {
    return new URL(document.referrer).hostname || 'referral'
  } catch {
    return 'referral'
  }
}

export function RouteTracker() {
  const location = useLocation()
  const enterAtRef = useRef<number>(Date.now())
  const previousPathRef = useRef<string | null>(null)
  const visitorIdRef = useRef<string>(getVisitorId())

  useEffect(() => {
    void authApi.trackVisit({
      visitorId: visitorIdRef.current,
      eventType: 'SITE_ENTER',
      routePath: window.location.pathname,
      deviceType: getDeviceType(),
      browserName: getBrowserName(),
      source: getSource(),
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    const now = Date.now()
    const previousPath = previousPathRef.current
    if (previousPath) {
      const staySeconds = Math.max(1, Math.floor((now - enterAtRef.current) / 1000))
      void authApi
        .trackVisit({
          visitorId: visitorIdRef.current,
          eventType: 'ROUTE_VIEW',
          routePath: previousPath,
          deviceType: getDeviceType(),
          browserName: getBrowserName(),
          source: getSource(),
          durationSeconds: staySeconds,
        })
        .catch(() => undefined)
    }
    previousPathRef.current = location.pathname
    enterAtRef.current = now
  }, [location.pathname])

  return null
}
