import api from './api'

function normalizeNotification(n) {
  if (!n) return null
  return {
    _id: n._id,
    title: n.title,
    message: n.message,
    type: normalizeType(n.type),
    read: n.isRead ?? n.read ?? false,
    isRead: n.isRead ?? n.read ?? false,
    transactionId: n.relatedTransaction?._id || n.relatedTransaction || n.transactionId || null,
    requestId: n.relatedTransaction?._id || n.relatedTransaction || n.requestId || null,
    bookId: n.relatedBook?._id || n.relatedBook || n.bookId || null,
    createdAt: n.createdAt,
  }
}

function normalizeType(type) {
  if (!type) return 'transaction'
  if (type.includes('request')) return 'request'
  if (type.includes('payment')) return 'payment'
  if (type.includes('transaction') || type.includes('completed')) return 'transaction'
  if (type.includes('rating')) return 'rating'
  if (type.includes('recommendation')) return 'recommendation'
  return 'transaction'
}

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  const raw = Array.isArray(data) ? data : (data.notifications || data.data || [])
  return raw.map(normalizeNotification).filter(Boolean)
}

export async function markNotificationRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.put('/notifications/read-all')
  return data
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notifications/${id}`)
  return data
}
