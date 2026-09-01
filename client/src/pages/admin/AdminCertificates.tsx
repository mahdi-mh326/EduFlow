import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton, EmptyState } from '@/components'
import { certificateApi } from '@/services/api/certificate'
import { CertificateModal } from '@/components/certificate/CertificateModal'
import type { Certificate } from '@/types/certificate'
import { formatDate } from '@/utils'
import { toast } from 'react-hot-toast'

export function AdminCertificates() {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

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

  useEffect(() => {
    loadCertificates()
  }, [])

  const filtered = certificates.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const student = c.studentId?.fullName?.toLowerCase() || ''
    const email = c.studentId?.email?.toLowerCase() || ''
    const course = c.courseId?.title?.toLowerCase() || ''
    const certNum = c.certificateNumber?.toLowerCase() || ''
    return student.includes(q) || email.includes(q) || course.includes(q) || certNum.includes(q)
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2rem" width="240px" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Issued Certificates</h1>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            View, inspect, and verify all credentials generated across all platform courses and batches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/verify-certificate">
            <Button variant="outline" size="sm" className="font-semibold text-primary">
              🔍 Public Verification
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Total Certificates Issued</p>
          <p className="mt-1 text-2xl font-extrabold text-text">{certificates.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Distinction Honors (&gt;=90%)</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">
            {certificates.filter((c) => c.grade === 'Distinction').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-muted">Merit Honors (&gt;=80%)</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">
            {certificates.filter((c) => c.grade === 'Merit').length}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-sm w-full">
            <input
              type="text"
              placeholder="Search by student, certificate ID, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <span className="text-xs text-text-muted">{filtered.length} certificates</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No certificates found"
            description={searchQuery ? 'No certificates match your search.' : 'No certificates have been claimed yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] divide-y divide-border">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Certificate ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Course & Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Score & Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Issue Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filtered.map((cert) => (
                  <tr key={cert._id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-amber-500/10 px-2 py-1 font-mono text-xs font-bold text-amber-700">
                        {cert.certificateNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-text">{cert.studentId?.fullName}</p>
                      <p className="text-[11px] text-text-muted">{cert.studentId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-text">{cert.courseId?.title}</p>
                      <p className="text-[11px] text-text-muted">{cert.classId?.batchName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cert.grade === 'Distinction' ? 'success' : 'primary'} className="text-[11px]">
                        {cert.grade} ({cert.completionPercentage}%)
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {formatDate(cert.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCert(cert)}
                        className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        🎓 View
                      </button>
                      <Link
                        to={`/verify-certificate/${cert.certificateNumber}`}
                        target="_blank"
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text hover:text-primary transition-all"
                      >
                        🔗 Verify
                      </Link>
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
