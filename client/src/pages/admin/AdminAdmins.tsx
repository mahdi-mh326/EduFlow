import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, ConfirmDialog } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  PlusIcon,
  TrashIcon,
  InboxIcon,
} from '@/components/ui/icons'
import { AdminAdminForm } from './AdminAdminForm'
import { getAvatarUrl } from '@/utils'


export function AdminAdmins() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null)

  const loadAdmins = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getAdmins({ limit: 100 })
      setAdmins(result.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load admins. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])



  const handleToggleStatus = async (admin: any) => {
    const nextStatus = admin.status === 'active' ? 'blocked' : 'active'
    setStatusTogglingId(admin._id)
    try {
      await adminApi.updateAdminStatus(admin._id, nextStatus)
      toast.success(`Admin ${nextStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`)
      loadAdmins()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update admin status.'
      toast.error(message)
    } finally {
      setStatusTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await adminApi.deleteAdmin(deletingId)
      toast.success('Admin deleted successfully')
      setDeletingId(null)
      loadAdmins()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete admin.'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="250px" className="mb-3" />
              <Skeleton variant="text" height="0.875rem" width="180px" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Admins Management</h1>
          <p className="mt-1 text-sm text-text-muted">Master Admin Portal &bull; Manage system administrator accounts.</p>
        </div>
        <ErrorState title="Unable to load admins" message={error} onRetry={loadAdmins} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Administrators</h1>
          <p className="mt-1 text-sm text-text-muted">Master Admin Portal &bull; Create, manage, and monitor general administrators.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add General Admin
        </Button>
      </div>

      {admins.length === 0 ? (
        <EmptyState
          title="No admins found"
          description="Admins will appear here once created."
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add General Admin
            </Button>
          }
        />

      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin._id}
              className="rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-base font-semibold text-primary">
                    {admin.avatar ? (
                      <img src={getAvatarUrl(admin.avatar)} alt={admin.fullName} className="h-full w-full object-cover" />
                    ) : (
                      admin.fullName?.charAt(0).toUpperCase() || 'A'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text truncate">{admin.fullName}</p>
                      {admin.isMasterAdmin ? (
                        <Badge variant="primary" className="bg-purple-100 text-purple-800 border-purple-200">
                          Master Admin
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-slate-100 text-slate-700">
                          General Admin
                        </Badge>
                      )}
                      <Badge variant={admin.status === 'active' ? 'success' : 'error'} className="capitalize">
                        {admin.status}
                      </Badge>
                      {!admin.isVerified && (
                        <Badge variant="warning">Pending Verification</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 truncate">
                      {admin.email} &bull; {admin.phone}
                    </p>
                  </div>
                </div>

                {!admin.isMasterAdmin && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={admin.status === 'active' ? 'outline' : 'primary'}
                      size="sm"
                      loading={statusTogglingId === admin._id}
                      onClick={() => handleToggleStatus(admin)}
                      title={admin.status === 'active' ? 'Block Admin' : 'Unblock Admin'}
                    >
                      {admin.status === 'active' ? (
                        <>
                          <svg className="h-3.5 w-3.5 mr-1 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Block
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5 mr-1 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                          </svg>
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(admin._id)}
                      aria-label="Delete admin"
                      title="Delete Admin"
                    >
                      <TrashIcon className="h-4 w-4 text-error" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminAdminForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadAdmins}
      />



      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete General Admin"
        message="Are you sure you want to delete this administrator account? They will immediately lose access to the admin portal."
        confirmLabel="Delete Admin"
        variant="danger"
      />
    </Container>
  )
}

