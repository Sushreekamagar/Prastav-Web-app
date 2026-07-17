import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  HiOutlineUserRemove,
  HiOutlineUserAdd,
  HiOutlineShieldCheck,
  HiOutlineSearch,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Button from '../../components/ui/Button'
import PageTransition from '../../components/ui/PageTransition'
import {
  getAdminUsers,
  suspendUser,
  activateUser,
  resolveUserReport,
} from '../../services/adminService'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [isReported, setIsReported] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search,
        role,
        status,
        isReported: isReported || undefined,
      }
      const data = await getAdminUsers(params)
      setUsers(data.users || data.data || [])
      setTotalPages(Math.ceil((data.total || 0) / 10) || 1)
    } catch (err) {
      toast.error(err.message || 'Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, role, status, isReported])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    try {
      await suspendUser(id)
      toast.success('User suspended successfully.')
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to suspend user.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (id) => {
    setActionLoading(id)
    try {
      await activateUser(id)
      toast.success('User activated successfully.')
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to activate user.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolveReport = async (id) => {
    setActionLoading(id)
    try {
      await resolveUserReport(id)
      toast.success('User reports resolved successfully.')
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to resolve user report.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DashboardPage title="Manage Users" subtitle="Review user accounts, reports, and toggle suspension status.">
      <PageTransition>
        {/* Filters and search */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-prastav-500"
            />
            <HiOutlineSearch className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          </form>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Both</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={isReported}
              onChange={(e) => { setIsReported(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">Report Status</option>
              <option value="true">Flagged/Reported Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Rating / Reputation</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Flagged?</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 capitalize font-medium">{u.role}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-amber-600">⭐ {u.reputationScore ?? 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isReported ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            Flagged ⚠️
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Clean</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.isReported && (
                            <Button
                              onClick={() => handleResolveReport(u._id)}
                              disabled={actionLoading === u._id}
                              variant="outline"
                              size="xs"
                              className="!text-emerald-700 hover:!bg-emerald-50 border-emerald-200"
                            >
                              <HiOutlineShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {u.role !== 'admin' && (
                            u.status === 'active' ? (
                              <Button
                                onClick={() => handleSuspend(u._id)}
                                disabled={actionLoading === u._id}
                                variant="outline"
                                size="xs"
                                className="!text-red-700 hover:!bg-red-50 border-red-200"
                              >
                                <HiOutlineUserRemove className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleActivate(u._id)}
                                disabled={actionLoading === u._id}
                                variant="outline"
                                size="xs"
                                className="!text-emerald-700 hover:!bg-emerald-50 border-emerald-200"
                              >
                                <HiOutlineUserAdd className="h-4 w-4" />
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardPage>
  )
}
