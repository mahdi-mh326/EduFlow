import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, EmptyState, Container, Select, ConfirmDialog, Pagination } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  InboxIcon,
} from '@/components/ui/icons'
import type { AdminTeacher } from '@/types/admin'
import { getAvatarUrl } from '@/utils'
import { AdminTeacherForm } from './AdminTeacherForm'


const TEACHER_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
]

const GENDERS = [
  { value: '', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export function AdminTeachers() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<AdminTeacher | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTeachers = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getTeachers({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        gender: genderFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setTeachers(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load teachers. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers(1)
  }, [search, statusFilter, genderFilter])

  const handleCreate = () => {
    setEditingTeacher(null)
    setShowForm(true)
  }

  const handleEdit = (teacher: AdminTeacher) => {
    setEditingTeacher(teacher)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await adminApi.deleteTeacher(deletingId)
      toast.success('Teacher deleted successfully')
      setDeletingId(null)
      loadTeachers(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete teacher.'
      toast.error(message)
    }
  }

  const handleStatusUpdate = async (teacher: AdminTeacher, status: string) => {
    try {
      await adminApi.updateTeacherStatus(teacher._id, status as 'active' | 'blocked')
      toast.success('Teacher status updated successfully')
      loadTeachers(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update teacher status.'
      toast.error(message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTeacher(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTeacher(null)
    loadTeachers(currentPage)
  }

  if (loading && teachers.length === 0) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" className="mb-2" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="250px" className="mb-3" />
              <Skeleton variant="text" height="0.875rem" width="180px" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error && teachers.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Teachers</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all teachers on the platform.</p>
        </div>
        <ErrorState title="Unable to load teachers" message={error} onRetry={() => loadTeachers(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Teachers</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all teachers on the platform.</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={TEACHER_STATUSES} className="w-full" />
          <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} options={GENDERS} className="w-full hidden sm:block" />
        </div>
      </div>

      {teachers.length === 0 ? (
        <EmptyState
          title="No teachers found"
          description={search || statusFilter || genderFilter ? 'Try adjusting your filters.' : 'Add your first teacher to get started.'}
          icon={<InboxIcon className="h-12 w-12" />}
          action={!search && !statusFilter && !genderFilter ? (
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div
              key={teacher._id}
              className="rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-sm font-semibold text-primary">
                    {teacher.avatar ? (
                      <img src={getAvatarUrl(teacher.avatar)} alt={teacher.fullName} className="h-full w-full object-cover" />
                    ) : (
                      teacher.fullName?.charAt(0).toUpperCase() || 'T'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-text truncate">{teacher.fullName}</p>
                      <Badge variant={teacher.status === 'active' ? 'success' : teacher.status === 'pending' ? 'warning' : 'error'} className="capitalize">{teacher.status}</Badge>
                      {!teacher.isVerified && (
                        <Badge variant="warning">Pending Verification</Badge>
                      )}
                    </div>

                    <p className="text-xs text-text-muted truncate">{teacher.email} • {teacher.phone}</p>
                    {teacher.teacherProfile && (
                      <p className="text-xs text-text-muted truncate">{teacher.teacherProfile.designation} • {teacher.teacherProfile.qualification}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  {teacher.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(teacher, 'active')}>
                      Approve
                    </Button>
                  )}
                  {teacher.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(teacher, 'blocked')}>
                      Block
                    </Button>
                  )}
                  {teacher.status === 'blocked' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(teacher, 'active')}>
                      Unblock
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)} aria-label="Edit teacher">
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingId(teacher._id)} aria-label="Delete teacher">
                    <TrashIcon className="h-4 w-4 text-error" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => loadTeachers(page)} />
        </div>
      )}

      <AdminTeacherForm
        open={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        teacher={editingTeacher}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Container>
  )
}
