import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Input, Container } from '@/components'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth.store'


export function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const emailFromState = location.state?.email || ''

  const [email, setEmail] = useState(emailFromState)
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!emailFromState) {
      navigate('/register', { replace: true })
    }
  }, [emailFromState, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!otp.trim()) {
      newErrors.otp = 'OTP is required'
    } else if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = 'OTP must be 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await authApi.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })

      if (result.accessToken && result.user) {
        useAuthStore.getState().setAuth({
          user: result.user,
          accessToken: result.accessToken,
        })
      }


      if (result.mustChangePassword || result.user?.mustChangePassword || location.state?.role === 'teacher' || location.state?.role === 'admin') {
        toast.success('Email verified! Please set your new password.')
        navigate('/set-password', { replace: true })
      } else {
        toast.success('Email verified successfully! You can now log in.')
        navigate('/login', { replace: true, state: { email: email.trim().toLowerCase() } })
      }

    } catch (error: any) {

      const message = error?.response?.data?.message || 'Verification failed. Please try again.'
      toast.error(message)

      if (message.toLowerCase().includes('otp')) {
        setErrors((prev) => ({ ...prev, otp: message }))
      }
      if (message.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: message }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return

    setIsResending(true)
    try {
      await authApi.resendOTP({
        email: email.trim().toLowerCase(),
      })
      toast.success('OTP sent successfully!')
      setCooldown(60)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to resend OTP. Please try again.'
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  if (!emailFromState) {
    return null
  }

  return (
    <section className="min-h-screen bg-background">
      <Container>
        <div className="mx-auto max-w-6xl py-10 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img src="/eduflow_logo.png" alt="EduFlow" className="h-9 w-auto max-h-9 object-contain" />
                <span className="text-xl font-extrabold text-text tracking-tight group-hover:text-primary transition-colors">
                  EduFlow
                </span>
              </Link>


              <h1 className="mt-6 text-3xl font-bold text-text sm:text-4xl">
                Verify your email
              </h1>
              <p className="mt-3 text-text-muted">
                We sent a 6-digit verification code to your email address. Please enter it below to verify
                your account.
              </p>
              <div className="mt-8 hidden lg:block">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                      <svg className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Secure Verification</p>
                      <p className="text-xs text-text-muted">Your email helps us keep your account safe.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-text">Enter OTP</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Check your email inbox for the 6-digit code.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                  />

                  <Input
                    label="OTP"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    error={errors.otp}
                    required
                    autoComplete="one-time-code"
                  />

                  <Button type="submit" variant="primary" fullWidth size="lg" loading={isSubmitting}>
                    Verify Email
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="text-center text-sm text-text-muted">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={cooldown > 0 || isResending}
                      className="font-medium text-primary hover:text-primary/80 disabled:pointer-events-none disabled:text-gray-400"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <p className="text-center text-sm text-text-muted">
                    Wrong email or need to go back?{' '}
                    <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                      Register again
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
