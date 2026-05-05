export interface LoginRequest {
  email: string
  password: string
  captchaTicket: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  captchaTicket: string
}

export interface SlideCaptchaCreateResponse {
  captchaId: string
  trackInnerWidthPx: number
  knobRadiusPx: number
  expiresInSeconds: number
}

export interface SlideCaptchaVerifyResponse {
  ticket: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface LoginResponse {
  accessToken: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface RegisterResponse {
  accessToken?: string
  user?: {
    id: string
    name: string
    email: string
  }
  requiresApproval?: true
  message?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
}

export interface DashboardData {
  profile: {
    name: string
    role: string
    lastLoginAt: string | null
    loginCount: number
    theme: 'dark' | 'light'
  }
  projectStatus: {
    serverStatus: 'online' | 'offline'
    dbStatus: 'connected' | 'disconnected'
    uptimeSeconds: number
    todaysLoginCount: number
  }
  bigScreenStats: {
    totalVisitors: number
    todaysVisitors: number
    yesterdaysVisitors: number
    onlineVisitors: number
    avgStaySeconds: number
  }
  charts: {
    dailyVisits: Array<{ label: string; value: number }>
    hourlyVisits: Array<{ label: string; value: number }>
    regionDistribution: Array<{ name: string; value: number }>
  }
  behavior: {
    devices: Array<{ name: string; value: number; ratio: number }>
    browsers: Array<{ name: string; value: number; ratio: number }>
    sources: Array<{ name: string; value: number; ratio: number }>
  }
  operationLogs: Array<{
    id: string
    action: string
    detail: string | null
    createdAt: string
  }>
}

export interface TrackVisitRequest {
  visitorId: string
  eventType: 'SITE_ENTER' | 'ROUTE_VIEW' | 'LOGIN' | 'REGISTER' | 'LOGOUT'
  routePath?: string
  deviceType?: string
  browserName?: string
  source?: string
  durationSeconds?: number
}

export interface UserManagementItem {
  id: string
  name: string
  email: string
  role: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvalNote: string | null
  createdAt: string
  approvedAt: string | null
}
