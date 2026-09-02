import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon } from '@/components/ui/icons'
import { Container } from './Container'

type NavLink = { label: string; href: string }

type NavbarProps = {
  brand: ReactNode
  links: NavLink[]
  authArea: ReactNode
}

export function Navbar({ brand, links, authArea }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const isActive = (href: string) => {
    if (location.pathname === href) return true
    if (href !== '/' && location.pathname.startsWith(`${href}/`)) return true
    return false
  }

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, setOpen])


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md shadow-xs">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">{brand}</div>

          <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Primary">
            {links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    active ? 'text-primary font-semibold' : 'text-text-muted hover:text-text'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex md:items-center md:gap-3">{authArea}</div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-lg p-2 text-text-muted hover:bg-slate-100 hover:text-text md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setOpen(false)} />
            <nav className="border-t border-border pb-4 pt-4 md:hidden relative z-50 bg-surface rounded-b-2xl shadow-lg" aria-label="Mobile">
              <div className="flex flex-col gap-1">
                {links.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                        active ? 'bg-primary/10 text-primary font-semibold' : 'text-text-muted hover:bg-slate-100 hover:text-text'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-border">{authArea}</div>
              </div>
            </nav>
          </>
        )}
      </Container>
    </header>
  )
}

