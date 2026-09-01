import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/services/api/auth'
import { toast } from 'react-hot-toast'
import { NotificationBell } from '@/components/notification'
import { ProfileDropdown } from '@/components/layout'



type AdminPageTitle = 'Dashboard' | 'Courses' | 'Classes' | 'Teachers' | 'Live Sessions' | 'Attendance' | 'Notices' | 'Enrollments' | 'Payments' | 'Certificates' | 'Admins' | 'Students' | 'Profile'


const routeTitleMap: Record<string, AdminPageTitle> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/courses': 'Courses',
  '/admin/classes': 'Classes',
  '/admin/teachers': 'Teachers',
  '/admin/live-sessions': 'Live Sessions',
  '/admin/attendance': 'Attendance',
  '/admin/notices': 'Notices',
  '/admin/enrollments': 'Enrollments',
  '/admin/payments': 'Payments',
  '/admin/certificates': 'Certificates',
  '/admin/admins': 'Admins',
  '/admin/students': 'Students',
  '/admin/profile': 'Profile',
}

type IconName = 'home' | 'dashboard' | 'courses' | 'classes' | 'teachers' | 'live-classes' | 'attendance' | 'materials' | 'notices' | 'enrollments' | 'payments' | 'certificates' | 'admins' | 'profile'

type SidebarLink = {
  to: string
  label: string
  icon: IconName
  disabled?: boolean
}

function SidebarIcon({ name, className }: { name: IconName; className?: string }) {
  const icons: Record<IconName, ReactNode> = {
    home: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    dashboard: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
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
    teachers: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    'live-classes': (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
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
    enrollments: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    payments: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" x2="23" y1="10" y2="10" />
      </svg>
    ),
    certificates: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    admins: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

type AdminLayoutProps = {
  children?: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const sidebarLinks: SidebarLink[] = [
    { to: '/', label: 'Home (Public)', icon: 'home' },
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/courses', label: 'Course Catalog', icon: 'courses' },
    { to: '/admin/courses', label: 'Manage Courses', icon: 'courses' },
    { to: '/admin/classes', label: 'Classes', icon: 'classes' },
    { to: '/admin/teachers', label: 'Teachers', icon: 'teachers' },
    { to: '/admin/live-sessions', label: 'Live Sessions', icon: 'live-classes' },
    { to: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
    { to: '/admin/notices', label: 'Notices', icon: 'notices' },
    { to: '/admin/enrollments', label: 'Enrollments', icon: 'enrollments' },
    { to: '/admin/payments', label: 'Payments', icon: 'payments' },
    { to: '/admin/certificates', label: 'Certificates', icon: 'certificates' },
    ...(user?.isMasterAdmin ? [{ to: '/admin/admins', label: 'Admins', icon: 'admins' as IconName }] : []),
  ]

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

  const pageTitle: AdminPageTitle =
    routeTitleMap[location.pathname] || routeTitleMap[location.pathname.split('/').slice(0, 3).join('/')] || 'Dashboard'

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[calc(100vw-0px)] transform bg-surface border-r border-border shadow-xs transition-transform duration-200 lg:static lg:max-w-none lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border lg:hidden">
          <Link to="/" title="Go to Public Website" className="flex items-center gap-2">
            <img src="/eduflow_logo.png" alt="EduFlow" className="h-7 w-auto max-h-7 object-contain" />
            <span className="text-base font-bold text-text">EduFlow Admin</span>
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
            <Link to="/" title="Go to Public Website" className="hidden lg:flex items-center gap-2.5 mb-6 px-2 group hover:opacity-90 transition-opacity">
              <img src="/eduflow_logo.png" alt="EduFlow" className="h-8 w-auto max-h-8 object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-text tracking-tight group-hover:text-primary transition-colors">EduFlow</span>
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Administration</span>
              </div>
            </Link>



            <nav className="space-y-1" aria-label="Admin">
              {sidebarLinks.map((link) => {
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
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-text hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                aria-controls="admin-sidebar"
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
                profilePath="/admin/profile"
                onLogout={handleLogout}
                theme="slate"
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
