import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineLightBulb,
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { LoadingScreen } from '../../components/ui/Spinner'
import { useDebounce } from '../../hooks/useDebounce'
import { getRecommendations } from '../../services/bookService'
import { formatPrice, getConditionLabel, getListingTypeLabel } from '../../utils/formatters'

const FACTORS_ICONS = {
  titleMatch: '📖',
  keywordMatch: '🔑',
  gradeMatch: '🎓',
  nearbySeller: '📍',
  reputation: '⭐',
}

const FACTORS_LABELS = {
  titleMatch: 'Title Match',
  keywordMatch: 'Keyword Match',
  gradeMatch: 'Grade Match',
  nearbySeller: 'Nearby Seller',
  reputation: 'Good Reputation',
}

function RecommendationCard({ book }) {
  const score = book.recommendationScore
  const scoreColor =
    score >= 70 ? 'text-emerald-600 bg-emerald-50' :
    score >= 40 ? 'text-amber-600 bg-amber-50' :
    'text-gray-600 bg-gray-50'

  const whyRecommended = book.whyRecommended || book.scores?.whyRecommended || []

  return (
    <Link
      to={`/dashboard/books/${book._id}`}
      className="flex flex-col rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Book icon area */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-prastav-100 to-prastav-200">
        <svg viewBox="0 0 64 64" className="h-14 w-14 opacity-60" fill="none">
          <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" />
          <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e" />
        </svg>
        {/* Score badge */}
        {score != null && (
          <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreColor}`}>
            {score}% match
          </span>
        )}
        {/* Listing type */}
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-prastav-700">
          {getListingTypeLabel(book.listingType)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>

        {/* Price and condition */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold text-prastav-800">{formatPrice(book.price)}</span>
          <Badge variant="default">{getConditionLabel(book.condition)}</Badge>
        </div>

        {/* Seller + distance */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <HiOutlineLocationMarker className="h-3.5 w-3.5 shrink-0" />
            {book.distance != null ? `${book.distance} km away` : (book.seller?.district || 'Unknown')}
          </span>
          {(book.seller?.reputationScore || book.seller?.reputation) && (
            <span className="flex items-center gap-0.5">
              <HiOutlineStar className="h-3.5 w-3.5 text-amber-400" />
              {book.seller?.reputationScore || book.seller?.reputation}
            </span>
          )}
        </div>

        {/* Why recommended factors */}
        {book.recommendationFactors && (
          <div className="mt-3 flex flex-wrap gap-1">
            {Object.entries(book.recommendationFactors)
              .filter(([, v]) => v)
              .slice(0, 3)
              .map(([key]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-prastav-50 px-2 py-0.5 text-xs text-prastav-700"
                >
                  {FACTORS_ICONS[key]} {FACTORS_LABELS[key]}
                </span>
              ))}
          </div>
        )}

        {/* WhyRecommended from backend */}
        {Array.isArray(whyRecommended) && whyRecommended.length > 0 && !book.recommendationFactors && (
          <div className="mt-3 flex flex-wrap gap-1">
            {whyRecommended.slice(0, 2).map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-prastav-50 px-2 py-0.5 text-xs text-prastav-700"
              >
                <HiOutlineCheckCircle className="h-3 w-3" /> {reason}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function RecommendationsPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const result = await getRecommendations({ q: debouncedSearch })
        setBooks(result.books || [])
      } catch (err) {
        console.error('Failed to load recommendations:', err)
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
          placeholder="Search to get personalized recommendations (e.g. calculus, grade 11)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: 'grade', label: '🎓 Grade Match' },
            { key: 'title', label: '📖 Title Similarity' },
            { key: 'keyword', label: '🔑 Keyword Match' },
            { key: 'distance', label: '📍 Nearby' },
            { key: 'reputation', label: '⭐ Seller Reputation' },
          ].map((f) => (
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
            description="Try searching for a subject, book title, or keyword. Complete your profile with your grade and location to get personalized results."
            actionLabel="Browse All Books"
            actionTo="/dashboard/books"
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{books.length} recommendations found</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <RecommendationCard key={book._id} book={book} />
            ))}
          </div>
        </>
      )}
    </DashboardPage>
  )
}
