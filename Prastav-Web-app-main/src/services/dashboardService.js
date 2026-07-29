import api from './api'

export async function getBuyerDashboardStats() {
  const { data } = await api.get('/dashboard/buyer')
  const stats = data.data?.stats || {}
  return {
    activeRequests: stats.activeRequests || 0,
    pendingPayments: stats.pendingPayments || 0,
    completedPurchases: stats.completedTransactions || 0,
    nearbyBooksCount: stats.nearbyBooksCount || 0,
    recommendedBooksCount: stats.recommendedBooksCount || 0,
  }
}

export async function getSellerDashboardStats() {
  const { data } = await api.get('/dashboard/seller')
  const stats = data.data?.stats || {}
  return {
    totalBooks: stats.listedBooks || 0,
    pendingRequests: stats.pendingRequests || 0,
    activeTransactions: stats.activeTransactions || 0,
    completedSales: stats.completedSales || 0,
    reputationScore: stats.reputationScore || 0,
  }
}
