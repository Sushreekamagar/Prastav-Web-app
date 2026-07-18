import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlineBookOpen,
  HiOutlineLocationMarker,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
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
import { updateProfile, uploadProfileAvatar, uploadPaymentQr, updateLocation } from '../../services/authService'
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

  const handleQrDelete = async (type) => {
    if (!window.confirm(`Are you sure you want to delete your ${type === 'esewa' ? 'eSewa' : 'Khalti'} QR Code?`)) return
    const fieldKey = type === 'esewa' ? 'esewaQR' : 'khaltiQR'
    try {
      const updated = await updateProfile({ [fieldKey]: null })
      updateUser(updated)
      toast.success(`${type === 'esewa' ? 'eSewa' : 'Khalti'} QR deleted successfully! 🗑️`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete QR')
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const updated = await updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          updateUser(updated)
          toast.success('GPS Location updated successfully!')
        } catch (err) {
          toast.error(err.message || 'Failed to save location coordinates')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        toast.error(`Error finding location: ${err.message}. Please allow location access.`)
        setLoading(false)
      }
    )
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
              
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <HiOutlineLocationMarker className="h-4 w-4 text-prastav-700" />
                      GPS Location Coordinates
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.location?.coordinates && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0
                        ? `Configured: [${user.location.coordinates[1].toFixed(4)}° N, ${user.location.coordinates[0].toFixed(4)}° E]`
                        : 'Not configured yet ( Kathmandu defaults will be used for calculations)'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation} disabled={loading}>
                    Update GPS Location
                  </Button>
                </div>
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
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    Payment QR Codes
                    <Link to="/dashboard/settings" className="ml-auto text-xs text-prastav-600 hover:underline font-normal">
                      Manage in Settings →
                    </Link>
                  </h4>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {/* eSewa QR mini-card */}
                    {(() => {
                      const qr = user?.esewaQR
                      const qrUrl = qr ? (qr.startsWith('http') ? qr : `/uploads/${qr}`) : null
                      return (
                        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-green-700">eSewa QR</span>
                            {qrUrl
                              ? <span className="flex items-center gap-1 text-xs text-green-700 font-semibold"><HiOutlineCheckCircle className="h-3.5 w-3.5" /> Uploaded</span>
                              : <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><HiOutlineExclamationCircle className="h-3.5 w-3.5" /> Missing</span>
                            }
                          </div>
                          {qrUrl && (
                            <img src={qrUrl} alt="eSewa QR" className="h-20 w-full object-contain rounded-lg border border-green-200 bg-white" />
                          )}
                          <div className="flex gap-2">
                            <label className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-green-300 bg-white py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors">
                              <HiOutlineUpload className="h-3.5 w-3.5" />
                              {qrUrl ? 'Replace' : 'Upload'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e, 'esewaQr')} />
                            </label>
                            {qrUrl && (
                              <button
                                type="button"
                                onClick={() => handleQrDelete('esewa')}
                                className="flex items-center justify-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          <Input label="eSewa Number" size="sm" {...register('esewaNumber')} />
                        </div>
                      )
                    })()}
                    {/* Khalti QR mini-card */}
                    {(() => {
                      const qr = user?.khaltiQR
                      const qrUrl = qr ? (qr.startsWith('http') ? qr : `/uploads/${qr}`) : null
                      return (
                        <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700">Khalti QR</span>
                            {qrUrl
                              ? <span className="flex items-center gap-1 text-xs text-purple-700 font-semibold"><HiOutlineCheckCircle className="h-3.5 w-3.5" /> Uploaded</span>
                              : <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><HiOutlineExclamationCircle className="h-3.5 w-3.5" /> Missing</span>
                            }
                          </div>
                          {qrUrl && (
                            <img src={qrUrl} alt="Khalti QR" className="h-20 w-full object-contain rounded-lg border border-purple-200 bg-white" />
                          )}
                          <div className="flex gap-2">
                            <label className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-purple-300 bg-white py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors">
                              <HiOutlineUpload className="h-3.5 w-3.5" />
                              {qrUrl ? 'Replace' : 'Upload'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e, 'khaltiQr')} />
                            </label>
                            {qrUrl && (
                              <button
                                type="button"
                                onClick={() => handleQrDelete('khalti')}
                                className="flex items-center justify-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          <Input label="Khalti Number" size="sm" {...register('khaltiNumber')} />
                        </div>
                      )
                    })()}
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
