import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { HiOutlineMail } from 'react-icons/hi'
import { toast } from 'react-toastify'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { forgotPassword } from '../../services/authService'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await forgotPassword(data.email)
      toast.success('OTP sent! Check your email.')
      // Redirect to the reset page with email pre-filled so user can enter OTP + new password
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
      <p className="mt-2 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a 6-digit OTP to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={HiOutlineMail}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
          })}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
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
