import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'
import { toast } from 'react-toastify'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { loginUser } from '../../services/authService'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await loginUser(data)
      login(result.user, result.token)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mt-2 text-sm text-gray-500">Sign in to your Prastav account</p>

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
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={HiOutlineLockClosed}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-prastav-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-prastav-700 hover:underline">
          Create Account
        </Link>
      </p>

      <div className="mt-4 rounded-xl bg-prastav-50 px-4 py-3 text-center text-xs text-prastav-700">
        Demo: demo@prastav.com / demo123
      </div>
    </div>
  )
}
