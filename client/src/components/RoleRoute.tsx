import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/auth'
import { ErrorState } from '@/components'

type RoleRouteProps = {
  children: React.ReactNode
  allowedRoles: UserRole[]
  requireMasterAdmin?: boolean
}

export function RoleRoute({ children, allowedRoles, requireMasterAdmin }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.mustChangePassword && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />
  }

  if (!allowedRoles.includes(user.role) || (requireMasterAdmin && !user.isMasterAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <ErrorState
            title="Access Restricted"
            message={
              requireMasterAdmin
                ? "This section is restricted to the Master Administrator only."
                : "You don't have permission to access this page. Contact your administrator if you believe this is an error."
            }

            secondaryAction={
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex"
              >
                <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  Back to Home
                </span>
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
