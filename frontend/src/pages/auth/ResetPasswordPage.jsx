import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { HiOutlineLockClosed } from 'react-icons/hi'
import { toast } from 'react-toastify'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { resetPassword } from '../../services/authService'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing reset token')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, data.password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
      <p className="mt-2 text-sm text-gray-500">Enter your new password below.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          icon={HiOutlineLockClosed}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'At least 6 characters' },
          })}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={HiOutlineLockClosed}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (val) => val === watch('password') || 'Passwords do not match',
          })}
        />

        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      {!token && (
        <p className="mt-4 text-center text-sm text-red-600">
          Missing reset token. Please use the link from your email.
        </p>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-semibold text-prastav-700 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
