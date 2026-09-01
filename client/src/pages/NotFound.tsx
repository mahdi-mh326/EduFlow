import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InboxIcon } from '@/components/ui/icons'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center text-gray-300">
          <InboxIcon className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-text">Page Not Found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/')} className="w-full sm:w-auto">
            Go Home
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()} className="w-full sm:w-auto">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
