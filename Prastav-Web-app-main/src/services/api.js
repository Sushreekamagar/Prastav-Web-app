import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('prastav_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error — backend is unreachable (proxy 500 or ECONNREFUSED)
    if (!error.response) {
      const networkError = new Error('Cannot connect to the server. Please make sure the backend is running.')
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    }

    const status = error.response.status
    // Extract the most useful message from backend JSON
    const backendMessage = error.response.data?.message || error.response.data?.error || error.message

    if (status === 401) {
      localStorage.removeItem('prastav_token')
      localStorage.removeItem('prastav_user')
      // Only redirect if NOT on an auth page already
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/signup') &&
          !window.location.pathname.startsWith('/forgot-password') &&
          !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = '/login'
      }
    }

    // Override the error message with the backend's human-readable message
    const enhancedError = new Error(backendMessage)
    enhancedError.response = error.response
    enhancedError.status = status
    return Promise.reject(enhancedError)
  },
)

export default api
