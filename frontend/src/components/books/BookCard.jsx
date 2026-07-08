import { Link } from 'react-router-dom'
import { HiOutlineLocationMarker, HiOutlineStar } from 'react-icons/hi'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { formatPrice, getConditionLabel, getListingTypeLabel } from '../../utils/formatters'

const typeVariants = {
  sell: 'primary',
  exchange: 'info',
  donate: 'success',
}

export default function BookCard({ book, showRecommendation = false }) {
  return (
    <Link to={`/dashboard/books/${book._id}`} className="block">
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-prastav-100 to-prastav-200">
          <svg viewBox="0 0 64 64" className="h-16 w-16 opacity-60" fill="none">
            <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" />
            <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e" />
          </svg>
          <div className="absolute left-3 top-3">
            <Badge variant={typeVariants[book.listingType] || 'default'}>
              {getListingTypeLabel(book.listingType)}
            </Badge>
          </div>
          {showRecommendation && book.recommendationScore && (
            <div className="absolute right-3 top-3">
              <Badge variant="success">{book.recommendationScore}% match</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 font-semibold text-gray-900">{book.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{book.author}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-prastav-800">
              {formatPrice(book.price)}
            </span>
            <Badge variant="default">{getConditionLabel(book.condition)}</Badge>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <HiOutlineLocationMarker className="h-3.5 w-3.5" />
              {book.distance != null ? `${book.distance} km` : book.seller?.district}
            </span>
            {book.seller?.reputation && (
              <span className="flex items-center gap-0.5">
                <HiOutlineStar className="h-3.5 w-3.5 text-amber-400" />
                {book.seller.reputation}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
