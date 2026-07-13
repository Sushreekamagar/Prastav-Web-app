import { useEffect, useState } from 'react'
import { HiOutlineBookOpen } from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import BookCard from '../../components/books/BookCard'
import BookFilters from '../../components/books/BookFilters'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { LoadingScreen } from '../../components/ui/Spinner'
import { useDebounce } from '../../hooks/useDebounce'
import { getBooks } from '../../services/bookService'

export default function BrowseBooksPage() {
  const [filters, setFilters] = useState({})
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const debouncedSearch = useDebounce(filters.search, 400)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const result = await getBooks({ ...filters, search: debouncedSearch, page, limit: 12 })
        setBooks(result.books || [])
        setTotalPages(result.totalPages || 1)
      } catch {
        setBooks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [debouncedSearch, filters, page])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <DashboardPage title="Browse Books" subtitle="Find academic books from students near you">
      <BookFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => {
          setFilters({})
          setPage(1)
        }}
      />

      {loading ? (
        <LoadingScreen message="Searching books..." />
      ) : books.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={HiOutlineBookOpen}
            title="No books found"
            description="Try adjusting your filters or search terms."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </DashboardPage>
  )
}
