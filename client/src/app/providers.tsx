import { useEffect, useRef, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { Toaster } from 'react-hot-toast'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth.store'

function AuthBootstrap({ children }: { children: ReactNode }) {
  const { setUser, setAccessToken, setLoading } = useAuthStore()
  const restoreStarted = useRef(false)

  useEffect(() => {
    if (restoreStarted.current) return
    restoreStarted.current = true

    let active = true

    const restoreSession = async () => {
      const currentToken = useAuthStore.getState().accessToken
      const currentUser = useAuthStore.getState().user

      try {
        if (currentToken) {
          const user = await authApi.getCurrentUser()
          if (active) {
            setUser(user)
          }
        } else {
          const refreshed = await authApi.refreshToken()
          if (active && refreshed?.accessToken) {
            setAccessToken(refreshed.accessToken)
            const user = await authApi.getCurrentUser()
            if (active) {
              setUser(user)
            }
          }
        }
      } catch (err: any) {
        // If token expired, try refreshing
        try {
          const refreshed = await authApi.refreshToken()
          if (active && refreshed?.accessToken) {
            setAccessToken(refreshed.accessToken)
            const user = await authApi.getCurrentUser()
            if (active) {
              setUser(user)
            }
          }
        } catch {
          // If refresh also failed and there was no valid session, clear
          if (active && !currentUser) {
            setUser(null)
            setAccessToken(null)
          }
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [setLoading, setUser, setAccessToken])

  return <>{children}</>
}


export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>{children}</AuthBootstrap>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
