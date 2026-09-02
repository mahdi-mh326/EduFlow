import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { publicRoutes, studentRoutes, teacherRoutes, adminRoutes } from '@/routes'
import { PublicLayout } from '@/layouts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NotFound } from '@/pages/NotFound'
import { ScrollToTop } from '@/components/layout'

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-sm text-text-muted" role="status">Loading page…</div>}>

        <Routes>
          <Route element={<PublicLayout />}>
            {publicRoutes}
          </Route>
          {studentRoutes}
          {teacherRoutes}
          {adminRoutes}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
