import { Link, Outlet } from 'react-router-dom'
import { Navbar, Footer, LoginDropdown, ProfileDropdown } from '@/components/layout'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'react-hot-toast'
import { authApi } from '@/services/api/auth'
import { ChatbotButton } from '@/components/chatbot'

const publicLinks = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Verify Certificate', href: '/verify-certificate' },
]


const roleDashboardMap: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

const roleProfileMap: Record<string, string> = {
  student: '/student/profile',
  teacher: '/teacher/profile',
  admin: '/admin/profile',
}


export function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout API errors
    } finally {
      logout()
      toast.success('Logged out successfully')
    }
  }

  const authArea = isAuthenticated && user ? (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
      <Link
        to={roleDashboardMap[user.role] || '/courses'}
        className="rounded-xl bg-primary/10 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors text-center"
      >
        Go to Dashboard →
      </Link>
      <div className="h-4 w-px bg-border hidden sm:block" />
      <ProfileDropdown
        user={user}
        profilePath={roleProfileMap[user.role] || '/student/profile'}
        onLogout={handleLogout}
        theme="primary"
      />
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
      <LoginDropdown />
      <Link
        to="/register"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 sm:py-2 text-xs font-semibold text-white hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all text-center w-full sm:w-auto"
      >
        Get Started
      </Link>
    </div>
  )



  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        brand={
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/eduflow_logo.png" alt="EduFlow" className="h-8 w-auto max-h-8 object-contain" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-text tracking-tight group-hover:text-primary transition-colors">
                EduFlow
              </span>
              <span className="text-[10px] font-medium text-text-muted leading-tight">
                Modern Learning
              </span>
            </div>
          </Link>
        }
        links={publicLinks}
        authArea={authArea}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer
        brand={
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-text group">
            <img src="/eduflow_logo.png" alt="EduFlow" className="h-8 w-auto max-h-8 object-contain" />
            <span className="group-hover:text-primary transition-colors">EduFlow</span>
          </Link>
        }
        description="Empowering learners, instructors, and educational institutions with next-generation smart learning management tools."
      />
      <ChatbotButton />
    </div>
  )
}

