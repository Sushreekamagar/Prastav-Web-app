import { Link } from 'react-router-dom'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatDate } from '../../utils/formatters'
import { REQUEST_STATUS } from '../../utils/bookConstants'
import { getGradeLabel } from '../../utils/navigation'

function BookCover({ title }) {
  return (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-prastav-100 to-prastav-200">
      <svg viewBox="0 0 64 64" className="h-6 w-6 opacity-60" fill="none">
        <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" />
        <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e" />
      </svg>
      <span className="sr-only">{title}</span>
    </div>
  )
}

export default function RequestCard({
  request,
  viewAs = 'buyer',
  onCancel,
  detailPath = `/dashboard/requests/${request._id}`,
}) {
  const statusInfo = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending
  const sellerName = request.seller?.name || request.book?.seller?.name || 'Unknown'
  const distance = request.book?.distance ?? request.distance

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row">
        <BookCover title={request.book?.title} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{request.book?.title || 'Book'}</h3>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Seller: {sellerName}
            {request.book?.grade && <> · {getGradeLabel(request.book.grade)}</>}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {distance != null && (
              <span className="flex items-center gap-1">
                <HiOutlineLocationMarker className="h-3.5 w-3.5" />
                {distance} km away
              </span>
            )}
            <span>Requested {formatDate(request.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <Button to={detailPath} variant="outline" size="sm">
            View Details
          </Button>
          {viewAs === 'buyer' && request.status === 'pending' && onCancel && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(request._id)} className="!text-red-600">
              Cancel
            </Button>
          )}
          {viewAs === 'seller' && request.status === 'pending' && (
            <Button to={detailPath} size="sm">
              Review
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function RequestCardCompact({ request, to }) {
  const statusInfo = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending
  return (
    <Link
      to={to || `/dashboard/requests/${request._id}`}
      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-prastav-50/50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{request.book?.title}</p>
        <p className="text-xs capitalize text-gray-500">{statusInfo.label}</p>
      </div>
      <Badge variant={statusInfo.variant} className="shrink-0">
        {statusInfo.label}
      </Badge>
    </Link>
  )
}
