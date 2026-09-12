import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState, Select } from '@/components'
import {
  SearchIcon,
  GraduationCapIcon,
  LinkIcon,
  CopyIcon,
  DownloadIcon,
  BanIcon,
  CheckCircleIcon,
} from '@/components/ui/icons'
import { certificateApi } from '@/services/api/certificate'
import { courseApi } from '@/services/api/course'
import { CertificateModal } from '@/components/certificate/CertificateModal'
import type { Certificate } from '@/types/certificate'
import { formatDate } from '@/utils'
import { toast } from 'react-hot-toast'

export function AdminCertificates() {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [courses, setCourses] = useState<Array<{ value: string; label: string }>>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const loadCertificates = async () => {
    setLoading(true)
    try {
      const data = await certificateApi.getAllCertificates()
      setCertificates(data || [])
    } catch {
      toast.error('Failed to load certificates.')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const res = await courseApi.getCourses({ limit: 100 })
      const list = (res.data || []).map((c: any) => ({ value: c._id, label: c.title }))
      setCourses([{ value: '', label: 'All Courses' }, ...list])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadCertificates()
    loadCourses()
  }, [])

  const handleRevoke = async (id: string) => {
    const reason = window.prompt('Provide a reason for revoking this certificate (e.g. Incomplete requirements, plagiarism, administrative correction):')
    if (reason === null) return
    setActionLoadingId(id)
    try {
      await certificateApi.revokeCertificate(id, reason.trim() || 'Revoked by administration')
      toast.success('Certificate revoked successfully.')
      loadCertificates()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to revoke certificate.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRestore = async (id: string) => {
    if (!window.confirm('Are you sure you want to restore this certificate? It will become valid again on verification checks.')) {
      return
    }
    setActionLoadingId(id)
    try {
      await certificateApi.restoreCertificate(id)
      toast.success('Certificate restored to active status.')
      loadCertificates()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to restore certificate.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCopyLink = (certNumber: string) => {
    const url = `${window.location.origin}/verify-certificate/${certNumber}`
    navigator.clipboard.writeText(url)
    toast.success('Verification link copied to clipboard!')
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No certificates to export')
      return
    }

    const headers = ['Certificate ID', 'Student Name', 'Student Email', 'Course', 'Batch', 'Progress (%)', 'Grade', 'Status', 'Issue Date']
    const rows = filtered.map((c) => [
      c.certificateNumber || '',
      `"${(c.studentId?.fullName || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.studentId?.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.courseId?.title || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.classId?.batchName || 'N/A').replace(/"/g, '""')}"`,
      c.completionPercentage || 0,
      c.grade || 'Pass',
      c.isRevoked ? 'Revoked' : 'Active',
      c.issueDate ? new Date(c.issueDate).toLocaleDateString() : 'N/A',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `EduFlow_Certificates_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Certificates exported to CSV')
  }

  const filtered = certificates.filter((c) => {
    if (selectedCourse) {
      const courseId = (c.courseId as any)?._id || c.courseId
      if (String(courseId) !== selectedCourse) return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const student = c.studentId?.fullName?.toLowerCase() || ''
    const email = c.studentId?.email?.toLowerCase() || ''
    const course = c.courseId?.title?.toLowerCase() || ''
    const certNum = c.certificateNumber?.toLowerCase() || ''
    return student.includes(q) || email.includes(q) || course.includes(q) || certNum.includes(q)
  })

  if (loading && certificates.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2rem" width="240px" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="90px" className="rounded-2xl" />
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height="60px" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Certificate Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            Inspect, filter, verify, and govern all accredited certificates issued to graduates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="font-medium inline-flex items-center gap-1.5"
          >
            <DownloadIcon className="h-4 w-4 text-primary" />
            <span>Export CSV</span>
          </Button>
          <Link to="/verify-certificate" target="_blank">
            <Button variant="primary" size="sm" className="font-semibold inline-flex items-center gap-1.5">
              <SearchIcon className="h-4 w-4" />
              <span>Public Verification</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Certificates</p>
          <p className="mt-1 text-2xl font-black text-text">{certificates.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Distinction Honors (&gt;=90%)</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {certificates.filter((c) => c.grade === 'Distinction').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Merit Honors (&gt;=80%)</p>
          <p className="mt-1 text-2xl font-black text-primary">
            {certificates.filter((c) => c.grade === 'Merit').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Revoked Certificates</p>
          <p className="mt-1 text-2xl font-black text-rose-600">
            {certificates.filter((c) => c.isRevoked).length}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by student, email, certificate ID, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            </div>
            {courses.length > 0 && (
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={courses}
                className="sm:w-56"
              />
            )}
          </div>
          <span className="text-xs text-text-muted shrink-0 font-medium">
            Showing {filtered.length} of {certificates.length} certificates
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No certificates found"
            description={searchQuery || selectedCourse ? 'No certificates match your filters.' : 'No certificates have been issued yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] divide-y divide-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Certificate ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Course & Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Score & Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Issue Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filtered.map((cert) => (
                  <tr key={cert._id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-amber-500/10 px-2 py-1 font-mono text-xs font-bold text-amber-700">
                          {cert.certificateNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(cert.certificateNumber)}
                          className="text-text-muted hover:text-primary p-1"
                          title="Copy verification link"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-text">{cert.studentId?.fullName || 'Student'}</p>
                      <p className="text-[11px] text-text-muted">{cert.studentId?.email || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-text">{cert.courseId?.title || 'Course'}</p>
                      <p className="text-[11px] text-text-muted">{cert.classId?.batchName || 'Batch'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cert.grade === 'Distinction' ? 'success' : 'primary'} className="text-[11px]">
                        {cert.grade} ({cert.completionPercentage}%)
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {cert.isRevoked ? (
                        <span title={cert.revokedReason || 'Revoked'}>
                          <Badge variant="error" className="text-[10px] font-bold">
                            Revoked
                          </Badge>
                        </span>
                      ) : (
                        <Badge variant="success" className="text-[10px] font-bold">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {formatDate(cert.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCert(cert)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition-all cursor-pointer"
                          title="View certificate modal"
                        >
                          <GraduationCapIcon className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                        <Link
                          to={`/verify-certificate/${cert.certificateNumber}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-text hover:text-primary transition-all"
                          title="Open public verification page"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>Verify</span>
                        </Link>
                        {cert.isRevoked ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === cert._id}
                            onClick={() => handleRestore(cert._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
                            title="Restore revoked certificate"
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === cert._id}
                            onClick={() => handleRevoke(cert._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all"
                            title="Revoke certificate for policy violation"
                          >
                            <BanIcon className="h-3 w-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          open={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  )
}

