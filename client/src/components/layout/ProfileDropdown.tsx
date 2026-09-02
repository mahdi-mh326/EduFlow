import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogoutIcon } from '@/components/ui/icons'
import type { User } from '@/types/auth'
import { getAvatarUrl } from '@/utils'
import { useAuthStore } from '@/stores/auth.store'

type ProfileDropdownProps = {
  user?: User | null
  profilePath: string
  onLogout: () => void
  theme?: 'primary' | 'indigo' | 'slate'
}

export function ProfileDropdown({
  user: userProp,
  profilePath,
  onLogout,
  theme = 'primary',
}: ProfileDropdownProps) {
  const storeUser = useAuthStore((state) => state.user)
  const user = storeUser || userProp
  const [isOpen, setIsOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImgError(false)
  }, [user?.avatar])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  const avatarUrl = getAvatarUrl(user?.avatar)
  const hasValidAvatar = !!avatarUrl && !imgError

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'teacher'
      ? 'Instructor'
      : 'Student'


  const themeClasses = {
    primary: {
      avatarBg: 'bg-primary/10 text-primary border-primary/20',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/60',
      activeRing: 'focus-visible:ring-primary',
    },
    indigo: {
      avatarBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/60',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      activeRing: 'focus-visible:ring-indigo-600',
    },
    slate: {
      avatarBg: 'bg-slate-900 text-white border-slate-700',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      activeRing: 'focus-visible:ring-slate-900',
    },
  }[theme]

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 rounded-xl p-2 sm:px-2.5 sm:py-1.5 border border-border/80 sm:border-0 bg-slate-50/70 sm:bg-transparent transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ${themeClasses.activeRing}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border overflow-hidden text-xs font-bold shadow-xs ${themeClasses.avatarBg}`}
          >
            {hasValidAvatar ? (
              <img
                src={avatarUrl}
                alt={user?.fullName || 'User'}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              initials
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-text leading-tight max-w-[140px] truncate">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-text-muted capitalize leading-tight">
              {roleLabel}
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-text' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="w-full sm:w-64 sm:absolute sm:right-0 sm:top-full mt-2 origin-top rounded-2xl border border-border bg-surface p-2 shadow-sm sm:shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
        >


          {/* User Info Card */}
          <div className="rounded-xl bg-slate-50 border border-border/70 p-3 mb-1.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border overflow-hidden text-sm font-bold shadow-xs ${themeClasses.avatarBg}`}
              >
                {hasValidAvatar ? (
                  <img
                    src={avatarUrl}
                    alt={user?.fullName || 'User'}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-text">{user?.fullName}</p>
                <p className="truncate text-[11px] text-text-muted">{user?.email}</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${themeClasses.badgeBg}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>



          {/* Navigation Links */}
          <div className="space-y-0.5 py-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text hover:bg-slate-100 hover:text-primary transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </Link>

            {user?.role === 'student' && (
              <Link
                to="/student/enrollments"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text hover:bg-slate-100 hover:text-primary transition-colors"
                role="menuitem"
              >
                <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                My Enrollments
              </Link>
            )}

            {user?.role === 'teacher' && (
              <Link
                to="/teacher/classes"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text hover:bg-slate-100 hover:text-primary transition-colors"
                role="menuitem"
              >
                <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Live Classes
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link

                to="/admin/courses"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text hover:bg-slate-100 hover:text-primary transition-colors"
                role="menuitem"
              >
                <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                </svg>
                Manage Courses
              </Link>
            )}
          </div>

          <div className="border-t border-border/80 my-1" />

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            role="menuitem"
          >
            <LogoutIcon className="h-4 w-4 text-rose-600" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
