import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { HiOutlineSwitchHorizontal, HiOutlineSearch } from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import PageTransition from '../../components/ui/PageTransition'
import { getAdminTransactions } from '../../services/adminService'
import { formatDate, formatPrice } from '../../utils/formatters'
import { REQUEST_STATUS } from '../../utils/bookConstants'

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        status: status || undefined,
      }
      const data = await getAdminTransactions(params)
      setTransactions(data.transactions || data.data || [])
      setTotalPages(Math.ceil((data.total || 0) / 10) || 1)
    } catch (err) {
      toast.error(err.message || 'Failed to fetch transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, status])

  return (
    <DashboardPage title="Manage Transactions" subtitle="Overview of all peer-to-peer exchanges and transactions.">
      <PageTransition>
        {/* Filters */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineSwitchHorizontal className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filter Transactions</span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {Object.entries(REQUEST_STATUS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Transaction ID / Date</th>
                  <th className="px-6 py-4">Book Title / Price</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const info = REQUEST_STATUS[tx.status] || REQUEST_STATUS.pending
                    return (
                      <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-gray-600">{tx._id}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{formatDate(tx.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{tx.book?.title || 'Unknown Book'}</div>
                          <div className="text-xs text-prastav-700 font-bold mt-0.5">
                            {formatPrice(tx.book?.price || tx.paymentAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.requester ? (
                            <div>
                              <div className="font-medium text-gray-900">{tx.requester.name}</div>
                              <div className="text-xs text-gray-400">{tx.requester.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {tx.lister ? (
                            <div>
                              <div className="font-medium text-gray-900">{tx.lister.name}</div>
                              <div className="text-xs text-gray-400">{tx.lister.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={info.variant}>{info.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => navigate(`/dashboard/requests/${tx._id}`)}
                            variant="outline"
                            size="xs"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })
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
