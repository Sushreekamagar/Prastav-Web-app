import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi'
import { toast } from 'react-toastify'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { resetPassword } from '../../services/authService'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Prefill the email query parameter if redirected from forgot-password
  const emailParam = searchParams.get('email') || ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: emailParam,
      otp: '',
      password: '',
      confirmPassword: '',
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.password,
      })
      toast.success('Password reset successfully! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
      <p className="mt-2 text-sm text-gray-500">
        Enter the OTP code sent to your email to set a new password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={HiOutlineMail}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
          })}
        />

        {/* OTP Field */}
        <Input
          label="6-Digit OTP Code"
          type="text"
          placeholder="123456"
          maxLength={6}
          error={errors.otp?.message}
          {...register('otp', {
            required: 'OTP is required',
            pattern: { value: /^\d{6}$/, message: 'OTP must be a 6-digit number' },
          })}
        />

        {/* New Password */}
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          icon={HiOutlineLockClosed}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />

        {/* Confirm Password */}
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-semibold text-prastav-700 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
