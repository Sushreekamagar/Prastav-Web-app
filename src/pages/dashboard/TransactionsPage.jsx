import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineSwitchHorizontal } from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import EmptyState from '../../components/ui/EmptyState'
import { getRequests } from '../../services/requestService'
import { formatDate, formatPrice } from '../../utils/formatters'
import { REQUEST_STATUS, TRANSACTION_STATUSES } from '../../utils/bookConstants'
import { useDashboardMode } from '../../hooks/useDashboardMode'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isSeller } = useDashboardMode()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch both outgoing (buyer) and incoming (seller) transactions based on role
      const type = isSeller ? 'incoming' : 'outgoing'
      const data = await getRequests(type)
      const allRequests = Array.isArray(data) ? data : (data.requests || [])
      // Filter to only show transaction-stage statuses (accepted onwards)
      const txs = allRequests.filter((r) => TRANSACTION_STATUSES.includes(r.status))
      setTransactions(txs)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [isSeller])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingScreen message="Loading transactions..." />

  const columns = [
    {
      key: 'book',
      label: 'Book',
      render: (row) => row.book?.title || '—',
    },
    {
      key: 'counterparty',
      label: isSeller ? 'Buyer' : 'Seller',
      render: (row) => isSeller ? (row.buyer?.name || '—') : (row.seller?.name || '—'),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => formatPrice(row.book?.price || row.paymentAmount),
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (row) => row.paymentMethod ? row.paymentMethod.toUpperCase() : '—',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const info = REQUEST_STATUS[row.status] || REQUEST_STATUS.accepted
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
  ]

  return (
    <DashboardPage title="Transactions" subtitle="Track your active and completed book exchange transactions">
      <PageTransition>
        {transactions.length === 0 ? (
          <EmptyState
            icon={HiOutlineSwitchHorizontal}
            title="No transactions yet"
            description={
              isSeller
                ? 'Transactions appear after you accept a buyer\'s request.'
                : 'Transactions appear after a seller accepts your request.'
            }
            actionLabel={isSeller ? 'View Requests' : 'Browse Books'}
            actionTo={isSeller ? '/dashboard/requests' : '/dashboard/books'}
          />
        ) : (
          <DataTable
            columns={columns}
            data={transactions}
            searchKeys={['book.title', 'buyer.name', 'seller.name']}
            searchPlaceholder="Search transactions..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: TRANSACTION_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS[s]?.label || s })),
              },
            ]}
            statusKey="status"
            statusMap={REQUEST_STATUS}
            onView={(row) => navigate(`/dashboard/requests/${row._id}`)}
            emptyTitle="No transactions found"
          />
        )}
      </PageTransition>
    </DashboardPage>
  )
}
