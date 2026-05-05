const ACCESS_TOKEN_KEY = 'accessToken'

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken(token: string, remember: boolean) {
    if (remember) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      return
    }
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}
