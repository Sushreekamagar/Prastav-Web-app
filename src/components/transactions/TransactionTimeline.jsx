import { REQUEST_STATUS } from '../../utils/bookConstants'
import { formatDate } from '../../utils/formatters'

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Request Sent' },
  { key: 'accepted', label: 'Request Accepted' },
  { key: 'payment_pending', label: 'Payment Uploaded' },
  { key: 'payment_verified', label: 'Payment Verified' },
  { key: 'completed', label: 'Transaction Completed' },
]

const STATUS_ORDER = ['pending', 'accepted', 'payment_pending', 'payment_uploaded', 'payment_verified', 'completed']

function getStepIndex(status) {
  if (status === 'rejected' || status === 'cancelled') return -1
  if (status === 'payment_uploaded') return STATUS_ORDER.indexOf('payment_pending')
  return STATUS_ORDER.indexOf(status)
}

export default function TransactionTimeline({ request }) {
  const currentIndex = getStepIndex(request.status)
  const isFailed = request.status === 'rejected' || request.status === 'cancelled'

  if (isFailed) {
    const info = REQUEST_STATUS[request.status]
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <p className="mt-3 text-sm text-gray-600">
          This request was {info?.label?.toLowerCase()} on {formatDate(request.updatedAt || request.createdAt)}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h3 className="font-semibold text-gray-900">Timeline</h3>
      <ol className="mt-4 space-y-4">
        {TIMELINE_STEPS.map((step, index) => {
          const done = currentIndex >= index
          const active = currentIndex === index
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-prastav-700 text-white' : 'bg-gray-200 text-gray-500'
                } ${active ? 'ring-2 ring-prastav-300 ring-offset-2' : ''}`}
              >
                {index + 1}
              </span>
              <div>
                <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-prastav-700">Current step</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
