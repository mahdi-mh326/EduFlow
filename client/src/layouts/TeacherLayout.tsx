import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/services/api/auth'
import { toast } from 'react-hot-toast'
import { NotificationBell } from '@/components/notification'
import { ProfileDropdown } from '@/components/layout'




type TeacherPageTitle = 'Dashboard' | 'My Classes' | 'Class Details' | 'Assignments' | 'Quizzes' | 'Students' | 'Live Classes' | 'Attendance' | 'Study Materials' | 'Notices' | 'Profile'

const routeTitleMap: Record<string, TeacherPageTitle> = {
  '/teacher/dashboard': 'Dashboard',
  '/teacher/classes': 'My Classes',
  '/teacher/assignments': 'Assignments',
  '/teacher/quizzes': 'Quizzes',
  '/teacher/live-classes': 'Live Classes',
  '/teacher/attendance': 'Attendance',
  '/teacher/materials': 'Study Materials',
  '/teacher/notices': 'Notices',
  '/teacher/profile': 'Profile',
}

type IconName = 'dashboard' | 'classes' | 'assignments' | 'quizzes' | 'students' | 'live-classes' | 'attendance' | 'materials' | 'notices' | 'profile'

type SidebarLink = {
  to: string
  label: string
  icon: IconName
  disabled?: boolean
}

const sidebarLinks: SidebarLink[] = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/teacher/classes', label: 'My Classes', icon: 'classes' },
  { to: '/teacher/live-classes', label: 'Live Classes', icon: 'live-classes' },
  { to: '/teacher/assignments', label: 'Assignments', icon: 'assignments' },
  { to: '/teacher/quizzes', label: 'Quizzes', icon: 'quizzes' },
  { to: '/teacher/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/teacher/materials', label: 'Study Materials', icon: 'materials' },
  { to: '/teacher/notices', label: 'Notices', icon: 'notices' },
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
    classes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
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
    quizzes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
    'live-classes': (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
    students: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
    profile: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return <>{icons[name]}</>
}

type TeacherLayoutProps = {
  children?: ReactNode
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
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

  const pageTitle: TeacherPageTitle =

    routeTitleMap[location.pathname] || routeTitleMap[location.pathname.split('/').slice(0, 3).join('/')] || 'Dashboard'

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        id="teacher-sidebar"
        aria-label="Teacher navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[calc(100vw-0px)] transform bg-surface border-r border-border shadow-xs transition-transform duration-200 lg:static lg:max-w-none lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border lg:hidden">
          <Link to="/teacher/dashboard" className="flex items-center gap-2">
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
            <Link to="/teacher/dashboard" className="hidden lg:flex items-center gap-2.5 mb-6 px-2">
              <img src="/eduflow_logo.png" alt="EduFlow" className="h-8 w-auto max-h-8 object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-text tracking-tight">EduFlow</span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Instructor Suite</span>
              </div>
            </Link>


            <nav className="space-y-1" aria-label="Teacher">
              {sidebarLinks.map((link) => {
                const content = (
                  <span className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
                    <SidebarIcon name={link.icon} className="h-4 w-4 shrink-0" />
                    {link.label}
                    {link.disabled && (
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-text-muted">Soon</span>
                    )}
                  </span>
                )

                if (link.disabled) {
                  return (
                    <div
                      key={link.to}
                      className="flex cursor-not-allowed opacity-50"
                      title="Coming soon"
                    >
                      {content}
                    </div>
                  )
                }

                return (
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
                )
              })}
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
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-text hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden shrink-0"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                aria-controls="teacher-sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <h1 className="text-sm sm:text-base font-bold text-text truncate min-w-0">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              <NotificationBell />
              <div className="h-4 w-px bg-border hidden sm:block" />
              <ProfileDropdown
                user={user}
                profilePath="/teacher/profile"
                onLogout={handleLogout}
                theme="indigo"
              />
            </div>

          </div>
        </header>


        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
