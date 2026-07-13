import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <HiOutlineChevronLeft className="h-5 w-5" />
      </button>

      {visiblePages.map((p, i) => {
        const prev = visiblePages[i - 1]
        const showEllipsis = prev && p - prev > 1

        return (
          <span key={p} className="flex items-center">
            {showEllipsis && <span className="px-2 text-gray-400">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                page === p
                  ? 'bg-prastav-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <HiOutlineChevronRight className="h-5 w-5" />
      </button>
    </nav>
  )
}
