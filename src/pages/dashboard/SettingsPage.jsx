import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineSwitchHorizontal,
  HiOutlineCreditCard,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle as HiCheck,
  HiOutlinePhotograph,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { changePassword, switchRole, uploadPaymentQr, updateProfile } from '../../services/authService'

/* ─── QR Upload Card ───────────────────────────────────────────────── */
function QrUploadCard({ type, label, color, currentQr, currentNumber, numberLabel, onUpload, onNumberSave }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [number, setNumber] = useState(currentNumber || '')
  const [savingNumber, setSavingNumber] = useState(false)

  // Build image URL — QR filenames are stored without host
  const imageUrl = preview
    ? preview
    : currentQr
    ? (currentQr.startsWith('http') ? currentQr : `/uploads/${currentQr}`)
    : null

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Local preview
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveNumber = async () => {
    setSavingNumber(true)
    try {
      await onNumberSave(number)
    } finally {
      setSavingNumber(false)
    }
  }

  const colors = {
    esewa: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
      btn: 'bg-green-600 hover:bg-green-700',
      icon: 'text-green-600',
      ring: 'ring-green-400',
    },
    khalti: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      badge: 'bg-purple-100 text-purple-700',
      btn: 'bg-purple-600 hover:bg-purple-700',
      icon: 'text-purple-600',
      ring: 'ring-purple-400',
    },
  }[color]

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineCreditCard className={`h-5 w-5 ${colors.icon}`} />
          <h4 className="font-bold text-gray-900">{label}</h4>
        </div>
        {imageUrl ? (
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
            <HiCheck className="h-3.5 w-3.5" />
            QR Uploaded
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700">
            <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
            QR Missing
          </span>
        )}
      </div>

      {/* QR Preview Area */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          imageUrl
            ? `border-transparent ${colors.ring} ring-2`
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={`${label} QR Code`} className="h-full w-full object-contain p-2" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <div className="flex flex-col items-center gap-2 text-white">
                <HiOutlineRefresh className="h-8 w-8" />
                <span className="text-sm font-semibold">Click to Replace</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <HiOutlinePhotograph className="h-12 w-12" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Upload {label} QR Code</p>
              <p className="text-xs text-gray-400 mt-1">Click to browse image</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <svg className="h-8 w-8 animate-spin text-prastav-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium text-prastav-700">Uploading...</span>
            </div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 ${colors.btn}`}
      >
        <HiOutlineUpload className="h-4 w-4" />
        {uploading ? 'Uploading...' : imageUrl ? `Replace ${label} QR` : `Upload ${label} QR`}
      </button>

      {/* Account Number */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-600">{numberLabel}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 98XXXXXXXX"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-prastav-500 focus:outline-none focus:ring-1 focus:ring-prastav-500"
          />
          <button
            type="button"
            onClick={handleSaveNumber}
            disabled={savingNumber || !number.trim()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-900 disabled:opacity-50"
          >
            {savingNumber ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('payment')
  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user?.role || 'buyer')

  const isSeller = user?.role === 'seller' || user?.role === 'both'

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm()

  const onPasswordSubmit = async (data) => {
    setLoading(true)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      toast.success('Password updated successfully!')
      reset()
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const onRoleSwitch = async () => {
    if (selectedRole === user?.role) {
      toast.info('You are already in this role.')
      return
    }
    setRoleLoading(true)
    try {
      const result = await switchRole(selectedRole)
      // Update user in AuthContext & localStorage
      const updatedUser = result.user || result
      updateUser({ ...user, role: updatedUser.role || selectedRole })
      toast.success(
        `You are now a ${selectedRole === 'buyer' ? 'Buyer 🛒' : 'Seller 📚'}! Your dashboard has been updated.`,
        { autoClose: 3000 }
      )
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to switch role')
      setSelectedRole(user?.role || 'buyer')
    } finally {
      setRoleLoading(false)
    }
  }

  const tabs = [
    ...(isSeller ? [{ id: 'payment', label: '💳 Payment Info' }] : []),
    { id: 'role', label: 'Role' },
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
  ]

  const handleQrUpload = async (file, type) => {
    const formData = new FormData()
    const fieldKey = type === 'esewa' ? 'esewaQr' : 'khaltiQr'
    formData.append(fieldKey, file)
    try {
      const updated = await uploadPaymentQr(formData)
      updateUser(updated)
      toast.success(`${type === 'esewa' ? 'eSewa' : 'Khalti'} QR uploaded successfully! ✅`)
    } catch (err) {
      toast.error(err.message || 'Failed to upload QR')
      throw err
    }
  }

  const handleNumberSave = async (field, value) => {
    try {
      const updated = await updateProfile({ [field]: value })
      updateUser(updated)
      toast.success('Account number saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
  }

  const roles = [
    {
      id: 'buyer',
      label: 'Buyer',
      icon: HiOutlineShoppingBag,
      description: 'Browse and request books from sellers near you.',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-400',
      ring: 'ring-blue-400',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-100',
    },
    {
      id: 'seller',
      label: 'Seller',
      icon: HiOutlineTag,
      description: 'List your books and sell them to students nearby.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-400',
      ring: 'ring-emerald-400',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-100',
    },
    {
      id: 'both',
      label: 'Both',
      icon: HiOutlineSwitchHorizontal,
      description: 'Toggle between buyer & seller views dynamically.',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      border: 'border-purple-400',
      ring: 'ring-purple-400',
      textColor: 'text-purple-700',
      badgeBg: 'bg-purple-100',
    },
  ]

  const currentRole = user?.role || 'buyer'
  const isRoleChanged = selectedRole !== currentRole

  return (
    <DashboardPage title="Settings" subtitle="Manage your account preferences">
      <PageTransition>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* ──────── PAYMENT INFO TAB ──────── */}
        {activeTab === 'payment' && isSeller && (
          <div className="mt-6 max-w-3xl space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineCreditCard className="h-5 w-5 text-prastav-600" />
                  Payment QR Codes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your eSewa and Khalti QR codes so buyers can pay you for Home Delivery orders.
                  These QR codes will be shown to the buyer after you accept their request.
                </p>
              </div>

              {/* Warning if any QR missing */}
              {(!user?.esewaQR && !user?.khaltiQR) && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <HiOutlineExclamationCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">No QR Codes Uploaded</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Buyers won't be able to pay you for Home Delivery orders until you upload at least one payment QR code.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <QrUploadCard
                  type="esewa"
                  label="eSewa"
                  color="esewa"
                  currentQr={user?.esewaQR}
                  currentNumber={user?.esewaNumber}
                  numberLabel="eSewa Registered Number"
                  onUpload={(file) => handleQrUpload(file, 'esewa')}
                  onNumberSave={(val) => handleNumberSave('esewaNumber', val)}
                />
                <QrUploadCard
                  type="khalti"
                  label="Khalti"
                  color="khalti"
                  currentQr={user?.khaltiQR}
                  currentNumber={user?.khaltiNumber}
                  numberLabel="Khalti Registered Number"
                  onUpload={(file) => handleQrUpload(file, 'khalti')}
                  onNumberSave={(val) => handleNumberSave('khaltiNumber', val)}
                />
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-700 mb-2">📋 How it works</p>
                <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
                  <li>Upload your eSewa or Khalti QR code image (screenshot from your app)</li>
                  <li>Buyer selects Home Delivery and chooses eSewa or Khalti payment</li>
                  <li>After you accept the request, buyer sees your QR code and makes payment</li>
                  <li>Buyer uploads payment screenshot as proof</li>
                  <li>You verify the payment and the book is dispatched</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className={`mt-6 max-w-2xl rounded-2xl bg-white p-6 shadow-md ${
          activeTab === 'payment' ? 'hidden' : ''
        }`}>

          {/* ──────── ROLE TAB ──────── */}
          {activeTab === 'role' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Switch Your Role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose how you want to use Prastav. You can switch anytime from here.
                </p>
              </div>

              {/* Current Role Badge */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">Current role:</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    currentRole === 'seller'
                      ? 'bg-emerald-100 text-emerald-700'
                      : currentRole === 'both'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {currentRole === 'seller' ? (
                    <HiOutlineTag className="h-3.5 w-3.5" />
                  ) : currentRole === 'both' ? (
                    <HiOutlineSwitchHorizontal className="h-3.5 w-3.5" />
                  ) : (
                    <HiOutlineShoppingBag className="h-3.5 w-3.5" />
                  )}
                  {currentRole === 'both' ? 'Both' : currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                </span>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {roles.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.id
                  const isCurrent = currentRole === role.id

                  return (
                    <button
                      key={role.id}
                      id={`role-card-${role.id}`}
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 focus:outline-none ${
                        isSelected
                          ? `${role.border} ${role.bgLight} ring-2 ${role.ring} ring-offset-2`
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Selected check */}
                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                          <HiOutlineCheckCircle className={`h-4 w-4 ${role.textColor}`} />
                        </span>
                      )}

                      {/* Current badge */}
                      {isCurrent && (
                        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role.badgeBg} ${role.textColor}`}>
                          Current
                        </span>
                      )}

                      {/* Icon */}
                      <div className={`mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} text-white shadow-sm`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Text */}
                      <div>
                        <p className="font-semibold text-gray-900">{role.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{role.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Switch Button */}
              {isRoleChanged ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-medium">Heads up:</span> Switching to{' '}
                  <strong>{selectedRole}</strong> will update your dashboard immediately.
                </div>
              ) : null}

              <button
                id="btn-switch-role"
                onClick={onRoleSwitch}
                disabled={roleLoading || !isRoleChanged}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isRoleChanged
                    ? 'bg-gradient-to-r from-prastav-600 to-prastav-700 text-white shadow-md hover:from-prastav-700 hover:to-prastav-800 hover:shadow-lg focus:ring-prastav-500'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                }`}
              >
                {roleLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Switching...
                  </>
                ) : (
                  <>
                    <HiOutlineSwitchHorizontal className="h-4 w-4" />
                    {isRoleChanged
                      ? `Switch to ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                      : 'Select a different role to switch'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ──────── PASSWORD TAB ──────── */}
          {activeTab === 'password' && (
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <Input
                label="Current Password"
                type="password"
                error={errors.currentPassword?.message}
                {...register('currentPassword', { required: 'Required' })}
              />
              <Input
                label="New Password"
                type="password"
                error={errors.newPassword?.message}
                {...register('newPassword', {
                  required: 'Required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              <Input
                label="Confirm Password"
                type="password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Required',
                  validate: (val) => val === watch('newPassword') || 'Passwords do not match',
                })}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}

          {/* ──────── NOTIFICATIONS TAB ──────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              {['Request updates', 'Payment alerts', 'Chat messages', 'Recommendations'].map((item) => (
                <label key={item} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <span className="text-sm text-gray-700">{item}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-prastav-700" />
                </label>
              ))}
            </div>
          )}

          {/* ──────── PRIVACY TAB ──────── */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Privacy</h3>
              <label className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm text-gray-700">Show location to nearby buyers</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-prastav-700" />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm text-gray-700">Show reputation publicly</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-prastav-700" />
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" to="/dashboard/preferences">
            Update Preferences
          </Button>
          <Button variant="outline" onClick={logout} className="!text-red-600 !border-red-200">
            Logout
          </Button>
        </div>
      </PageTransition>
    </DashboardPage>
  )
}
