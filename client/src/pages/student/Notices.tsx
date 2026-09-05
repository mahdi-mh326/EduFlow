import { useState, useEffect, useMemo } from 'react'
import { Badge, Skeleton, EmptyState, ErrorState, Container } from '@/components'
import { noticeApi } from '@/services/api/notice'
import {
  BellIcon,
  SearchIcon,
  InboxIcon,
  CalendarIcon,
  PinIcon,
  PaperclipIcon,
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

export function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await noticeApi.getNotices()
      setNotices(data || [])
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
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton variant="text" height="1.25rem" width="250px" className="mb-2" />
              <Skeleton variant="text" height="0.875rem" width="180px" className="mb-3" />
              <Skeleton variant="text" height="0.875rem" width="400px" />
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
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Notices & Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">Important notices and updates from your teachers and institution.</p>
        </div>
        <ErrorState title="Unable to load notices" message={error} onRetry={loadData} />
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Notices & Announcements</h1>
        <p className="mt-1 text-sm text-text-muted">Stay informed with the latest updates, exam schedules, and classroom announcements.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices by keyword..."
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
          description="There are currently no active announcements or notices."
          icon={<InboxIcon className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border p-5 sm:p-6 transition-all ${
                item.isPinned ? 'border-primary/50 bg-primary/[0.02]' : 'border-border bg-surface hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BellIcon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text">{item.title}</h2>
                    {item.isPinned && (
                      <Badge variant="primary" className="text-[10px] font-bold inline-flex items-center gap-1">
                        <PinIcon className="h-3 w-3" />
                        <span>Pinned</span>
                      </Badge>
                    )}
                    <Badge variant={getPriorityBadgeVariant(item.priority)} className="capitalize text-[10px]">
                      {item.priority}
                    </Badge>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    {item.courseId?.title ? (
                      <span>{item.courseId.title} {item.classId?.batchName ? `• ${item.classId.batchName}` : ''}</span>
                    ) : (
                      <span className="font-semibold text-primary inline-flex items-center gap-1">
                        <BellIcon className="h-3.5 w-3.5" />
                        <span>Platform Announcement</span>
                      </span>
                    )}
                    {item.teacherId?.fullName && (
                      <span>By: {item.teacherId.fullName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDate(item.publishDate)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm text-text whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.attachmentUrl && (
                    <div className="mt-3 pt-2 border-t border-border">
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        <PaperclipIcon className="h-3.5 w-3.5" />
                        <span>View / Download Attached File ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </Container>
  )
}
