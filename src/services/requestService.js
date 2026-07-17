import api from './api'

function formatTransactionToRequest(tx) {
  if (!tx) return null
  return {
    _id: tx._id,
    book: tx.book,
    buyer: tx.requester,
    seller: tx.lister ? {
      ...tx.lister,
      name: tx.lister.name,
      email: tx.lister.email,
      reputation: tx.lister.reputationScore,
      district: tx.lister.district,
      esewaQr: tx.lister.esewaQR,
      khaltiQr: tx.lister.khaltiQR,
      esewaNumber: tx.lister.esewaNumber,
      khaltiNumber: tx.lister.khaltiNumber,
    } : null,
    requestType: tx.requestType,
    meetingLandmark: tx.meetingLandmark,
    paymentMethod: tx.paymentMethod,
    paymentStatus: tx.paymentStatus,
    paymentAmount: tx.paymentAmount,
    paymentScreenshot: tx.paymentProof,
    status: tx.status,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    acceptedAt: tx.acceptedAt,
    ratingByBuyer: tx.ratingByRequester,
    ratingBySeller: tx.ratingByLister,
    message: tx.meetingLandmark,
    distanceKm: tx.distanceKm ?? null,
  }
}

export async function getRequests(type = 'all') {
  let endpoint = '/transactions/my'
  if (type === 'incoming') {
    endpoint = '/transactions/seller'
  } else if (type === 'outgoing') {
    endpoint = '/transactions/my'
  } else if (type === 'transactions') {
    const [myRes, sellerRes] = await Promise.all([
      api.get('/transactions/my'),
      api.get('/transactions/seller')
    ])
    const merged = [...(myRes.data.transactions || []), ...(sellerRes.data.transactions || [])]
    // Filter out duplicates if a user is both buyer and seller in the same system (rare but possible in test)
    const unique = Array.from(new Map(merged.map((item) => [item._id, item])).values())
    return unique.map(formatTransactionToRequest)
  }

  const { data } = await api.get(endpoint)
  const txs = data.transactions || []
  return txs.map(formatTransactionToRequest)
}

export async function getRequestById(id) {
  const { data } = await api.get(`/transactions/${id}`)
  return formatTransactionToRequest(data.transaction)
}

export async function cancelRequest(id) {
  return updateRequestStatus(id, 'cancelled')
}

export async function completeTransaction(id) {
  const { data } = await api.put(`/transactions/${id}/complete`)
  return formatTransactionToRequest(data.transaction)
}

export async function createRequest(bookId, options = {}) {
  const {
    message = '',
    requestType = 'Delivery',
    paymentMethod = 'esewa',
  } = options
  const payload = {
    bookId,
    meetingLandmark: message || '',
    requestType,
    paymentMethod,
  }
  const { data } = await api.post('/transactions/request', payload)
  return data
}

export async function updateRequestStatus(id, status) {
  let endpoint = ''
  if (status === 'accepted') {
    endpoint = `/transactions/${id}/accept`
  } else if (status === 'rejected') {
    endpoint = `/transactions/${id}/reject`
  } else if (status === 'cancelled') {
    endpoint = `/transactions/${id}/cancel`
  } else {
    throw new Error(`Unsupported status update: ${status}`)
  }
  const { data } = await api.put(endpoint)
  return formatTransactionToRequest(data.transaction)
}

export async function uploadPaymentProof(id, formData) {
  const file = formData.get('screenshot')
  const uploadData = new FormData()
  uploadData.append('paymentProof', file)

  const { data } = await api.put(`/transactions/${id}/paymentProof`, uploadData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return formatTransactionToRequest(data.transaction)
}

export async function verifyPayment(id, verified) {
  const action = verified ? 'verified' : 'rejected'
  const { data } = await api.put(`/transactions/${id}/verifyPayment`, { action })
  return formatTransactionToRequest(data.transaction)
}

export async function submitRating(requestId, rating, review) {
  const { data } = await api.post(`/transactions/${requestId}/rate`, { score: rating, comment: review })
  return data
}
