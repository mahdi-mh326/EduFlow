import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { Container } from './Container'
import { LockIcon } from '@/components/ui/icons'

type LinkGroup = {
  title: string
  links: { label: string; href: string }[]
}

type FooterProps = {
  brand: ReactNode
  description?: string
  groups?: LinkGroup[]
  copyright?: string
}

export function Footer({ brand, description }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface text-text">
      <Container>
        {/* Main Footer Grid */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand & Mission Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-block">{brand}</div>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-sm">
                {description ||
                  'EduFlow is a modern, enterprise-grade Learning Management System designed to empower students and instructors with interactive classrooms, structured courses, and automated AI assistance.'}
              </p>

              {/* Supported Payment Badges */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <LockIcon className="h-3.5 w-3.5 text-emerald-600" /> Secured by SSLCommerz
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard'].map((method) => (
                    <span
                      key={method}
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text shadow-2xs"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 1: Explore */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text">Explore Courses</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/courses" className="text-text-muted hover:text-primary transition-colors">
                    All Courses
                  </Link>
                </li>
                <li>
                  <Link to="/courses?category=Web+Development" className="text-text-muted hover:text-primary transition-colors">
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link to="/courses?category=Programming" className="text-text-muted hover:text-primary transition-colors">
                    Programming & C++
                  </Link>
                </li>
                <li>
                  <Link to="/courses?category=Data+Science" className="text-text-muted hover:text-primary transition-colors">
                    Data Science & AI
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text">Features</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/" className="text-text-muted hover:text-primary transition-colors">
                    Live Virtual Classroom
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-text-muted hover:text-primary transition-colors">
                    Study Materials & Notes
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-text-muted hover:text-primary transition-colors">
                    Assignments & Quizzes
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-text-muted hover:text-primary transition-colors">
                    Gemini AI Assistant
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Portals & Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text">Portals & Access</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="text-text-muted hover:text-primary transition-colors">
                    Student Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-text-muted hover:text-primary transition-colors">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-text-muted hover:text-primary transition-colors">
                    Register New Account
                  </Link>
                </li>
                <li className="pt-2 text-text-muted">
                  <span className="block font-medium text-text">Support Email:</span>
                  <a href="mailto:support@eduflow.com" className="text-primary hover:underline">
                    22303011@iubat.edu
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Developer Attribution */}
        <div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-text">EduFlow LMS</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 font-medium text-text">
            <span>Developed by</span>
            <a
              href="https://mahdi-mh326.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-2xs group"
              title="Visit Portfolio of Md. Mahdi Hasan"
            >
              <span>Md. Mahdi Hasan</span>
              <svg className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

      </Container>
    </footer>
  )
}


