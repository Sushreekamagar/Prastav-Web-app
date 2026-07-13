import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { verifyOtp, resendOtp } from '../../services/authService'

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const result = await verifyOtp(email, otp)
      login(result.user, result.token)
      toast.success('Email verified successfully!')
      navigate('/dashboard/preferences', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await resendOtp(email)
      toast.success('OTP resent!')
      setCountdown(60)
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
      <p className="mt-2 text-sm text-gray-500">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      <form onSubmit={handleVerify} className="mt-6 space-y-4">
        <Input
          label="OTP Code"
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          hint="Demo OTP: 123456"
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        {countdown > 0 ? (
          <span>Resend OTP in {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-prastav-700 hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-semibold text-prastav-700 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
