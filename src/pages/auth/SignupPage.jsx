import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLockClosed,
} from 'react-icons/hi'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { registerUser, verifyOtp, resendOtp } from '../../services/authService'

/* ── tiny helpers ───────────────────────────────────── */
function Field({ label, error, icon: Icon, children }) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (hasIcon = false, hasError = false) =>
  `w-full rounded-xl border bg-white py-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-prastav-500 focus:outline-none focus:ring-2 focus:ring-prastav-500/20 ${
    hasIcon ? 'pl-9 pr-4' : 'px-4'
  } ${hasError ? 'border-red-400' : 'border-gray-200'}`

/* ── 6-box OTP input ────────────────────────────────── */
function OtpBoxes({ value, onChange }) {
  const refs = useRef([])
  const digits = value.split('')

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace') {
      const next = digits.slice()
      if (next[idx]) {
        next[idx] = ''
      } else if (idx > 0) {
        next[idx - 1] = ''
        refs.current[idx - 1]?.focus()
      }
      onChange(next.join(''))
      return
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    const next = digits.slice()
    next[idx] = char
    onChange(next.join(''))
    if (char && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    refs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`h-11 w-full rounded-xl border text-center text-base font-bold transition-all focus:outline-none focus:ring-2 focus:ring-prastav-500/30 ${
            digits[i]
              ? 'border-prastav-600 bg-prastav-50 text-prastav-800'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
        />
      ))}
    </div>
  )
}

/* ── left branding panel ────────────────────────────── */
function BrandPanel() {
  return (
    <div className="hidden flex-col items-center justify-center bg-gradient-to-br from-prastav-600 to-prastav-900 p-12 lg:flex">
      {/* Book illustration */}
      <div className="flex h-44 w-44 items-center justify-center rounded-3xl bg-white/10 shadow-2xl backdrop-blur-sm">
        <svg viewBox="0 0 120 120" className="h-28 w-28" fill="none">
          {/* Open book */}
          <rect x="10" y="30" width="46" height="60" rx="4" fill="#14532d" opacity="0.9"/>
          <rect x="64" y="30" width="46" height="60" rx="4" fill="#22c55e"/>
          <rect x="54" y="26" width="12" height="68" rx="3" fill="#166534"/>
          {/* Pages lines left */}
          <line x1="20" y1="48" x2="48" y2="48" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="56" x2="48" y2="56" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="64" x2="40" y2="64" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="72" x2="48" y2="72" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
          {/* Pages lines right */}
          <line x1="72" y1="48" x2="100" y2="48" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
          <line x1="72" y1="56" x2="100" y2="56" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
          <line x1="72" y1="64" x2="90" y2="64" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
          <line x1="72" y1="72" x2="100" y2="72" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
          {/* Star decoration */}
          <circle cx="95" cy="25" r="6" fill="#fbbf24" opacity="0.9"/>
          <circle cx="18" cy="22" r="4" fill="#86efac" opacity="0.7"/>
          <circle cx="105" cy="95" r="5" fill="#a7f3d0" opacity="0.6"/>
        </svg>
      </div>

      <div className="mt-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-white">📗 Prastav</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Sustainable Knowledge Sharing</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-prastav-200">
          Join our ever-growing community of readers. Give your books a second life and discover affordable wisdom from neighbors.
        </p>
      </div>

      {/* Stats pills */}
      <div className="mt-10 flex gap-4">
        {[
          { label: 'Books Listed', val: '12,400+' },
          { label: 'Students', val: '8,200+' },
          { label: 'Saved', val: 'NPR 4M+' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-base font-bold text-white">{s.val}</p>
            <p className="text-[10px] text-prastav-200">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  /* form state */
  const { register, handleSubmit, watch, trigger, getValues, formState: { errors } } = useForm()

  /* OTP state */
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState(null)

  const emailValue = watch('email', '')

  /* handle main submit button */
  const onSubmit = async (data) => {
    if (!otpSent) {
      // Step 1: Send OTP
      setSendingOtp(true)
      try {
        const res = await registerUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'buyer',
          grade: 'grade_9',
          district: 'Kathmandu'
        })
        toast.success('OTP sent to your email!')
        setUserId(res.userId)
        setOtpSent(true)
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to send OTP')
      } finally {
        setSendingOtp(false)
      }
    } else {
      // Step 2: Verify OTP
      if (otp.length !== 6) {
        toast.error('Enter the 6-digit OTP')
        return
      }
      if (!agreed) {
        toast.error('Please agree to the Terms of Service')
        return
      }

      setSubmitting(true)
      try {
        const result = await verifyOtp(userId, otp)
        login(result.user, result.token)
        toast.success('Account created! Let\'s set your preferences 🎉')
        navigate('/dashboard/preferences', { replace: true })
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <BrandPanel />

      {/* Right form panel */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50">
        <div className="flex flex-1 items-start justify-center px-6 py-10 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <svg viewBox="0 0 64 64" className="h-8 w-8" fill="none">
                <path d="M16 20h14v28H16c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="#166534" opacity="0.9"/>
                <path d="M34 20h14c2 0 3 1 3 3v22c0 2-1 3-3 3H34V20z" fill="#22c55e"/>
              </svg>
              <span className="text-xl font-bold text-prastav-800">Prastav</span>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-xl">
              {/* Heading */}
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="mt-1 text-sm text-gray-500">
                Start your journey with affordable academic books.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                {/* Full Name */}
                <Field label="Full Name" error={errors.name?.message} icon={HiOutlineUser}>
                  <input
                    type="text"
                    placeholder="Sagar Thapa"
                    className={inputCls(true, !!errors.name)}
                    {...register('name', { required: 'Name is required' })}
                  />
                </Field>

                {/* Email */}
                <Field label="Email Address" error={errors.email?.message} icon={HiOutlineMail}>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    disabled={otpSent}
                    className={`${inputCls(true, !!errors.email)} flex-1 ${otpSent ? 'bg-gray-100 text-gray-500' : ''}`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                    })}
                  />
                </Field>

                {/* OTP verification (Only shows after sending OTP) */}
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Enter OTP Code
                      <span className="ml-2 text-xs text-prastav-600 font-semibold">(Sent to your email)</span>
                    </label>
                    <OtpBoxes value={otp} onChange={setOtp} />
                  </motion.div>
                )}

                {/* Phone */}
                <Field label="Phone Number" error={errors.phone?.message} icon={HiOutlinePhone}>
                  <input
                    type="tel"
                    placeholder="+977 98XXXXXXXX"
                    className={inputCls(true, !!errors.phone)}
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: { value: /^9\d{9}$/, message: 'Enter a valid 10-digit number' },
                    })}
                  />
                </Field>

                {/* Password */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Password" error={errors.password?.message} icon={HiOutlineLockClosed}>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={inputCls(true, !!errors.password)}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'At least 6 characters' },
                        validate: {
                          hasUppercase: (val) => /[A-Z]/.test(val) || 'Must contain at least one uppercase letter',
                          hasLowercase: (val) => /[a-z]/.test(val) || 'Must contain at least one lowercase letter',
                          hasNumber: (val) => /\d/.test(val) || 'Must contain at least one number',
                          hasSpecial: (val) => /[^a-zA-Z\d\s]/.test(val) || 'Must contain at least one special character/symbol',
                        }
                      })}
                    />
                  </Field>

                  {/* Password hint */}
                  {watch('password') && (
                    <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-lg bg-gray-50 px-3 py-2 text-[11px]">
                      {[
                        { label: 'Uppercase letter (A–Z)', ok: /[A-Z]/.test(watch('password')) },
                        { label: 'Lowercase letter (a–z)', ok: /[a-z]/.test(watch('password')) },
                        { label: 'Number (0–9)',           ok: /\d/.test(watch('password')) },
                        { label: 'Special character (!@#…)',ok: /[^a-zA-Z\d\s]/.test(watch('password')) },
                      ].map(({ label, ok }) => (
                        <span key={label} className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{ok ? '✓' : '○'}</span> {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <Field label="Confirm Password" error={errors.confirmPassword?.message} icon={HiOutlineLockClosed}>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={inputCls(true, !!errors.confirmPassword)}
                      {...register('confirmPassword', {
                        required: 'Required',
                        validate: (v) =>
                          v === watch('password') || 'Passwords do not match',
                      })}
                    />
                  </Field>
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-prastav-700"
                  />
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-prastav-700 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-prastav-700 hover:underline">
                    Privacy Policy
                  </Link>
                </label>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={submitting || sendingOtp}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-2xl bg-prastav-800 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-prastav-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting || sendingOtp
                    ? 'Processing…'
                    : otpSent
                    ? 'Verify & Create Account →'
                    : 'Send OTP'}
                </motion.button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-prastav-700 hover:underline">
                  Login here
                </Link>
              </p>
            </div>

            {/* Footer links */}
            <div className="mt-6 flex justify-center gap-5 text-xs text-gray-400">
              <Link to="/help" className="hover:text-gray-600">Help center</Link>
              <Link to="/privacy" className="hover:text-gray-600">Safety tips</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
