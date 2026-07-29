import { REQUEST_STATUS } from '../../utils/bookConstants'
import { formatDate } from '../../utils/formatters'

// ─── Timeline step definitions ────────────────────────────────────

const DELIVERY_STEPS = [
  { key: 'pending',           label: 'Request Sent',        icon: '📨' },
  { key: 'accepted',          label: 'Accepted by Seller',  icon: '✅' },
  { key: 'payment_pending',   label: 'Awaiting Payment',    icon: '💳' },
  { key: 'payment_uploaded',  label: 'Payment Uploaded',    icon: '📤' },
  { key: 'payment_verified',  label: 'Payment Verified',    icon: '🔒' },
  { key: 'completed',         label: 'Book Delivered',      icon: '📦' },
]

const COD_STEPS = [
  { key: 'pending',    label: 'Request Sent',      icon: '📨' },
  { key: 'accepted',   label: 'Accepted — Meetup', icon: '🤝' },
  { key: 'completed',  label: 'Completed (COD)',   icon: '💵' },
]

const FREE_STEPS = [
  { key: 'pending',    label: 'Request Sent',      icon: '📨' },
  { key: 'accepted',   label: 'Request Accepted',  icon: '🤝' },
  { key: 'completed',  label: 'Completed',         icon: '🎉' },
]

const DELIVERY_ORDER = ['pending', 'accepted', 'payment_pending', 'payment_uploaded', 'payment_verified', 'completed']
const COD_ORDER      = ['pending', 'accepted', 'completed']
const FREE_ORDER     = ['pending', 'accepted', 'completed']

function getDeliveryIndex(status) {
  if (status === 'rejected' || status === 'cancelled') return -1
  if (status === 'accepted') return 1
  return DELIVERY_ORDER.indexOf(status)
}

function getCODIndex(status) {
  if (status === 'rejected' || status === 'cancelled') return -1
  return COD_ORDER.indexOf(status)
}

function getFREEIndex(status) {
  if (status === 'rejected' || status === 'cancelled') return -1
  return FREE_ORDER.indexOf(status)
}

export default function TransactionTimeline({ request }) {
  const isDelivery = ['esewa', 'khalti'].includes(request.paymentMethod)
  const isCOD      = request.paymentMethod === 'cod'
  const isFree     = request.paymentMethod === 'free' || !request.paymentMethod
  const isFailed   = request.status === 'rejected' || request.status === 'cancelled'

  let steps = FREE_STEPS
  let getIndex = getFREEIndex

  if (isDelivery) {
    steps = DELIVERY_STEPS
    getIndex = getDeliveryIndex
  } else if (isCOD) {
    steps = COD_STEPS
    getIndex = getCODIndex
  }

  const currentIdx  = getIndex(request.status)

  if (isFailed) {
    const info = REQUEST_STATUS[request.status]
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">❌ This request was {info?.label?.toLowerCase()}.</p>
          <p className="mt-1 text-xs text-red-500">{formatDate(request.updatedAt || request.createdAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        {isCOD && (
          <span className="text-xs rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-medium">
            COD · Self Pickup
          </span>
        )}
        {isDelivery && (
          <span className="text-xs rounded-full bg-prastav-100 px-2 py-0.5 text-prastav-700 font-medium">
            Home Delivery
          </span>
        )}
        {isFree && (
          <span className="text-xs rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">
            Free Exchange/Donation
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-prastav-500 transition-all duration-700"
          style={{ width: `${steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 100}%` }}
        />
      </div>

      <ol className="space-y-4">
        {steps.map((step, index) => {
          const done   = currentIdx >= index
          const active = currentIdx === index
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  done
                    ? 'bg-prastav-600 text-white shadow-md shadow-prastav-200'
                    : 'bg-gray-100 text-gray-400'
                } ${active ? 'ring-2 ring-prastav-300 ring-offset-2 scale-110' : ''}`}
              >
                {done ? step.icon : index + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-prastav-600 font-medium">← Current step</p>
                )}
                {done && !active && (
                  <p className="text-xs text-gray-400">Completed</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
