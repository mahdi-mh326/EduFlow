import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export function LoginDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const loginOptions = [
    {
      role: 'student',
      title: 'Student Login',
      description: 'Access courses & live classrooms',
      icon: '🎓',
      href: '/login?role=student',
      colorClass: 'group-hover:text-primary',
    },
    {
      role: 'teacher',
      title: 'Teacher Login',
      description: 'Instructor suite & live teaching',
      icon: '👨‍🏫',
      href: '/login?role=teacher',
      colorClass: 'group-hover:text-indigo-600',
    },
    {
      role: 'admin',
      title: 'Admin Portal',
      description: 'Institutional management & control',
      icon: '🛡️',
      href: '/login?role=admin',
      colorClass: 'group-hover:text-slate-900',
    },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-text hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Log In</span>
        <svg
          className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
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
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-border bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >

          <div className="px-3 py-2 border-b border-border/80 mb-1">
            <p className="text-[11px] font-bold text-text uppercase tracking-wider">
              Select Your Portal
            </p>
            <p className="text-[10px] text-text-muted">
              Choose your account role to sign in
            </p>
          </div>

          <div className="space-y-1">
            {loginOptions.map((opt) => (
              <Link
                key={opt.role}
                to={opt.href}
                onClick={() => setIsOpen(false)}
                className="group flex items-start gap-3 rounded-xl p-2.5 text-xs font-medium text-text hover:bg-slate-50 transition-colors"
                role="menuitem"
              >
                <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold transition-colors ${opt.colorClass}`}>
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">
                    {opt.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-border/80 mt-1.5 pt-1.5 px-3 py-1 flex items-center justify-between text-[11px]">
            <span className="text-text-muted">New to EduFlow?</span>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="font-bold text-primary hover:underline"
            >
              Sign Up →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
