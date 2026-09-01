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
import type { AdminCourse } from '@/types/admin'
import { getImageUrl } from '@/utils'
import { AdminCourseForm } from './AdminCourseForm'


const COURSE_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const COURSE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Programming', label: 'Programming' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Mobile Development', label: 'Mobile Development' },
  { value: 'UI/UX Design', label: 'UI/UX Design' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Cyber Security', label: 'Cyber Security' },
  { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Database', label: 'Database' },
  { value: 'Cloud Computing', label: 'Cloud Computing' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Other', label: 'Other' },
]

const COURSE_DIFFICULTIES = [
  { value: '', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCourses = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.getCourses({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        difficulty: difficultyFilter || undefined,
        sortBy: 'newest',
        sortOrder: 'desc',
      })
      setCourses(result.data || [])
      setMeta(result.meta || null)
      setCurrentPage(result.meta?.page || page)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load courses. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses(1)
  }, [search, statusFilter, categoryFilter, difficultyFilter])

  const handleCreate = () => {
    setEditingCourse(null)
    setShowForm(true)
  }

  const handleEdit = (course: AdminCourse) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await adminApi.deleteCourse(deletingId)
      toast.success('Course deleted successfully')
      setDeletingId(null)
      loadCourses(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete course.'
      toast.error(message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCourse(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCourse(null)
    loadCourses(currentPage)
  }

  const handlePublish = async (course: AdminCourse) => {
    try {
      await adminApi.publishCourse(course._id)
      toast.success(course.status === 'published' ? 'Course unpublished' : 'Course published')
      loadCourses(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update course status.'
      toast.error(message)
    }
  }

  const handleFeature = async (course: AdminCourse) => {
    try {
      await adminApi.featureCourse(course._id)
      toast.success(course.featured ? 'Course unfeatured' : 'Course featured')
      loadCourses(currentPage)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update course feature status.'
      toast.error(message)
    }
  }

  if (loading && courses.length === 0) {
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

  if (error && courses.length === 0) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all courses on the platform.</p>
        </div>
        <ErrorState title="Unable to load courses" message={error} onRetry={() => loadCourses(currentPage)} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all courses on the platform.</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={COURSE_STATUSES} className="w-full" />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={COURSE_CATEGORIES} className="w-full hidden sm:block" />
          <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} options={COURSE_DIFFICULTIES} className="w-full hidden sm:block" />
        </div>
        {(search || statusFilter || categoryFilter || difficultyFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setCategoryFilter('')
              setDifficultyFilter('')
            }}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description={search || statusFilter || categoryFilter || difficultyFilter ? 'Try adjusting your filters.' : 'Create your first course to get started.'}
          icon={<InboxIcon className="h-12 w-12" />}
          action={!search && !statusFilter && !categoryFilter && !difficultyFilter ? (
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="rounded-xl border border-border bg-surface p-5 transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {course.thumbnail ? (
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-slate-900 shadow-xs">
                      <img src={getImageUrl(course.thumbnail)} alt={course.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-24 shrink-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 text-text-muted text-[10px] text-center p-1 font-medium">
                      No Poster
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text">{course.title}</h3>
                      <Badge variant={course.status === 'published' ? 'success' : course.status === 'draft' ? 'default' : 'warning'} className="capitalize">{course.status}</Badge>
                      {course.featured && <Badge variant="primary">Featured</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">{course.shortDescription}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span>{course.category}</span>
                      <span>•</span>
                      <span className="capitalize">{course.difficulty}</span>
                      <span>•</span>
                      <span className="font-semibold text-text">৳{course.price}</span>
                      {course.offerPrice && <span className="text-emerald-600 font-medium">Offer: ৳{course.offerPrice}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button variant="ghost" size="sm" onClick={() => handlePublish(course)}>
                    {course.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFeature(course)}>
                    {course.featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(course)} aria-label="Edit course">
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingId(course._id)} aria-label="Delete course">
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
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => loadCourses(page)} />
        </div>
      )}

      <AdminCourseForm
        open={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        course={editingCourse}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Container>
  )
}
