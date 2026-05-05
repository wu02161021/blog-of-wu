import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { tokenStorage } from '../utils/token'

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear()
    }
    return Promise.reject(error)
  },
)
