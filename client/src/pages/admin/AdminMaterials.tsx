import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  SearchIcon,
  InboxIcon,
  FileTextIcon,
} from '@/components/ui/icons'
import type { Material } from '@/types/material'
import { getSafeExternalUrl } from '@/utils'

export function AdminMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    courseId: '',
    classId: '',
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf',
    visibility: 'public' as 'public' | 'private',
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [materialsRes, coursesRes, classesRes] = await Promise.all([
        adminApi.getMaterials(),
        adminApi.getCourses({ limit: 100 }),
        adminApi.getClasses({ limit: 100 }),
      ])
      setMaterials(materialsRes.data || [])
      setCourses(coursesRes.data || [])
      setClasses(classesRes.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load materials.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingMaterial(null)
    setFormData({
      courseId: courses[0]?._id || '',
      classId: classes[0]?._id || '',
      title: '',
      description: '',
      fileUrl: '',
      fileType: 'pdf',
      visibility: 'public',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: Material) => {
    setEditingMaterial(item)
    setFormData({
      courseId: item.courseId?._id || '',
      classId: item.classId?._id || '',
      title: item.title,
      description: item.description || '',
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      visibility: (item.visibility as 'public' | 'private') || 'public',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.classId || !formData.courseId || !formData.title.trim() || !formData.fileUrl.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      if (editingMaterial) {
        await adminApi.updateMaterial(editingMaterial._id, formData)
        toast.success('Study material updated successfully')
      } else {
        await adminApi.createMaterial(formData)
        toast.success('Study material created successfully')
      }
      setIsModalOpen(false)
      const fresh = await adminApi.getMaterials()
      setMaterials(fresh.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save material.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    setDeletingId(id)
    try {
      await adminApi.deleteMaterial(id)
      toast.success('Material deleted')
      setMaterials((prev) => prev.filter((m) => m._id !== id))
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete material.'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase())) ||
        (m.courseId?.title && m.courseId.title.toLowerCase().includes(search.toLowerCase()))
      const matchesCourse = !selectedCourseId || m.courseId?._id === selectedCourseId
      const matchesClass = !selectedClassId || m.classId?._id === selectedClassId
      return matchesSearch && matchesCourse && matchesClass
    })
  }, [materials, search, selectedCourseId, selectedClassId])

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="350px" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="70px" />
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Materials Management</h1>
          <p className="mt-1 text-sm text-text-muted">Manage all academic files, handouts, and resources across courses.</p>
        </div>
        <ErrorState title="Unable to load materials" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Materials Management</h1>
          <p className="mt-1 text-sm text-text-muted">Upload and manage educational documents, slides, and videos across all classes.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Add Material
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Total Materials</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">PDF Documents</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.filter((m) => m.fileType === 'pdf').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Videos & Media</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.filter((m) => m.fileType === 'video').length}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>{cls.batchName}</option>
          ))}
        </select>
      </div>

      {filteredMaterials.length === 0 ? (
        <EmptyState
          title="No materials found"
          description="Upload files and study resources to make them available to classes."
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Add Material
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredMaterials.map((item) => {
            const safeUrl = getSafeExternalUrl(item.fileUrl)
            return (
              <div
                key={item._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface/80"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text truncate">{item.title}</h3>
                      <Badge variant="primary" className="uppercase text-[10px]">
                        {item.fileType}
                      </Badge>
                      <Badge variant={item.visibility === 'public' ? 'success' : 'neutral'} className="capitalize text-[10px]">
                        {item.visibility}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.courseId?.title || 'Course'} • {item.classId?.batchName || 'Class'}
                      {item.teacherId?.fullName && ` • Instructor: ${item.teacherId.fullName}`}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-text line-clamp-1">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {safeUrl && (
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        View File
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-4">
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Course *
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a course...</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Class / Batch *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.batchName} ({cls.courseId?.title || 'Course'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Material title"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    File Type *
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  File URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                >
                  {editingMaterial ? 'Update Material' : 'Create Material'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  )
}
