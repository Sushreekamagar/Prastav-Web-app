import { useEffect, useState } from 'react'
import { HiOutlineLightBulb } from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import BookCard from '../../components/books/BookCard'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { LoadingScreen } from '../../components/ui/Spinner'
import { useDebounce } from '../../hooks/useDebounce'
import { getRecommendations } from '../../services/bookService'
import { RECOMMENDATION_FACTORS } from '../../utils/constants'

export default function RecommendationsPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const result = await getRecommendations({ search: debouncedSearch })
        setBooks(result.books || [])
      } catch {
        setBooks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [debouncedSearch])

  return (
    <DashboardPage
      title="Smart Recommendations"
      subtitle="Books matched by title, keywords, grade, distance, and seller reputation"
    >
      <div className="rounded-2xl bg-white p-5 shadow-md">
        <Input
          placeholder="Search to get personalized recommendations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {RECOMMENDATION_FACTORS.map((f) => (
            <span
              key={f.key}
              className="rounded-full bg-prastav-50 px-3 py-1 text-xs font-medium text-prastav-700"
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingScreen message="Finding recommendations..." />
      ) : books.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={HiOutlineLightBulb}
            title="No recommendations yet"
            description="Try searching for a book title or keyword."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book._id} book={book} showRecommendation />
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
