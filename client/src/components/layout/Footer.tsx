import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { Container } from './Container'

type LinkGroup = {
  title: string
  links: { label: string; href: string }[]
}

type FooterProps = {
  brand: ReactNode
  description?: string
  groups: LinkGroup[]
  copyright?: string
}

export function Footer({ brand, description, groups, copyright }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface text-text">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3">{brand}</div>
              {description && <p className="text-xs text-text-muted leading-relaxed">{description}</p>}
            </div>

            {groups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-text">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="text-xs text-text-muted hover:text-primary transition-colors duration-150">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border py-6">
          <p className="text-center text-xs text-text-muted">
            {copyright || `© ${new Date().getFullYear()} EduFlow. All rights reserved.`}
          </p>
        </div>
      </Container>
    </footer>
  )
}

