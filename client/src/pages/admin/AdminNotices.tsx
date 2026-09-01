import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { adminApi } from '@/services/api/admin'
import {
  BellIcon,
  SearchIcon,
  InboxIcon,
  CalendarIcon,
} from '@/components/ui/icons'
import type { Notice } from '@/types/notice'

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getPriorityBadgeVariant(priority: string): 'error' | 'warning' | 'neutral' | 'default' {
  switch (priority) {
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
      return 'neutral'
    default:
      return 'default'
  }
}

export function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    courseId: '',
    classId: '',
    targetAudience: 'all' as 'all' | 'students' | 'teachers',
    title: '',
    description: '',
    attachmentUrl: '',
    isPinned: false,
    priority: 'medium' as 'low' | 'medium' | 'high',
    publishDate: '',
    expiryDate: '',
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [noticesRes, coursesRes, classesRes] = await Promise.all([
        adminApi.getNotices(),
        adminApi.getCourses({ limit: 100 }),
        adminApi.getClasses({ limit: 100 }),
      ])
      setNotices(noticesRes.data || [])
      setCourses(coursesRes.data || [])
      setClasses(classesRes.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load notices.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingNotice(null)
    setFormData({
      courseId: '',
      classId: '',
      targetAudience: 'all',
      title: '',
      description: '',
      attachmentUrl: '',
      isPinned: false,
      priority: 'medium',
      publishDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: Notice) => {
    setEditingNotice(item)
    setFormData({
      courseId: item.courseId?._id || '',
      classId: item.classId?._id || '',
      targetAudience: item.targetAudience || 'all',
      title: item.title,
      description: item.description || '',
      attachmentUrl: item.attachmentUrl || '',
      isPinned: Boolean(item.isPinned),
      priority: item.priority || 'medium',
      publishDate: item.publishDate ? new Date(item.publishDate).toISOString().slice(0, 10) : '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Title is required.')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        targetAudience: formData.targetAudience,
        attachmentUrl: formData.attachmentUrl || '',
        isPinned: formData.isPinned,
        priority: formData.priority,
        publishDate: formData.publishDate || undefined,
        expiryDate: formData.expiryDate || undefined,
      }
      if (formData.courseId) payload.courseId = formData.courseId
      if (formData.classId) payload.classId = formData.classId

      if (editingNotice) {
        await adminApi.updateNotice(editingNotice._id, payload)
        toast.success('Notice updated successfully')
      } else {
        await adminApi.createNotice(payload)
        toast.success('Notice broadcasted successfully')
      }
      setIsModalOpen(false)
      const fresh = await adminApi.getNotices()
      setNotices(fresh.data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save notice.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }


  const handleDelete = async (id: string) => {

    if (!confirm('Are you sure you want to delete this notice?')) return
    setDeletingId(id)
    try {
      await adminApi.deleteNotice(id)
      toast.success('Notice deleted')
      setNotices((prev) => prev.filter((n) => n._id !== id))
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete notice.'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.description && n.description.toLowerCase().includes(search.toLowerCase())) ||
        (n.courseId?.title && n.courseId.title.toLowerCase().includes(search.toLowerCase()))
      const matchesPriority = !selectedPriority || n.priority === selectedPriority
      return matchesSearch && matchesPriority
    })
  }, [notices, search, selectedPriority])

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="350px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="90px" />
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Notices & Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">Manage institution-wide announcements and notifications.</p>
        </div>
        <ErrorState title="Unable to load notices" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Notices & Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">Broadcast announcements across the entire platform, courses, or specific batches.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Broadcast Notice
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Total Active Notices</p>
          <p className="text-2xl font-bold text-text mt-1">{notices.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">High Priority Alerts</p>
          <p className="text-2xl font-bold text-error mt-1">{notices.filter((n) => n.priority === 'high').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Medium / Routine</p>
          <p className="text-2xl font-bold text-text mt-1">{notices.filter((n) => n.priority !== 'high').length}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {filteredNotices.length === 0 ? (
        <EmptyState
          title="No notices found"
          description="Broadcast a new platform announcement or alert."
          icon={<InboxIcon className="h-12 w-12" />}
          action={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Broadcast Notice
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((item) => (
            <div
              key={item._id}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border p-5 transition-colors ${
                item.isPinned ? 'border-primary/50 bg-primary/[0.02]' : 'border-border bg-surface hover:bg-surface/80'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                  <BellIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-text">{item.title}</h3>
                    {item.isPinned && (
                      <Badge variant="primary" className="text-[10px] font-bold">
                        📌 Pinned
                      </Badge>
                    )}
                    <Badge variant={getPriorityBadgeVariant(item.priority)} className="capitalize text-[10px]">
                      {item.priority}
                    </Badge>
                    {item.targetAudience && (
                      <Badge variant="neutral" className="capitalize text-[10px]">
                        Audience: {item.targetAudience}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span>
                      Target:{' '}
                      {item.courseId ? item.courseId.title : 'All Courses'}
                      {item.classId ? ` • ${item.classId.batchName}` : ''}
                    </span>
                    {item.teacherId?.fullName && (
                      <span>Teacher: {item.teacherId.fullName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDate(item.publishDate)}
                    </span>
                    {item.expiryDate && <span>Expires: {formatDate(item.expiryDate)}</span>}
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm text-text whitespace-pre-wrap">{item.description}</p>
                  )}
                  {item.attachmentUrl && (
                    <div className="mt-2">
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        📎 View / Download Attachment ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
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
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-text mb-4">
              {editingNotice ? 'Edit Notice' : 'Broadcast Notice'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="all">All Users (Students & Teachers)</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Target Course (Optional — leave empty for Platform Wide)
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">All Courses (Platform Wide)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Target Class / Batch (Optional)
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">All Classes in Course</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.batchName} ({cls.courseId?.title || 'Course'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notice title..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="low">Low (Information)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Urgent Announcement)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Attachment URL / PDF Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                  placeholder="https://example.com/routine.pdf"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isPinned" className="text-xs font-medium text-text cursor-pointer">
                  📌 Pin this notice to the top
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Announcement Description / Content
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed announcement text..."
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
                  {editingNotice ? 'Update Notice' : 'Broadcast Notice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  )
}
