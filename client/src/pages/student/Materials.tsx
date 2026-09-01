import { useState, useEffect, useMemo } from 'react'
import { Button, Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { materialApi } from '@/services/api/material'
import { studentApi } from '@/services/api/student'
import {
  SearchIcon,
  InboxIcon,
  FileTextIcon,
} from '@/components/ui/icons'
import type { Material } from '@/types/material'
import { getSafeExternalUrl } from '@/utils'

export function StudentMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [materialsData, enrollmentsData] = await Promise.all([
        materialApi.getMaterials(),
        studentApi.getEnrollments().catch(() => []),
      ])
      setMaterials(materialsData || [])
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load study materials.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase())) ||
        (m.courseId?.title && m.courseId.title.toLowerCase().includes(search.toLowerCase()))
      const matchesCourse = !selectedCourseId || m.courseId?._id === selectedCourseId
      const matchesType = !selectedType || m.fileType === selectedType
      return matchesSearch && matchesCourse && matchesType
    })
  }, [materials, search, selectedCourseId, selectedType])

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="350px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1rem" width="100px" className="mb-3" />
              <Skeleton variant="text" height="2rem" width="60px" />
            </div>
          ))}
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
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Study Materials</h1>
          <p className="mt-1 text-sm text-text-muted">Handouts, lecture notes, and reference files for your enrolled classes.</p>
        </div>
        <ErrorState title="Unable to load materials" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Study Materials</h1>
        <p className="mt-1 text-sm text-text-muted">Access lecture handouts, slides, reference links, and materials uploaded by your instructors.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Available Files</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">PDF Notes</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.filter((m) => m.fileType === 'pdf').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Video Lectures</p>
          <p className="text-2xl font-bold text-text mt-1">{materials.filter((m) => m.fileType === 'video').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Docs & References</p>
          <p className="text-2xl font-bold text-text mt-1">
            {materials.filter((m) => m.fileType !== 'pdf' && m.fileType !== 'video').length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials by title or keyword..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All Courses</option>
          {enrollments.map((enr) => (
            <option key={enr._id} value={enr.courseId?._id}>
              {enr.courseId?.title}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All File Types</option>
          <option value="pdf">PDF Document</option>
          <option value="video">Video</option>
          <option value="document">Document</option>
          <option value="link">Link</option>
          <option value="archive">Archive (ZIP)</option>
        </select>
      </div>

      {filteredMaterials.length === 0 ? (
        <EmptyState
          title="No materials available"
          description="Your instructors have not uploaded any study materials yet."
          icon={<InboxIcon className="h-12 w-12" />}
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
                      <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                      <Badge variant="primary" className="uppercase text-[10px]">
                        {item.fileType}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.courseId?.title || 'Course'} • {item.classId?.batchName || 'Class'}
                      {item.teacherId?.fullName && ` • Instructor: ${item.teacherId.fullName}`}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-text line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {safeUrl ? (
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="sm">
                        Download / Open
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-text-muted">No link</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
