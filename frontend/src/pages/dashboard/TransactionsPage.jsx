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
import { REQUEST_STATUS } from '../../utils/bookConstants'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRequests('transactions')
      setTransactions(Array.isArray(data) ? data : data.requests || [])
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

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
      key: 'buyer',
      label: 'Buyer',
      render: (row) => row.buyer?.name || '—',
    },
    {
      key: 'seller',
      label: 'Seller',
      render: (row) => row.seller?.name || row.book?.seller?.name || '—',
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => formatPrice(row.book?.price),
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
        const info = REQUEST_STATUS[row.status] || REQUEST_STATUS.pending
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
  ]

  return (
    <DashboardPage title="Transactions" subtitle="Track your book exchange transactions">
      <PageTransition>
        {transactions.length === 0 ? (
          <EmptyState
            icon={HiOutlineSwitchHorizontal}
            title="No transactions yet"
            description="Transactions appear after a request is accepted."
            actionLabel="View Requests"
            actionTo="/dashboard/requests"
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
                options: Object.entries(REQUEST_STATUS).map(([value, { label }]) => ({ value, label })),
              },
            ]}
            statusKey="status"
            statusMap={REQUEST_STATUS}
            onView={(row) => navigate(`/dashboard/transactions/${row._id}`)}
            emptyTitle="No transactions found"
          />
        )}
      </PageTransition>
    </DashboardPage>
  )
}
