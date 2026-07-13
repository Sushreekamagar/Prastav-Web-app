import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiOutlineInbox } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Tabs from '../../components/ui/Tabs'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RequestCard from '../../components/requests/RequestCard'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { getRequests, cancelRequest } from '../../services/requestService'

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [cancelId, setCancelId] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const { isSeller } = useDashboardMode()

  const defaultTab = searchParams.get('type') === 'incoming' && isSeller ? 'incoming' : isSeller ? 'incoming' : 'outgoing'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const type = activeTab === 'incoming' ? 'incoming' : activeTab === 'outgoing' ? 'outgoing' : 'all'
      const data = await getRequests(type)
      setRequests(Array.isArray(data) ? data : data.requests || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await cancelRequest(cancelId)
      toast.success('Request cancelled')
      setCancelId(null)
      loadRequests()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request')
    } finally {
      setCancelling(false)
    }
  }

  const tabs = isSeller
    ? [
        { id: 'incoming', label: 'Incoming' },
        { id: 'all', label: 'All' },
      ]
    : [
        { id: 'outgoing', label: 'My Requests' },
        { id: 'all', label: 'All' },
      ]

  const filtered =
    activeTab === 'all'
      ? requests
      : requests.filter((r) => {
          if (activeTab === 'incoming') return r.status === 'pending' || r.status === 'payment_pending'
          return true
        })

  return (
    <DashboardPage
      title={isSeller ? 'Pending Requests' : 'My Requests'}
      subtitle="Manage your book requests and track their status"
    >
      <PageTransition>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {loading ? (
          <LoadingScreen message="Loading requests..." />
        ) : filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={HiOutlineInbox}
              title="No requests found"
              description={
                isSeller
                  ? 'Incoming requests from buyers will appear here.'
                  : 'Browse books and send a request to get started.'
              }
              actionLabel={isSeller ? 'Manage Listings' : 'Browse Books'}
              actionTo={isSeller ? '/dashboard/listings' : '/dashboard/books'}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                viewAs={isSeller ? 'seller' : 'buyer'}
                onCancel={(id) => setCancelId(id)}
                detailPath={`/dashboard/requests/${req._id}`}
              />
            ))}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!cancelId}
          onClose={() => setCancelId(null)}
          onConfirm={handleCancel}
          title="Cancel Request"
          message="Are you sure you want to cancel this request?"
          confirmLabel="Cancel Request"
          loading={cancelling}
        />
      </PageTransition>
    </DashboardPage>
  )
}
