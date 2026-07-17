import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import PageTransition from '../../components/ui/PageTransition'
import Button from '../../components/ui/Button'
import { getAuditLogs } from '../../services/adminService'
import { formatRelativeTime } from '../../utils/formatters'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs({ page, limit: 15 })
      setLogs(data.logs || data.data || [])
      setTotalPages(Math.ceil((data.total || 0) / 15) || 1)
    } catch (err) {
      toast.error(err.message || 'Failed to fetch audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  return (
    <DashboardPage title="Audit Trail Logs" subtitle="View system audits and administrative actions.">
      <PageTransition>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Type (ID)</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">Loading audit trail...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">No logs found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {formatRelativeTime(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.adminId ? (
                          <div>
                            <div className="font-semibold text-gray-900">{log.adminId.name}</div>
                            <div className="text-xs text-gray-400">{log.adminId.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider ${
                            log.action === 'SUSPEND_USER' || log.action === 'DELETE_BOOK'
                              ? 'bg-red-50 text-red-700'
                              : log.action === 'ACTIVATE_USER' || log.action === 'RESTORE_BOOK'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <span className="font-bold text-gray-700">{log.targetModel}</span> ({log.targetId})
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {log.details || <span className="text-gray-300 italic">No details</span>}
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
