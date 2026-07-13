import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { HiOutlineStar, HiOutlineShieldCheck, HiOutlineBookOpen } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { updateProfile, uploadProfileAvatar, uploadPaymentQr } from '../../services/authService'
import { getMyListings } from '../../services/bookService'
import { getRequests } from '../../services/requestService'
import { GRADES, NEPAL_DISTRICTS, USER_ROLES } from '../../utils/bookConstants'
import { formatPrice, formatDate } from '../../utils/formatters'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { isSeller } = useDashboardMode()
  const [loading, setLoading] = useState(false)
  const [listedBooks, setListedBooks] = useState([])
  const [purchasedBooks, setPurchasedBooks] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      district: user?.district || '',
      grade: user?.grade || '',
      role: user?.role || '',
      bio: user?.bio || '',
      esewaNumber: user?.esewaNumber || '',
      khaltiNumber: user?.khaltiNumber || '',
    },
  })

  useEffect(() => {
    async function loadBooks() {
      try {
        if (isSeller) {
          const data = await getMyListings()
          setListedBooks(Array.isArray(data) ? data : data.listings || [])
        }
        const reqs = await getRequests('outgoing')
        const completed = (Array.isArray(reqs) ? reqs : reqs.requests || []).filter(
          (r) => r.status === 'completed',
        )
        setPurchasedBooks(completed.map((r) => r.book).filter(Boolean))
      } catch {
        /* handled by services */
      }
    }
    loadBooks()
  }, [isSeller])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const updated = await updateProfile(data)
      updateUser(updated)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const updated = await uploadProfileAvatar(formData)
      updateUser(updated)
      toast.success('Profile photo updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    }
  }

  const handleQrUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append(type, file)
    try {
      const updated = await uploadPaymentQr(formData)
      updateUser(updated)
      toast.success(`${type === 'esewaQr' ? 'eSewa' : 'Khalti'} QR uploaded!`)
    } catch (err) {
      toast.error(err.message || 'Failed to upload QR')
    }
  }

  return (
    <DashboardPage title="Profile" subtitle="Manage your account and reputation">
      <PageTransition>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md text-center">
            <div className="relative mx-auto w-fit">
              <Avatar name={user?.name} src={user?.avatar} size="xl" className="mx-auto" />
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-prastav-700 p-2 text-white shadow-md hover:bg-prastav-800">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <span className="text-xs">+</span>
              </label>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <HiOutlineStar className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-gray-900">{user?.reputation || '—'}</span>
              <span className="text-sm text-gray-400">({user?.totalRatings || 0} ratings)</span>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="primary" className="capitalize">{user?.role}</Badge>
              {user?.isVerified && (
                <Badge variant="success">
                  <HiOutlineShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  Verified
                </Badge>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              {user?.district} · {GRADES.find((g) => g.value === user?.grade)?.label || user?.grade}
            </p>

            <Button to="/dashboard/transactions" variant="outline" size="sm" className="mt-4">
              Transaction History
            </Button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <Input
                label="Full Name"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Phone"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: { value: /^9\d{9}$/, message: 'Enter a valid 10-digit number' },
                })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="District"
                  options={NEPAL_DISTRICTS.map((d) => ({ value: d, label: d }))}
                  error={errors.district?.message}
                  {...register('district', { required: 'District is required' })}
                />
                <Select
                  label="Grade Level"
                  options={GRADES}
                  error={errors.grade?.message}
                  {...register('grade', { required: 'Grade is required' })}
                />
              </div>
              <Input label="Bio" {...register('bio')} />
              <Select
                label="Role"
                options={USER_ROLES}
                error={errors.role?.message}
                {...register('role', { required: 'Role is required' })}
              />

              {(isSeller || user?.role === 'seller' || user?.role === 'both') && (
                <div className="rounded-xl border border-prastav-100 bg-prastav-50/50 p-4">
                  <h4 className="font-medium text-gray-900">Payment QR Codes</h4>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Input label="eSewa Number" {...register('esewaNumber')} />
                      <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-prastav-700 hover:underline">
                        Upload eSewa QR
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e, 'esewaQr')} />
                      </label>
                    </div>
                    <div>
                      <Input label="Khalti Number" {...register('khaltiNumber')} />
                      <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-prastav-700 hover:underline">
                        Upload Khalti QR
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e, 'khaltiQr')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {isSeller && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Listed Books</h3>
              <Button to="/dashboard/listings" variant="ghost" size="sm">Manage All</Button>
            </div>
            <div className="mt-4 space-y-3">
              {listedBooks.length === 0 ? (
                <p className="text-sm text-gray-500">No listed books yet.</p>
              ) : (
                listedBooks.map((book) => (
                  <Link
                    key={book._id}
                    to={`/dashboard/books/${book._id}`}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <HiOutlineBookOpen className="h-5 w-5 text-prastav-700" />
                      <div>
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-500">{formatPrice(book.price)} · {formatDate(book.createdAt)}</p>
                      </div>
                    </div>
                    <Badge>{book.status || 'active'}</Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {!isSeller && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900">Purchased Books</h3>
            <div className="mt-4 space-y-3">
              {purchasedBooks.length === 0 ? (
                <p className="text-sm text-gray-500">No completed purchases yet.</p>
              ) : (
                purchasedBooks.map((book) => (
                  <Link
                    key={book._id}
                    to={`/dashboard/books/${book._id}`}
                    className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                  >
                    <HiOutlineBookOpen className="h-5 w-5 text-prastav-700" />
                    <div>
                      <p className="font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardPage>
  )
}
