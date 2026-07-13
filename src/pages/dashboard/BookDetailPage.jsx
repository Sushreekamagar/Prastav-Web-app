import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineTag,
} from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import RecommendationBadge from '../../components/books/RecommendationBadge'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Avatar from '../../components/ui/Avatar'
import { LoadingScreen } from '../../components/ui/Spinner'
import { getBookById } from '../../services/bookService'
import { createRequest } from '../../services/requestService'
import {
  formatPrice,
  getConditionLabel,
  getListingTypeLabel,
  getCategoryLabel,
  formatDate,
} from '../../utils/formatters'

export default function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requestOpen, setRequestOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getBookById(id)
        setBook(data)
      } catch {
        toast.error('Book not found')
        navigate('/dashboard/books')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleRequest = async () => {
    if (!message.trim()) {
      toast.error('Please write a message to the seller')
      return
    }
    setSubmitting(true)
    try {
      await createRequest(id, message)
      toast.success('Request sent successfully!')
      setRequestOpen(false)
      navigate('/dashboard/requests')
    } catch (err) {
      toast.error(err.message || 'Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen message="Loading book details..." />
  if (!book) return null

  return (
    <DashboardPage title={book.title} subtitle={`by ${book.author}`}>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-prastav-100 to-prastav-200 sm:h-80">
            <svg viewBox="0 0 64 64" className="h-24 w-24 opacity-50" fill="none">
              <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" />
              <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e" />
            </svg>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-gray-900">Description</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{book.description}</p>

            {book.keywords?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {book.keywords.map((kw) => (
                  <Badge key={kw} variant="primary">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {book.recommendationFactors && (
            <div className="mt-6">
              <RecommendationBadge
                factors={book.recommendationFactors}
                score={book.recommendationScore}
              />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-prastav-800">
                {formatPrice(book.price)}
              </span>
              <Badge variant="primary">{getListingTypeLabel(book.listingType)}</Badge>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineTag className="h-4 w-4" />
                {getCategoryLabel(book.category)} · {getConditionLabel(book.condition)}
              </div>
              {book.isbn && (
                <p className="text-gray-500">ISBN: {book.isbn}</p>
              )}
              <p className="text-gray-500">Listed {formatDate(book.createdAt)}</p>
            </div>

            <Button className="mt-6 w-full" onClick={() => setRequestOpen(true)}>
              {book.listingType === 'donate' ? 'Request Book' : book.listingType === 'exchange' ? 'Propose Exchange' : 'Buy Now'}
            </Button>
            <Button variant="outline" className="mt-3 w-full" to={`/dashboard/chats?book=${book._id}`}>
              Chat Seller
            </Button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="font-semibold text-gray-900">Seller</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={book.seller?.name} />
              <div>
                <p className="font-medium text-gray-900">{book.seller?.name}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <HiOutlineStar className="h-4 w-4 text-amber-400" />
                    {book.seller?.reputation}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineLocationMarker className="h-4 w-4" />
                    {book.seller?.district}
                  </span>
                </div>
              </div>
            </div>
            {book.distance != null && (
              <p className="mt-3 text-sm text-prastav-700">
                {book.distance} km from your location
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Send Request"
      >
        <Textarea
          label="Message to Seller"
          placeholder="Hi, I'm interested in this book..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setRequestOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleRequest} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </Modal>
    </DashboardPage>
  )
}
