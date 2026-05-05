import { http } from './http'
import type {
  ChangePasswordRequest,
  DashboardData,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SlideCaptchaCreateResponse,
  SlideCaptchaVerifyResponse,
  TrackVisitRequest,
  UserManagementItem,
  UserProfile,
} from '../types/auth'

const pendingRequests = new Set<string>()

const withDedup = async <T>(key: string, action: () => Promise<T>) => {
  if (pendingRequests.has(key)) {
    throw new Error('请求处理中，请勿重复提交')
  }
  pendingRequests.add(key)
  try {
    return await action()
  } finally {
    pendingRequests.delete(key)
  }
}

export const authApi = {
  async createSlideCaptcha(): Promise<SlideCaptchaCreateResponse> {
    const { data } = await http.post<SlideCaptchaCreateResponse>('/auth/captcha', {})
    return data
  },

  async verifySlideCaptcha(payload: {
    captchaId: string
    sliderCenterPx: number
  }): Promise<SlideCaptchaVerifyResponse> {
    const { data } = await http.post<SlideCaptchaVerifyResponse>('/auth/captcha/verify', payload)
    return data
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    return withDedup(`login:${payload.email}`, async () => {
      const { data } = await http.post<LoginResponse>('/auth/login', payload)
      return data
    })
  },
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    return withDedup(`register:${payload.email}`, async () => {
      const { data } = await http.post<RegisterResponse>('/auth/register', payload)
      return data
    })
  },
  async forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
    return withDedup(`forgot:${payload.email}`, async () => {
      const { data } = await http.post<{ message: string }>('/auth/forgot-password', payload)
      return data
    })
  },
  async resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
    return withDedup(`reset:${payload.token}`, async () => {
      const { data } = await http.post<{ message: string }>('/auth/reset-password', payload)
      return data
    })
  },
  async changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
    return withDedup('change-password', async () => {
      const { data } = await http.post<{ message: string }>('/auth/change-password', payload)
      return data
    })
  },
  async profile(): Promise<UserProfile> {
    const { data } = await http.get<UserProfile>('/auth/profile')
    return data
  },
  async dashboard(): Promise<DashboardData> {
    const { data } = await http.get<DashboardData>('/auth/dashboard')
    return data
  },
  async updateTheme(theme: 'dark' | 'light') {
    const { data } = await http.post<{ theme: 'dark' | 'light' }>('/auth/theme', { theme })
    return data
  },
  async trackVisit(payload: TrackVisitRequest) {
    const { data } = await http.post<{ ok: boolean }>('/auth/track', payload)
    return data
  },
  async users(): Promise<UserManagementItem[]> {
    const { data } = await http.get<UserManagementItem[]>('/auth/users')
    return data
  },
  async reviewUser(payload: { userId: string; status: 'approved' | 'rejected'; note?: string }) {
    const { data } = await http.post<{ ok: boolean }>('/auth/users/review', payload)
    return data
  },
  async deleteUser(userId: string) {
    const { data } = await http.post<{ ok: boolean }>('/auth/users/delete', { userId })
    return data
  },
}
