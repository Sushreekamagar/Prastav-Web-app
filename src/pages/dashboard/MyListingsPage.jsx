import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineClipboardList } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import { getMyListings, deleteListing } from '../../services/bookService'
import { formatPrice, formatDate, getConditionLabel, getListingTypeLabel } from '../../utils/formatters'
import { BOOK_CONDITIONS, LISTING_TYPES } from '../../utils/bookConstants'

export default function MyListingsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const loadListings = async () => {
    setLoading(true)
    try {
      const data = await getMyListings()
      setListings(Array.isArray(data) ? data : data.listings || [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  const handleDelete = async () => {
    if (!deleteRow) return
    setDeleting(true)
    try {
      await deleteListing(deleteRow._id)
      toast.success('Listing deleted')
      setListings((prev) => prev.filter((l) => l._id !== deleteRow._id))
      setDeleteRow(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete listing')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    {
      key: 'price',
      label: 'Price',
      render: (row) => formatPrice(row.price),
    },
    {
      key: 'listingType',
      label: 'Type',
      render: (row) => getListingTypeLabel(row.listingType),
    },
    {
      key: 'condition',
      label: 'Condition',
      render: (row) => getConditionLabel(row.condition),
    },
    {
      key: 'createdAt',
      label: 'Listed',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'default'}>{row.status || 'active'}</Badge>,
    },
  ]

  if (loading) return <LoadingScreen message="Loading listings..." />

  return (
    <DashboardPage title="My Books" subtitle="Manage your book listings">
      <PageTransition>
        <div className="mb-6 flex justify-end">
          <Button to="/dashboard/listings/new">+ Add Book</Button>
        </div>

        <DataTable
          columns={columns}
          data={listings}
          searchKeys={['title', 'author']}
          searchPlaceholder="Search your listings..."
          filters={[
            { key: 'listingType', label: 'Type', options: LISTING_TYPES },
            { key: 'condition', label: 'Condition', options: BOOK_CONDITIONS },
          ]}
          onView={(row) => navigate(`/dashboard/books/${row._id}`)}
          onEdit={(row) => navigate(`/dashboard/listings/edit/${row._id}`)}
          onDelete={(row) => setDeleteRow(row)}
          emptyTitle="No listings yet"
          emptyDescription="Create your first listing to start selling, exchanging, or donating books."
          emptyActionLabel="Add Book"
          emptyActionTo="/dashboard/listings/new"
        />

        <ConfirmDialog
          isOpen={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleDelete}
          title="Delete Listing"
          message="Are you sure you want to delete this listing? This action cannot be undone."
          confirmLabel="Delete"
          loading={deleting}
        />
      </PageTransition>
    </DashboardPage>
  )
}
