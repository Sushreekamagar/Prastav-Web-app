import api from './api'

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats')
  return data.data
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function suspendUser(id) {
  const { data } = await api.patch(`/admin/users/${id}/suspend`)
  return data
}

export async function activateUser(id) {
  const { data } = await api.patch(`/admin/users/${id}/activate`)
  return data
}

export async function resolveUserReport(id) {
  const { data } = await api.patch(`/admin/users/${id}/resolve-report`)
  return data
}

export async function getAdminBooks(params = {}) {
  const { data } = await api.get('/admin/books', { params })
  return data
}

export async function deleteBook(id) {
  const { data } = await api.delete(`/admin/books/${id}`)
  return data
}

export async function restoreBook(id) {
  const { data } = await api.patch(`/admin/books/${id}/restore`)
  return data
}

export async function resolveBookReport(id) {
  const { data } = await api.patch(`/admin/books/${id}/resolve-report`)
  return data
}

export async function getAdminTransactions(params = {}) {
  const { data } = await api.get('/admin/transactions', { params })
  return data
}

export async function getAuditLogs(params = {}) {
  const { data } = await api.get('/admin/logs', { params })
  return data
}
