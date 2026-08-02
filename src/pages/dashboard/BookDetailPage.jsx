import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
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

// ─── Modal Step Constants ──────────────────────────────────────────
const STEP_DELIVERY = 'delivery'
const STEP_PAYMENT  = 'payment'
const STEP_MESSAGE  = 'message'

export default function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requestOpen, setRequestOpen] = useState(false)

  // Multi-step modal state
  const [step, setStep] = useState(STEP_DELIVERY)
  const [requestType, setRequestType] = useState('Delivery')      // 'Delivery' | 'Self-Pickup'
  const [paymentMethod, setPaymentMethod] = useState('esewa')     // 'esewa' | 'khalti' | 'cod'
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

  // Free listings (donate/exchange) skip payment entirely
  const isFreeListingType = book?.listingType === 'donate' || book?.listingType === 'exchange'

  function openModal() {
    // Reset step
    setStep(STEP_DELIVERY)
    setRequestType('Delivery')
    setPaymentMethod('esewa')
    setMessage('')
    setRequestOpen(true)
  }

  function handleDeliverySelect(type) {
    setRequestType(type)
    setPaymentMethod(type === 'Self-Pickup' ? 'cod' : 'esewa')
    setStep(STEP_MESSAGE)
  }

  function handlePaymentSelect(method) {
    setPaymentMethod(method)
    setStep(STEP_MESSAGE)
  }

  const handleRequest = async () => {
    setSubmitting(true)
    try {
      await createRequest(id, {
        message: message.trim() || '',
        requestType,
        paymentMethod: isFreeListingType ? 'free' : paymentMethod,
      })
      toast.success('Request sent successfully!')
      setRequestOpen(false)
      window.dispatchEvent(new Event('refresh-data'))
      navigate('/dashboard/requests')
    } catch (err) {
      toast.error(err.message || 'Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  // Determine if seller is missing QR codes (for Delivery payment methods)
  const sellerMissingEsewa  = !book?.seller?.esewaQR  && !book?.seller?.esewaQr
  const sellerMissingKhalti = !book?.seller?.khaltiQR && !book?.seller?.khaltiQr

  function getMissingQrWarning() {
    if (requestType !== 'Delivery' || isFreeListingType) return null
    if (paymentMethod === 'esewa' && sellerMissingEsewa) {
      return 'The seller has not yet uploaded their eSewa QR code. You can still send the request — the seller will need to add their QR code before you can pay.'
    }
    if (paymentMethod === 'khalti' && sellerMissingKhalti) {
      return 'The seller has not yet uploaded their Khalti QR code. You can still send the request — the seller will need to add their QR code before you can pay.'
    }
    return null
  }

  const qrWarning = getMissingQrWarning()

  if (loading) return <LoadingScreen message="Loading book details..." />
  if (!book) return null

  return (
    <DashboardPage title={book.title} subtitle={`by ${book.author}`}>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Book cover */}
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-prastav-100 to-prastav-200 sm:h-80 overflow-hidden">
            {book.imageUrl ? (
              <img
                src={book.imageUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 64 64" className="h-24 w-24 opacity-50" fill="none">
                <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" />
                <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e" />
              </svg>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-gray-900">Description</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{book.description || 'No description provided.'}</p>

            {(() => {
              const kwList = typeof book.keywords === 'string'
                ? book.keywords.split(',').map(k => k.trim()).filter(Boolean)
                : (Array.isArray(book.keywords) ? book.keywords : [])
              if (kwList.length === 0) return null
              return (
                <div className="mt-4 flex flex-wrap gap-2">
                  {kwList.map((kw) => (
                    <Badge key={kw} variant="primary">{kw}</Badge>
                  ))}
                </div>
              )
            })()}
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

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-prastav-800">
                {formatPrice(book.price)}
              </span>
              {book.seller
                ? <Badge variant="primary">{getListingTypeLabel(book.listingType)}</Badge>
                : <Badge variant="default">Dataset Catalog</Badge>
              }
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

            {book.seller ? (
              <>
                <Button className="mt-6 w-full" onClick={openModal}>
                  {book.listingType === 'donate' ? 'Request Book' : book.listingType === 'exchange' ? 'Propose Exchange' : 'Buy Now'}
                </Button>
                <Button variant="outline" className="mt-3 w-full" to={`/dashboard/chats?book=${book._id || book.id}`}>
                  Chat Seller
                </Button>
              </>
            ) : (
              <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200">
                <div className="flex items-center gap-2 font-semibold">
                  <span>📚 Dataset Catalog Book</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 font-medium">Dataset Connected ✓</span>
                </div>
                <p className="mt-2 text-amber-800 leading-relaxed text-xs sm:text-sm">
                  Yo book Prastav ko 50,000+ reference dataset sanga connect vako xa. Yo static catalog book ho (no specific student seller assigned yet). Tapai sanga yo book xa vane, tapai le list garnu saknuhunchha!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                  to={`/dashboard/listings/create?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || '')}`}
                >
                  ➕ List Your Copy Of This Book
                </Button>
              </div>
            )}
          </div>

          {/* Seller or Catalog Source card */}
          {book.seller ? (
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h3 className="font-semibold text-gray-900">Seller Details</h3>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={book.seller?.name} />
                <div>
                  <p className="font-medium text-gray-900">{book.seller?.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineStar className="h-4 w-4 text-amber-400" />
                      {book.seller?.reputationScore ?? book.seller?.reputation ?? 3.0}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineLocationMarker className="h-4 w-4 text-emerald-600" />
                      {book.seller?.district || 'Nepal'}
                    </span>
                  </div>
                </div>
              </div>
              {book.distance != null && (
                <p className="mt-3 text-sm text-prastav-700">
                  📍 {book.distance} km from your location
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h3 className="font-semibold text-gray-900">Catalog Source</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-prastav-100 text-prastav-700 text-xl font-bold">
                  📚
                </div>
                <div>
                  <p className="font-medium text-gray-900">Prastav Master Catalog</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineStar className="h-4 w-4 text-amber-400" />
                      {book.rating ? Number(book.rating).toFixed(1) : '4.5'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineLocationMarker className="h-4 w-4 text-prastav-600" />
                      Dataset Catalog Entry
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Connected database item. Specific student seller address will appear once a user posts a listing for this book.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Multi-Step Buy Modal ─────────────────────────────────── */}
      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title={
          step === STEP_DELIVERY ? '📦 Choose Delivery Method'
          : step === STEP_PAYMENT  ? '💳 Choose Payment Method'
          : '✉️ Send Request'
        }
      >
        {/* STEP 1 — Delivery Method */}
        {step === STEP_DELIVERY && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">How would you like to receive this book?</p>

            {/* Home Delivery */}
            <button
              onClick={() => handleDeliverySelect('Delivery')}
              className="w-full flex items-start gap-4 rounded-xl border-2 border-transparent bg-gray-50 p-4 text-left transition hover:border-prastav-500 hover:bg-prastav-50 focus:outline-none"
            >
              <span className="mt-0.5 rounded-xl bg-prastav-100 p-2 text-prastav-700">
                <HiOutlineTruck className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Home Delivery (Courier)</p>
                <p className="mt-0.5 text-sm text-gray-500">Book delivered to your address. Payment via eSewa or Khalti QR.</p>
              </div>
            </button>

            {/* Self Pickup */}
            <button
              onClick={() => handleDeliverySelect('Self-Pickup')}
              className="w-full flex items-start gap-4 rounded-xl border-2 border-transparent bg-gray-50 p-4 text-left transition hover:border-prastav-500 hover:bg-prastav-50 focus:outline-none"
            >
              <span className="mt-0.5 rounded-xl bg-blue-100 p-2 text-blue-700">
                <HiOutlineUser className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Self Pickup (Meetup)</p>
                <p className="mt-0.5 text-sm text-gray-500">Meet the seller at an agreed location. Payment in cash (COD).</p>
              </div>
            </button>
          </div>
        )}

        {/* STEP 2 — Payment Method (only for Delivery; Self-Pickup = COD forced) */}
        {step === STEP_PAYMENT && !isFreeListingType && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Choose how you'll pay after the seller confirms.</p>

            {/* eSewa */}
            <button
              onClick={() => handlePaymentSelect('esewa')}
              className={`w-full flex items-start gap-4 rounded-xl border-2 bg-gray-50 p-4 text-left transition focus:outline-none ${
                paymentMethod === 'esewa' ? 'border-prastav-500 bg-prastav-50' : 'border-transparent hover:border-prastav-400'
              }`}
            >
              <span className="mt-0.5 rounded-xl bg-green-100 p-2 text-green-700">
                <HiOutlineCreditCard className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">eSewa</p>
                <p className="mt-0.5 text-sm text-gray-500">Pay via eSewa QR code after seller acceptance.</p>
                {sellerMissingEsewa && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                    <HiOutlineExclamation className="h-4 w-4" />
                    Seller hasn't uploaded eSewa QR yet
                  </p>
                )}
              </div>
            </button>

            {/* Khalti */}
            <button
              onClick={() => handlePaymentSelect('khalti')}
              className={`w-full flex items-start gap-4 rounded-xl border-2 bg-gray-50 p-4 text-left transition focus:outline-none ${
                paymentMethod === 'khalti' ? 'border-prastav-500 bg-prastav-50' : 'border-transparent hover:border-prastav-400'
              }`}
            >
              <span className="mt-0.5 rounded-xl bg-purple-100 p-2 text-purple-700">
                <HiOutlineCreditCard className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Khalti</p>
                <p className="mt-0.5 text-sm text-gray-500">Pay via Khalti QR code after seller acceptance.</p>
                {sellerMissingKhalti && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                    <HiOutlineExclamation className="h-4 w-4" />
                    Seller hasn't uploaded Khalti QR yet
                  </p>
                )}
              </div>
            </button>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(STEP_DELIVERY)}>← Back</Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Message & Confirmation */}
        {step === STEP_MESSAGE && (
          <div className="space-y-4">
            {/* Summary banner */}
            <div className="rounded-xl bg-prastav-50 p-4 text-sm space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-prastav-100 px-3 py-1 text-xs font-semibold text-prastav-800">
                  {requestType === 'Delivery' ? <HiOutlineTruck className="h-4 w-4" /> : <HiOutlineUser className="h-4 w-4" />}
                  {requestType === 'Delivery' ? 'Home Delivery (Courier)' : 'Self Pickup (Meetup)'}
                </span>
                {isFreeListingType ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <HiOutlineCheckCircle className="h-4 w-4" /> Free (No Payment)
                  </span>
                ) : requestType === 'Self-Pickup' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    <HiOutlineCash className="h-4 w-4" /> Cash on Delivery (COD)
                  </span>
                ) : null}
              </div>

              {/* Preferred payment selection for Home Delivery */}
              {!isFreeListingType && requestType === 'Delivery' && (
                <div className="pt-2 border-t border-prastav-200/60">
                  <p className="text-xs font-medium text-gray-700 mb-2">Preferred QR Payment Method (after seller accepts):</p>
                  <div className="flex gap-3">
                    <label className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold cursor-pointer transition ${
                      paymentMethod === 'esewa' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="esewa"
                        checked={paymentMethod === 'esewa'}
                        onChange={() => setPaymentMethod('esewa')}
                        className="sr-only"
                      />
                      <HiOutlineCreditCard className="h-4 w-4 text-emerald-600" /> eSewa QR
                    </label>
                    <label className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold cursor-pointer transition ${
                      paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="khalti"
                        checked={paymentMethod === 'khalti'}
                        onChange={() => setPaymentMethod('khalti')}
                        className="sr-only"
                      />
                      <HiOutlineCreditCard className="h-4 w-4 text-purple-600" /> Khalti QR
                    </label>
                  </div>
                </div>
              )}
            </div>

            {!isFreeListingType && requestType === 'Delivery' && (
              <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2 border border-blue-100">
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>Request is sent to seller first. You will pay via QR code ONLY AFTER the seller accepts your request.</p>
              </div>
            )}

            <Textarea
              label="Message to Seller (optional)"
              placeholder={
                requestType === 'Self-Pickup'
                  ? 'Suggest a meetup location or landmark...'
                  : 'Hi, I am interested in buying this book...'
              }
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-between gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep(STEP_DELIVERY)}>
                ← Back
              </Button>
              <Button size="sm" onClick={handleRequest} disabled={submitting}>
                {submitting ? 'Sending Request...' : '✉️ Send Request'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardPage>
  )
}
