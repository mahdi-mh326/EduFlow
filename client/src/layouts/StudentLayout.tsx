import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/services/api/auth'
import { toast } from 'react-hot-toast'
import { NotificationBell } from '@/components/notification'
import { ChatbotButton } from '@/components/chatbot'
import { ProfileDropdown } from '@/components/layout'




type StudentPageTitle = 'Dashboard' | 'Home' | 'Assignments' | 'Study Materials' | 'Notices' | 'My Enrollments' | 'Notifications' | 'Courses' | 'Classes' | 'Quizzes' | 'Live Classes' | 'Attendance' | 'AI Assistant' | 'Profile'

const routeTitleMap: Record<string, StudentPageTitle> = {
  '/': 'Home',
  '/student/dashboard': 'Dashboard',
  '/student/assignments': 'Assignments',
  '/student/materials': 'Study Materials',
  '/student/notices': 'Notices',
  '/student/quizzes': 'Quizzes',
  '/student/enrollments': 'My Enrollments',
  '/student/notifications': 'Notifications',
  '/courses': 'Courses',
  '/student/classes': 'Classes',
  '/student/attendance': 'Attendance',
  '/student/chatbot': 'AI Assistant',
  '/student/profile': 'Profile',
}

type IconName = 'dashboard' | 'home' | 'courses' | 'classes' | 'enrollments' | 'notifications' | 'assignments' | 'materials' | 'notices' | 'quizzes' | 'live-classes' | 'attendance' | 'chatbot' | 'profile'

type SidebarLink = {
  to: string
  label: string
  icon: IconName
}

const sidebarLinks: SidebarLink[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/student/classes', label: 'Live Classes', icon: 'live-classes' },
  { to: '/student/materials', label: 'Materials', icon: 'materials' },
  { to: '/student/notices', label: 'Notices', icon: 'notices' },
  { to: '/student/assignments', label: 'Assignments', icon: 'assignments' },
  { to: '/student/quizzes', label: 'Quizzes', icon: 'quizzes' },
  { to: '/student/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/student/chatbot', label: 'AI Assistant', icon: 'chatbot' },
  { to: '/student/enrollments', label: 'My Enrollments', icon: 'enrollments' },
  { to: '/student/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/courses', label: 'Course Catalog', icon: 'courses' },
]



function SidebarIcon({ name, className }: { name: IconName; className?: string }) {
  const icons: Record<IconName, ReactNode> = {
    dashboard: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    home: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    courses: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    classes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    enrollments: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    notifications: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
    assignments: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
    materials: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
    notices: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
    quizzes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
    'live-classes': (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
    attendance: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    chatbot: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    ),
    profile: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return <>{icons[name]}</>
}

type StudentLayoutProps = {
  children?: ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      logout()
      toast.success('Logged out successfully')
    }
  }

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [sidebarOpen])

  const pageTitle: StudentPageTitle =

    routeTitleMap[location.pathname] || routeTitleMap[location.pathname.split('/').slice(0, 3).join('/')] || 'Dashboard'

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        id="student-sidebar"
        aria-label="Student navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[calc(100vw-0px)] transform bg-surface border-r border-border shadow-xs transition-transform duration-200 lg:static lg:max-w-none lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border lg:hidden">
          <Link to="/student/dashboard" className="flex items-center gap-2">
            <img src="/eduflow_logo.png" alt="EduFlow" className="h-7 w-auto max-h-7 object-contain" />
            <span className="text-base font-bold text-text">EduFlow</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-text-muted hover:bg-slate-100 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-4rem)] lg:h-full">
          <div className="px-4 py-5 overflow-y-auto">
            <Link to="/student/dashboard" className="hidden lg:flex items-center gap-2.5 mb-6 px-2">
              <img src="/eduflow_logo.png" alt="EduFlow" className="h-8 w-auto max-h-8 object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-text tracking-tight">EduFlow</span>
                <span className="text-[10px] font-medium text-text-muted">Student Portal</span>
              </div>
            </Link>


            <nav className="space-y-1" aria-label="Student">
              {sidebarLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-xs'
                        : 'text-text-muted hover:bg-slate-100 hover:text-text'
                    }`
                  }
                >
                  <SidebarIcon name={link.icon} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </aside>



      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md shadow-xs">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-text hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                aria-controls="student-sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <h1 className="text-base font-bold text-text">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="h-4 w-px bg-border hidden sm:block" />
              <ProfileDropdown
                user={user}
                profilePath="/student/profile"
                onLogout={handleLogout}
                theme="primary"
              />
            </div>

          </div>
        </header>


        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {location.pathname !== '/student/chatbot' && <ChatbotButton />}
    </div>
  )
}
