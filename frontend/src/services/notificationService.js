import api from './api'
import { MOCK_NOTIFICATIONS } from '../utils/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function getNotifications() {
  if (USE_MOCK) {
    await delay(400)
    return MOCK_NOTIFICATIONS
  }
  const { data } = await api.get('/notifications')
  return data
}

export async function markNotificationRead(id) {
  if (USE_MOCK) {
    await delay(200)
    return { _id: id, read: true }
  }
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  if (USE_MOCK) {
    await delay(300)
    return { message: 'All notifications marked as read' }
  }
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export async function deleteNotification(id) {
  if (USE_MOCK) {
    await delay(200)
    return { message: 'Notification deleted' }
  }
  const { data } = await api.delete(`/notifications/${id}`)
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
