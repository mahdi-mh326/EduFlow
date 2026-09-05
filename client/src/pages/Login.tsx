import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Input, Container } from '@/components'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/services/api/auth'
import { EyeIcon, EyeSlashIcon, GraduationCapIcon, UsersIcon, ShieldIcon } from '@/components/ui/icons'

type LoginRole = 'student' | 'teacher' | 'admin'

const roleDetails: Record<
  LoginRole,
  {
    title: string
    badge: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    themeColor: string
    activeTabClass: string
  }
> = {
  student: {
    title: 'Student Portal',
    badge: 'Student Login',
    description: 'Access your enrolled courses, live classrooms, quizzes & track progress.',
    icon: GraduationCapIcon,
    themeColor: 'text-primary',
    activeTabClass: 'bg-primary text-white shadow-sm shadow-primary/30',
  },
  teacher: {
    title: 'Instructor Portal',
    badge: 'Teacher Login',
    description: 'Manage your classes, assignments, live streaming, and evaluate submissions.',
    icon: UsersIcon,
    themeColor: 'text-indigo-600',
    activeTabClass: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30',
  },
  admin: {
    title: 'Administrator Portal',
    badge: 'Admin Login',
    description: 'Institutional management, user control, revenue analytics, and system oversight.',
    icon: ShieldIcon,
    themeColor: 'text-slate-900',
    activeTabClass: 'bg-slate-900 text-white shadow-sm shadow-slate-900/30',
  },
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setUser, setAccessToken, isAuthenticated, user } = useAuthStore()

  const initialRoleParam = searchParams.get('role')
  const initialRole: LoginRole =
    initialRoleParam === 'teacher'
      ? 'teacher'
      : initialRoleParam === 'admin'
      ? 'admin'
      : 'student'

  const [selectedRole, setSelectedRole] = useState<LoginRole>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const from = (location.state as any)?.from?.pathname || '/courses'
  const emailFromState = (location.state as any)?.email || ''

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'teacher') setSelectedRole('teacher')
    else if (roleParam === 'admin') setSelectedRole('admin')
    else if (roleParam === 'student') setSelectedRole('student')
  }, [searchParams])

  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role)
    setSearchParams({ role })
    setErrors({})
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleDashboardMap: Record<string, string> = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        admin: '/admin/dashboard',
      }
      const defaultPath = roleDashboardMap[user.role] || from
      navigate(defaultPath, { replace: true })
    }
  }, [isAuthenticated, navigate, from, user?.role])


  useEffect(() => {
    if (emailFromState) {
      setEmail(emailFromState)
    }
  }, [emailFromState])

  if (isAuthenticated) {
    return null
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
      })


      if (result.requireEmailVerification) {
        navigate('/verify-otp', {
          replace: true,
          state: {
            email: email.trim().toLowerCase(),
            role: result.user?.role || selectedRole,
          },
        })
        return
      }


      setUser(result.user)
      setAccessToken(result.accessToken)

      const roleGreeting =
        result.user.role === 'teacher'
          ? 'Instructor'
          : result.user.role === 'admin'
          ? 'Administrator'
          : 'Student'


      toast.success(`Welcome back, ${result.user.fullName}! (${roleGreeting})`)

      if (result.forcePasswordChange) {
        navigate('/set-password', { replace: true })
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please check your credentials.'
      toast.error(message)

      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('invalid')) {
        setErrors((prev) => ({ ...prev, email: message }))
      }
      if (message.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: message }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentRoleInfo = roleDetails[selectedRole]

  return (
    <section className="min-h-screen bg-background py-10 lg:py-16">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left Column info */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img src="/eduflow_logo.png" alt="EduFlow" className="h-9 w-auto max-h-9 object-contain" />
                <span className="text-xl font-extrabold text-text tracking-tight group-hover:text-primary transition-colors">
                  EduFlow
                </span>
              </Link>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                Select your account type to sign in and seamlessly continue your educational journey.
              </p>

              <div className="mt-8 space-y-3 hidden lg:block">
                <div
                  onClick={() => handleRoleChange('student')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedRole === 'student'
                      ? 'border-primary/40 bg-blue-50/60 shadow-xs'
                      : 'border-border bg-surface hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                      <GraduationCapIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text">Student Portal</p>
                      <p className="text-[11px] text-text-muted">Join live classrooms & courses</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleChange('teacher')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedRole === 'teacher'
                      ? 'border-indigo-400/40 bg-indigo-50/60 shadow-xs'
                      : 'border-border bg-surface hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <UsersIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text">Instructor Portal</p>
                      <p className="text-[11px] text-text-muted">Teach live & grade assignments</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleChange('admin')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedRole === 'admin'
                      ? 'border-slate-400/40 bg-slate-100/80 shadow-xs'
                      : 'border-border bg-surface hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <ShieldIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text">Admin Portal</p>
                      <p className="text-[11px] text-text-muted">Manage system & analytics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Login Form Card */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                {/* Role Switcher Tabs */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                    Select Account Type
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                    {(['student', 'teacher', 'admin'] as LoginRole[]).map((role) => {
                      const details = roleDetails[role]
                      const isSelected = selectedRole === role
                      const TabIcon = details.icon
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleChange(role)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? details.activeTabClass
                              : 'text-text-muted hover:text-text hover:bg-white/60'
                          }`}
                        >
                          <TabIcon className="h-4 w-4" />
                          <span className="capitalize">{role}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Role Context Pill */}
                <div className="mb-6 rounded-xl bg-slate-50 border border-border/80 p-3.5 flex items-start gap-3">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                    <currentRoleInfo.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-text">{currentRoleInfo.title}</h2>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {currentRoleInfo.description}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                    autoComplete="email"
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-9 text-text-muted hover:text-text"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  <Button type="submit" variant="primary" fullWidth size="lg" loading={isSubmitting}>
                    Sign In to {currentRoleInfo.title}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-text-muted">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-bold text-primary hover:underline">
                    Create a Student Account
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

