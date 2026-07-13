import api from './api'
import { MOCK_USER } from '../utils/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function loginUser(credentials) {
  if (USE_MOCK) {
    await delay(800)
    if (credentials.email === 'demo@prastav.com' && credentials.password === 'demo123') {
      return { user: { ...MOCK_USER, preferencesSet: true }, token: 'mock_jwt_token_' + Date.now() }
    }
    throw new Error('Invalid email or password. Try demo@prastav.com / demo123')
  }
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function registerUser(userData) {
  if (USE_MOCK) {
    await delay(1000)
    return { message: 'OTP sent to your email', email: userData.email }
  }
  const { data } = await api.post('/auth/register', userData)
  return data
}

export async function verifyOtp(email, otp) {
  if (USE_MOCK) {
    await delay(800)
    if (otp === '123456') {
      return { user: { ...MOCK_USER, email }, token: 'mock_jwt_token_' + Date.now() }
    }
    throw new Error('Invalid OTP. Use 123456 for demo.')
  }
  const { data } = await api.post('/auth/verify-otp', { email, otp })
  return data
}

export async function resendOtp(email) {
  if (USE_MOCK) {
    await delay(500)
    return { message: 'OTP resent successfully' }
  }
  const { data } = await api.post('/auth/resend-otp', { email })
  return data
}

export async function forgotPassword(email) {
  if (USE_MOCK) {
    await delay(800)
    return { message: 'Password reset link sent to your email' }
  }
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, password) {
  if (USE_MOCK) {
    await delay(800)
    return { message: 'Password reset successfully' }
  }
  const { data } = await api.post('/auth/reset-password', { token, password })
  return data
}

export async function getProfile() {
  if (USE_MOCK) {
    await delay(500)
    return MOCK_USER
  }
  const { data } = await api.get('/auth/profile')
  return data
}

export async function updateProfile(profileData) {
  if (USE_MOCK) {
    await delay(800)
    return { ...MOCK_USER, ...profileData }
  }
  const { data } = await api.put('/auth/profile', profileData)
  return data
}

export async function uploadProfileAvatar(formData) {
  if (USE_MOCK) {
    await delay(800)
    return { ...MOCK_USER, avatar: 'mock-avatar-url' }
  }
  const { data } = await api.post('/auth/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function uploadPaymentQr(formData) {
  if (USE_MOCK) {
    await delay(800)
    return { ...MOCK_USER, esewaQr: 'mock-qr', khaltiQr: 'mock-qr' }
  }
  const { data } = await api.post('/auth/profile/payment-qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function changePassword(currentPassword, newPassword) {
  if (USE_MOCK) {
    await delay(800)
    return { message: 'Password updated successfully' }
  }
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}

export async function switchRole(newRole) {
  if (USE_MOCK) {
    await delay(800)
    return { ...MOCK_USER, role: newRole }
  }
  const { data } = await api.put('/profile/role', { role: newRole })
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
