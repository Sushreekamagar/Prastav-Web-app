import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import BookForm from '../../components/books/BookForm'
import { LoadingScreen } from '../../components/ui/Spinner'
import { createListing, updateListing, getBookById } from '../../services/bookService'

export default function CreateListingPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState(null)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    async function load() {
      try {
        const book = await getBookById(id)
        setInitialData({
          ...book,
          keywords: book.keywords?.join(', ') || '',
        })
      } catch {
        toast.error('Listing not found')
        navigate('/dashboard/listings')
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id, isEdit, navigate])

  const handleSubmit = async (data) => {
    setLoading(true)
    const payload = {
      ...data,
      price: data.listingType === 'sell' ? Number(data.price) : 0,
      keywords: data.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    }

    try {
      if (isEdit) {
        await updateListing(id, payload)
        toast.success('Listing updated!')
      } else {
        await createListing(payload)
        toast.success('Listing created!')
      }
      navigate('/dashboard/listings')
    } catch (err) {
      toast.error(err.message || 'Failed to save listing')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <LoadingScreen message="Loading listing..." />

  return (
    <DashboardPage
      title={isEdit ? 'Edit Listing' : 'Create Listing'}
      subtitle={isEdit ? 'Update your book listing details' : 'Add a new book to the marketplace'}
    >
      <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-md">
        <BookForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
      </div>
    </DashboardPage>
  )
}
