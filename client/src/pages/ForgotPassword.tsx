import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Container, Button, Input } from '@/components'
import { authApi } from '@/services/api/auth'
import { EyeIcon, EyeSlashIcon } from '@/components/ui/icons'

export function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [errors, setErrors] = useState<{
    email?: string
    otp?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setErrors({ email: 'Email address is required' })
      return
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.forgotPassword(trimmedEmail)
      toast.success('Password reset code sent to your email!')
      setStep(2)
      setCountdown(60)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to send reset code. Please try again.'
      toast.error(message)
      setErrors({ email: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return
    setIsResending(true)
    try {
      await authApi.forgotPassword(email.trim().toLowerCase())
      toast.success('A new reset code has been sent!')
      setCountdown(60)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to resend code.'
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: typeof errors = {}

    if (!otp.trim()) {
      newErrors.otp = 'Verification code is required'
    } else if (otp.trim().length !== 6) {
      newErrors.otp = 'Verification code must be 6 digits'
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      })

      toast.success('Password reset successful! You can now log in.')
      navigate('/login', { replace: true })
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to reset password. Please verify the code and try again.'
      toast.error(message)
      if (message.toLowerCase().includes('otp') || message.toLowerCase().includes('code')) {
        setErrors({ otp: message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-background flex flex-col justify-center">
      <Container>
        <div className="mx-auto max-w-md py-12">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 text-2xl font-bold text-primary group justify-center">
              <img src="/eduflow_logo.png" alt="EduFlow" className="h-9 w-auto max-h-9 object-contain" />
              <span className="text-xl font-extrabold text-text tracking-tight group-hover:text-primary transition-colors">
                EduFlow
              </span>
            </Link>

            <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">
              {step === 1 ? 'Reset Your Password' : 'Set New Password'}
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              {step === 1
                ? 'Enter your registered email address and we will send you a 6-digit code to reset your account password.'
                : `Enter the 6-digit code sent to ${email} along with your new password.`}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            {step === 1 ? (
              /* Step 1: Email Form */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                  autoFocus
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                >
                  Send Reset Code
                </Button>
              </form>
            ) : (
              /* Step 2: OTP & New Password Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Target Email: <strong>{email}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Change Email
                  </button>
                </div>

                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  error={errors.otp}
                  required
                  autoFocus
                />

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={errors.newPassword}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-text"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-text"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isResending}
                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                >
                  Reset Password
                </Button>
              </form>
            )}

            <div className="mt-6 border-t border-border pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
