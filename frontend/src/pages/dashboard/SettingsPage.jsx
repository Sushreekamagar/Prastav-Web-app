import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../services/authService'

export default function SettingsPage() {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('password')
  const [loading, setLoading] = useState(false)

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

  const tabs = [
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
  ]

  return (
    <DashboardPage title="Settings" subtitle="Manage your account preferences">
      <PageTransition>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6 max-w-xl rounded-2xl bg-white p-6 shadow-md">
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
