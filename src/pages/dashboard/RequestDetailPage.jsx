import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  HiOutlineStar,
  HiOutlineLocationMarker,
  HiOutlineUpload,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Avatar from '../../components/ui/Avatar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TransactionTimeline from '../../components/transactions/TransactionTimeline'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import {
  getRequestById,
  updateRequestStatus,
  cancelRequest,
  uploadPaymentProof,
  verifyPayment,
  completeTransaction,
  submitRating,
} from '../../services/requestService'
import {
  formatDate,
  formatPrice,
  getConditionLabel,
  getCategoryLabel,
} from '../../utils/formatters'
import { REQUEST_STATUS, PAYMENT_METHODS } from '../../utils/bookConstants'
import { getGradeLabel } from '../../utils/navigation'

function MockQR({ wallet }) {
  const isEsewa = wallet === 'esewa'
  const brandColor = isEsewa ? '#60bb46' : '#5c2d91'
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white shadow-sm">
      <div className="relative p-3 bg-white rounded-xl shadow-md border border-gray-100">
        <svg width="160" height="160" viewBox="0 0 100 100" className="w-40 h-40">
          {/* Outer corners / alignment markers */}
          <rect x="0" y="0" width="25" height="25" fill={brandColor} rx="3" />
          <rect x="3" y="3" width="19" height="19" fill="white" rx="2" />
          <rect x="6" y="6" width="13" height="13" fill={brandColor} rx="1" />

          <rect x="75" y="0" width="25" height="25" fill={brandColor} rx="3" />
          <rect x="78" y="3" width="19" height="19" fill="white" rx="2" />
          <rect x="81" y="6" width="13" height="13" fill={brandColor} rx="1" />

          <rect x="0" y="75" width="25" height="25" fill={brandColor} rx="3" />
          <rect x="3" y="78" width="19" height="19" fill="white" rx="2" />
          <rect x="6" y="81" width="13" height="13" fill={brandColor} rx="1" />

          {/* Simulated QR dots */}
          <rect x="35" y="5" width="5" height="5" fill="#333" rx="1" />
          <rect x="45" y="10" width="10" height="5" fill="#333" rx="1" />
          <rect x="60" y="5" width="5" height="15" fill="#333" rx="1" />
          <rect x="30" y="20" width="15" height="5" fill="#333" rx="1" />
          
          <rect x="5" y="35" width="10" height="5" fill="#333" rx="1" />
          <rect x="20" y="30" width="5" height="15" fill="#333" rx="1" />
          <rect x="35" y="35" width="15" height="5" fill="#333" rx="1" />
          <rect x="55" y="30" width="5" height="10" fill="#333" rx="1" />
          <rect x="65" y="35" width="15" height="5" fill="#333" rx="1" />
          <rect x="85" y="30" width="10" height="5" fill="#333" rx="1" />

          <rect x="5" y="55" width="15" height="5" fill="#333" rx="1" />
          <rect x="30" y="50" width="5" height="15" fill="#333" rx="1" />
          <rect x="40" y="55" width="20" height="5" fill="#333" rx="1" />
          <rect x="65" y="50" width="5" height="15" fill="#333" rx="1" />
          <rect x="75" y="55" width="15" height="5" fill="#333" rx="1" />

          <rect x="35" y="70" width="10" height="10" fill="#333" rx="1" />
          <rect x="50" y="75" width="15" height="5" fill="#333" rx="1" />
          <rect x="70" y="70" width="5" height="15" fill="#333" rx="1" />
          <rect x="80" y="75" width="15" height="5" fill="#333" rx="1" />

          {/* Logo Badge in the center */}
          <rect x="38" y="38" width="24" height="24" rx="6" fill={brandColor} />
          <rect x="40" y="40" width="20" height="20" rx="4" fill="white" />
          {isEsewa ? (
            <text x="50" y="54" fontSize="12" fontWeight="bold" fill={brandColor} textAnchor="middle">eS</text>
          ) : (
            <text x="50" y="54" fontSize="11" fontWeight="bold" fill={brandColor} textAnchor="middle">Kh</text>
          )}
        </svg>
      </div>
      <span className="mt-3 text-xs font-semibold text-gray-500">Scan via {isEsewa ? 'eSewa App' : 'Khalti App'}</span>
    </div>
  )
}

export default function RequestDetailPage({ mode = 'request' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isSeller } = useDashboardMode()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('esewa')
  const [paymentFile, setPaymentFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getRequestById(id)
      setRequest(data)
    } catch {
      toast.error('Request not found')
      navigate(mode === 'transaction' ? '/dashboard/transactions' : '/dashboard/requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <LoadingScreen message="Loading details..." />
  if (!request) return null

  const statusInfo = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending
  const isBuyerView = !isSeller
  const isSellerView = isSeller

  const handleAccept = async () => {
    try {
      await updateRequestStatus(id, 'accepted')
      toast.success('Request accepted!')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to accept')
    }
  }

  const handleReject = async () => {
    try {
      await updateRequestStatus(id, 'rejected')
      toast.success('Request rejected')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to reject')
    }
  }

  const handleCancel = async () => {
    setSubmitting(true)
    try {
      await cancelRequest(id)
      toast.success('Request cancelled')
      setCancelOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentUpload = async () => {
    if (!paymentFile) {
      toast.error('Please select a payment screenshot')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('paymentMethod', paymentMethod)
      formData.append('screenshot', paymentFile)
      await uploadPaymentProof(id, formData)
      toast.success('Payment proof uploaded!')
      setPaymentOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (verified) => {
    try {
      await verifyPayment(id, verified)
      toast.success(verified ? 'Payment verified!' : 'Payment rejected')
      load()
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    }
  }

  const handleComplete = async () => {
    try {
      await completeTransaction(id)
      toast.success('Transaction completed!')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to complete')
    }
  }

  const handleRating = async () => {
    setSubmitting(true)
    try {
      await submitRating(id, rating, review)
      toast.success('Rating submitted!')
      setRatingOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs =
    mode === 'transaction'
      ? [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Transactions', to: '/dashboard/transactions' },
          { label: 'Transaction Details' },
        ]
      : undefined

  return (
    <DashboardPage
      title={request.book?.title || 'Request Details'}
      subtitle={`Status: ${statusInfo.label}`}
      breadcrumbs={breadcrumbs}
    >
      <PageTransition>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Link
            to={`/dashboard/books/${request.book?._id}`}
            className="text-sm font-medium text-prastav-700 hover:underline"
          >
            View Book
          </Link>
          <Link
            to={`/dashboard/chats?request=${id}`}
            className="text-sm font-medium text-prastav-700 hover:underline"
          >
            Open Chat
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h3 className="font-semibold text-gray-900">Book Information</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoRow label="Title" value={request.book?.title} />
                <InfoRow label="Author" value={request.book?.author} />
                <InfoRow label="Grade" value={getGradeLabel(request.book?.grade)} />
                <InfoRow label="Price" value={formatPrice(request.book?.price)} />
                <InfoRow label="Category" value={getCategoryLabel(request.book?.category)} />
                <InfoRow label="Condition" value={getConditionLabel(request.book?.condition)} />
              </div>
              {request.message && (
                <p className="mt-4 rounded-xl bg-prastav-50 p-4 text-sm text-gray-600">
                  &ldquo;{request.message}&rdquo;
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h3 className="font-semibold text-gray-900">Buyer Information</h3>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name={request.buyer?.name} />
                  <div>
                    <p className="font-medium">{request.buyer?.name}</p>
                    <p className="text-sm text-gray-500">{request.buyer?.email}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h3 className="font-semibold text-gray-900">Seller Information</h3>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name={request.seller?.name || request.book?.seller?.name} />
                  <div>
                    <p className="font-medium">{request.seller?.name || request.book?.seller?.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <HiOutlineStar className="h-4 w-4 text-amber-400" />
                      {request.seller?.reputation || request.book?.seller?.reputation}
                      <HiOutlineLocationMarker className="ml-2 h-4 w-4" />
                      {request.seller?.district || request.book?.seller?.district}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── QR Payment Section: shown to buyer once request is accepted ── */}
            {isBuyerView && request.status === 'accepted' && (
              <div className="rounded-2xl bg-white p-6 shadow-md border-2 border-prastav-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-prastav-100">
                    <span className="text-lg">💳</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Pay the Seller</h3>
                    <p className="text-xs text-gray-500">Request accepted! Scan QR to pay, then upload screenshot.</p>
                  </div>
                </div>

                <div className="rounded-xl bg-prastav-50 p-4 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Amount to Pay</p>
                    <p className="text-2xl font-black text-prastav-800">{formatPrice(request.book?.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">To</p>
                    <p className="text-sm font-semibold text-gray-800">{request.seller?.name || request.book?.seller?.name}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* eSewa QR */}
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                    <p className="text-xs font-bold text-[#60bb46] mb-2 flex items-center gap-1">💚 eSewa</p>
                    {request.seller?.esewaQr ? (
                      <img
                        src={request.seller.esewaQr}
                        alt="eSewa QR"
                        className="w-full max-w-[160px] mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <MockQR wallet="esewa" />
                    )}
                    {request.seller?.esewaNumber && (
                      <p className="mt-2 text-center text-xs font-semibold text-gray-600">{request.seller.esewaNumber}</p>
                    )}
                  </div>

                  {/* Khalti QR */}
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                    <p className="text-xs font-bold text-[#5c2d91] mb-2 flex items-center gap-1">💜 Khalti</p>
                    {request.seller?.khaltiQr ? (
                      <img
                        src={request.seller.khaltiQr}
                        alt="Khalti QR"
                        className="w-full max-w-[160px] mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <MockQR wallet="khalti" />
                    )}
                    {request.seller?.khaltiNumber && (
                      <p className="mt-2 text-center text-xs font-semibold text-gray-600">{request.seller.khaltiNumber}</p>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                  After paying, tap <span className="font-semibold text-prastav-700">Upload Payment Proof</span> below to send your screenshot.
                </p>
              </div>
            )}

            {(request.paymentMethod || request.paymentScreenshot) && (
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h3 className="font-semibold text-gray-900">Payment Details</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Payment Method" value={request.paymentMethod?.toUpperCase()} />
                  <InfoRow label="Verification" value={statusInfo.label} />
                </div>
                {request.paymentScreenshot && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Uploaded Proof</p>
                    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 inline-block max-w-xs">
                      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <div className="h-44 w-full bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
                          <div className="bg-white rounded-lg p-3 shadow-md w-full text-center space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Success</span>
                            <p className="text-xs font-semibold text-gray-400">Transfer Receipt</p>
                            <p className="text-base font-black text-gray-800">{formatPrice(request.book?.price)}</p>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold mt-3">Verified Transaction Vouched</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <TransactionTimeline request={request} />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h3 className="font-semibold text-gray-900">Dates</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Request Date</dt>
                  <dd className="font-medium">{formatDate(request.createdAt)}</dd>
                </div>
                {request.acceptedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Accepted Date</dt>
                    <dd className="font-medium">{formatDate(request.acceptedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md space-y-3">
              <h3 className="font-semibold text-gray-900">Actions</h3>

              {isSellerView && request.status === 'pending' && (
                <>
                  <Button className="w-full" onClick={handleAccept}>
                    <HiOutlineCheck className="h-4 w-4" /> Accept Request
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleReject}>
                    <HiOutlineX className="h-4 w-4" /> Reject Request
                  </Button>
                </>
              )}

              {isBuyerView && request.status === 'pending' && (
                <Button variant="outline" className="w-full !text-red-600" onClick={() => setCancelOpen(true)}>
                  Cancel Request
                </Button>
              )}

              {isBuyerView && request.status === 'accepted' && (
                <Button className="w-full" onClick={() => setPaymentOpen(true)}>
                  <HiOutlineUpload className="h-4 w-4" /> Upload Payment Proof
                </Button>
              )}

              {isSellerView && (request.status === 'payment_pending' || request.status === 'payment_uploaded') && (
                <>
                  <Button className="w-full" onClick={() => handleVerify(true)}>Verify Payment</Button>
                  <Button variant="outline" className="w-full" onClick={() => handleVerify(false)}>Reject Payment</Button>
                </>
              )}

              {isSellerView && request.status === 'payment_verified' && (
                <Button className="w-full" onClick={handleComplete}>Complete Transaction</Button>
              )}

              {request.status === 'completed' && (
                <Button variant="outline" className="w-full" onClick={() => setRatingOpen(true)}>
                  Rate {isBuyerView ? 'Seller' : 'Buyer'}
                </Button>
              )}

              <Button variant="ghost" className="w-full" to="/dashboard/transactions">
                View in Transactions
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>

      <Modal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} title="Scan & Upload Payment Proof">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Select Wallet</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('esewa')}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 border-2 transition-all font-bold ${
                  paymentMethod === 'esewa'
                    ? 'border-[#60bb46] bg-[#eefbf0] text-[#60bb46]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>💚</span> eSewa
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('khalti')}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 border-2 transition-all font-bold ${
                  paymentMethod === 'khalti'
                    ? 'border-[#5c2d91] bg-[#f7f3fb] text-[#5c2d91]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>💜</span> Khalti
              </button>
            </div>
          </div>

          <MockQR wallet={paymentMethod} />

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-center">
            <p className="text-xs text-gray-500">Amount to pay</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">{formatPrice(request.book?.price)}</p>
            <p className="text-[10px] text-gray-400 mt-1">To: {request.seller?.name || request.book?.seller?.name}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Upload Screenshot / Payment Proof</label>
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPaymentFile(e.target.files?.[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <HiOutlineUpload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-xs font-semibold text-gray-600">
                {paymentFile ? paymentFile.name : 'Tap to upload screenshot or take photo'}
              </span>
              <span className="text-[10px] text-gray-400 mt-1">Camera or Gallery • PNG, JPG, JPEG</span>
            </div>
            {paymentFile && (
              <div className="mt-3 flex items-center justify-center border border-gray-200 rounded-xl p-2 bg-white max-h-48 overflow-hidden">
                <img src={URL.createObjectURL(paymentFile)} alt="Payment Preview" className="max-h-40 rounded-lg object-contain" />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePaymentUpload} disabled={submitting || !paymentFile} className="!bg-[#0D723B] hover:!bg-[#0A5D30]">
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={ratingOpen} onClose={() => setRatingOpen(false)} title="Submit Rating">
        <Select
          label="Rating"
          options={[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} Stars` }))}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <textarea
          className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-sm"
          rows={3}
          placeholder="Write a review (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setRatingOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleRating} disabled={submitting}>Submit</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Request"
        message="Are you sure you want to cancel this request? This action cannot be undone."
        confirmLabel="Cancel Request"
        loading={submitting}
      />
    </DashboardPage>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}
