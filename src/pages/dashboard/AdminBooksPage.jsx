import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineSearch,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Button from '../../components/ui/Button'
import PageTransition from '../../components/ui/PageTransition'
import {
  getAdminBooks,
  deleteBook,
  restoreBook,
  resolveBookReport,
} from '../../services/adminService'
import { getGradeLabel } from '../../utils/navigation'

export default function AdminBooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isReported, setIsReported] = useState('')
  const [isDeleted, setIsDeleted] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search,
        isReported: isReported || undefined,
        isDeleted: isDeleted || undefined,
      }
      const data = await getAdminBooks(params)
      setBooks(data.books || data.data || [])
      setTotalPages(Math.ceil((data.total || 0) / 10) || 1)
    } catch (err) {
      toast.error(err.message || 'Failed to fetch books.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [page, isReported, isDeleted])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchBooks()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to soft-delete this listing?')) return
    setActionLoading(id)
    try {
      await deleteBook(id)
      toast.success('Book listing deleted successfully.')
      fetchBooks()
    } catch (err) {
      toast.error(err.message || 'Failed to delete book.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestore = async (id) => {
    setActionLoading(id)
    try {
      await restoreBook(id)
      toast.success('Book listing restored successfully.')
      fetchBooks()
    } catch (err) {
      toast.error(err.message || 'Failed to restore book.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolveReport = async (id) => {
    setActionLoading(id)
    try {
      await resolveBookReport(id)
      toast.success('Book reports resolved successfully.')
      fetchBooks()
    } catch (err) {
      toast.error(err.message || 'Failed to resolve book report.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DashboardPage title="Manage Book Listings" subtitle="Moderate and filter textbook listings posted by users.">
      <PageTransition>
        {/* Filters and search */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by title, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-prastav-500"
            />
            <HiOutlineSearch className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          </form>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={isReported}
              onChange={(e) => { setIsReported(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">Report Status</option>
              <option value="true">Reported/Flagged</option>
            </select>

            <select
              value={isDeleted}
              onChange={(e) => { setIsDeleted(e.target.value); setPage(1); }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">Listing Status</option>
              <option value="false">Active Only</option>
              <option value="true">Deleted Only</option>
            </select>
          </div>
        </div>

        {/* Books Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Title / Author</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Flagged?</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">Loading listings...</td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">No listings found.</td>
                  </tr>
                ) : (
                  books.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{b.title}</div>
                        <div className="text-xs text-gray-500">by {b.author}</div>
                      </td>
                      <td className="px-6 py-4 capitalize font-medium">{b.genre || b.subject}</td>
                      <td className="px-6 py-4">{getGradeLabel(b.Grade || b.grade)}</td>
                      <td className="px-6 py-4">
                        {b.seller ? (
                          <div>
                            <span className="font-medium">{b.seller.name}</span>
                            <div className="text-xs text-gray-400">{b.seller.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            b.isDeleted
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {b.isDeleted ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {b.isReported ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            Flagged ⚠️
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Clean</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.isReported && (
                            <Button
                              onClick={() => handleResolveReport(b._id)}
                              disabled={actionLoading === b._id}
                              variant="outline"
                              size="xs"
                              className="!text-emerald-700 hover:!bg-emerald-50 border-emerald-200"
                            >
                              <HiOutlineShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {b.isDeleted ? (
                            <Button
                              onClick={() => handleRestore(b._id)}
                              disabled={actionLoading === b._id}
                              variant="outline"
                              size="xs"
                              className="!text-emerald-700 hover:!bg-emerald-50 border-emerald-200"
                            >
                              <HiOutlineRefresh className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleDelete(b._id)}
                              disabled={actionLoading === b._id}
                              variant="outline"
                              size="xs"
                              className="!text-red-700 hover:!bg-red-50 border-red-200"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </Button>
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
