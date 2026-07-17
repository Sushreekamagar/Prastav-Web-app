import api from './api'

export async function loginUser(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function registerUser(userData) {
  const { data } = await api.post('/auth/signup', userData)
  return data
}

export async function verifyOtp(userId, otp) {
  const { data } = await api.post('/auth/verify-otp', { userId, otp })
  return data
}

export async function resendOtp(email) {
  const { data } = await api.post('/auth/resend-otp', { email })
  return data
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword({ email, otp, newPassword }) {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword })
  return data
}

export async function getProfile() {
  const { data } = await api.get('/profile')
  return data.user
}

export async function updateProfile(profileData) {
  const { data } = await api.put('/profile', profileData)
  return data.user
}

export async function updateLocation(coords) {
  const { data } = await api.put('/profile/location', coords)
  return data.user
}

export async function uploadProfileAvatar(formData) {
  const file = formData.get('avatar')
  const uploadData = new FormData()
  uploadData.append('profileImage', file)

  const { data } = await api.put('/profile/image', uploadData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.user
}

export async function uploadPaymentQr(formData) {
  let endpoint = ''
  let fieldName = ''
  let file = null

  if (formData.has('esewaQr')) {
    endpoint = '/profile/esewaQR'
    fieldName = 'esewaQR'
    file = formData.get('esewaQr')
  } else if (formData.has('khaltiQr')) {
    endpoint = '/profile/khaltiQR'
    fieldName = 'khaltiQR'
    file = formData.get('khaltiQr')
  } else {
    throw new Error('Invalid payment QR type')
  }

  const uploadData = new FormData()
  uploadData.append(fieldName, file)

  const { data } = await api.put(endpoint, uploadData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.user
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}

export async function switchRole(newRole) {
  const { data } = await api.put('/profile/role', { role: newRole })
  return data.user || data
}
