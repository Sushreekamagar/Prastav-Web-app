import api from './api'
import { MOCK_REQUESTS } from '../utils/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function getRequests(type = 'all') {
  if (USE_MOCK) {
    await delay(500)
    if (type === 'incoming') {
      return MOCK_REQUESTS.filter((r) => r.status === 'pending' || r.status === 'payment_pending')
    }
    if (type === 'outgoing') {
      return MOCK_REQUESTS.filter((r) => r.buyer?._id === 'user_1')
    }
    if (type === 'transactions') {
      return MOCK_REQUESTS.filter((r) =>
        ['accepted', 'payment_pending', 'payment_uploaded', 'payment_verified', 'completed'].includes(r.status),
      )
    }
    return MOCK_REQUESTS
  }
  const { data } = await api.get('/requests', { params: { type } })
  return data
}

export async function getRequestById(id) {
  if (USE_MOCK) {
    await delay(400)
    const req = MOCK_REQUESTS.find((r) => r._id === id)
    if (!req) throw new Error('Request not found')
    return req
  }
  const { data } = await api.get(`/requests/${id}`)
  return data
}

export async function cancelRequest(id) {
  return updateRequestStatus(id, 'cancelled')
}

export async function completeTransaction(id) {
  if (USE_MOCK) {
    await delay(600)
    return { _id: id, status: 'completed' }
  }
  const { data } = await api.patch(`/requests/${id}`, { status: 'completed' })
  return data
}

export async function createRequest(bookId, message) {
  if (USE_MOCK) {
    await delay(800)
    return { _id: 'req_new_' + Date.now(), bookId, message, status: 'pending' }
  }
  const { data } = await api.post('/requests', { bookId, message })
  return data
}

export async function updateRequestStatus(id, status) {
  if (USE_MOCK) {
    await delay(600)
    return { _id: id, status }
  }
  const { data } = await api.patch(`/requests/${id}`, { status })
  return data
}

export async function uploadPaymentProof(id, formData) {
  if (USE_MOCK) {
    await delay(1000)
    return { _id: id, status: 'payment_pending', message: 'Payment proof uploaded' }
  }
  const { data } = await api.post(`/requests/${id}/payment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function verifyPayment(id, verified) {
  if (USE_MOCK) {
    await delay(600)
    return { _id: id, status: verified ? 'payment_verified' : 'payment_pending' }
  }
  const { data } = await api.patch(`/requests/${id}/verify-payment`, { verified })
  return data
}

export async function submitRating(requestId, rating, review) {
  if (USE_MOCK) {
    await delay(800)
    return { requestId, rating, review }
  }
  const { data } = await api.post(`/requests/${requestId}/rating`, { rating, review })
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
