import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Input, Container, PhoneInput } from '@/components'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/services/api/auth'
import { EyeIcon, EyeSlashIcon } from '@/components/ui/icons'

export function Register() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+880')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/courses', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{7,15}$/.test(phone.trim())) {
      newErrors.phone = 'Phone number must be between 7 and 15 digits'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: `${countryCode}${phone.trim()}`,
        password,
        gender,
      })

      toast.success('Registration successful! Please verify your email.')
      navigate('/verify-otp', {
        state: { email: email.trim().toLowerCase() },
        replace: true,
      })
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(message)

      if (message.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: message }))
      }
      if (message.toLowerCase().includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: message }))
      }
    } finally {
      setIsSubmitting(false)
    }
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
                Create your EduFlow account
              </h1>
              <p className="mt-3 text-text-muted">
                Start your learning journey with EduFlow. Get access to expert-led courses, live classes, and a
                complete learning experience.
              </p>
              <div className="mt-8 hidden lg:block">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Structured Learning</p>
                      <p className="text-xs text-text-muted">Expert-led courses designed for real outcomes.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Earn Certificates</p>
                      <p className="text-xs text-text-muted">Validate your skills with recognized certificates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-text">Get started</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Fill in your details to create an account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                    required
                    autoComplete="name"
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                    autoComplete="email"
                  />

                  <PhoneInput
                    label="Phone"
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    value={phone}
                    onChange={setPhone}
                    error={errors.phone}
                    required
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
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
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
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

                  <Button type="submit" variant="primary" fullWidth size="lg" loading={isSubmitting}>
                    Create Account
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
