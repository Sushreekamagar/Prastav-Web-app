import api from './api'
import { MOCK_BOOKS, MOCK_DASHBOARD_STATS, MOCK_NOTIFICATIONS, MOCK_REQUESTS } from '../utils/mockData'
import { TRANSACTION_STATUSES } from '../utils/bookConstants'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function getBuyerDashboardStats() {
  if (USE_MOCK) {
    await delay(400)
    const requests = MOCK_REQUESTS
    return {
      activeRequests: requests.filter((r) => r.status === 'pending' || r.status === 'accepted').length,
      completedPurchases: requests.filter((r) => r.status === 'completed').length,
      pendingPayments: requests.filter((r) => r.status === 'accepted' || r.status === 'payment_pending').length,
      unreadNotifications: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
    }
  }
  const { data } = await api.get('/dashboard/buyer-stats')
  return data
}

export async function getSellerDashboardStats() {
  if (USE_MOCK) {
    await delay(400)
    const requests = MOCK_REQUESTS
    return {
      totalBooks: MOCK_BOOKS.slice(0, 3).length,
      pendingRequests: requests.filter((r) => r.status === 'pending').length,
      activeTransactions: requests.filter((r) => TRANSACTION_STATUSES.includes(r.status) && r.status !== 'completed').length,
      completedSales: MOCK_DASHBOARD_STATS.completedDeals,
      reputation: MOCK_DASHBOARD_STATS.reputation,
      unreadNotifications: MOCK_DASHBOARD_STATS.unreadNotifications,
    }
  }
  const { data } = await api.get('/dashboard/seller-stats')
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
