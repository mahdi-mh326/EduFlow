import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Skeleton } from '@/components'
import { certificateApi } from '@/services/api/certificate'
import { enrollmentApi } from '@/services/api/enrollment'
import { CertificateModal } from '@/components/certificate/CertificateModal'
import type { Certificate, ClassProgress } from '@/types/certificate'
import { formatDate } from '@/utils'
import { toast } from 'react-hot-toast'

export function StudentCertificates() {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, ClassProgress>>({})
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [claimingClassId, setClaimingClassId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [certList, enrollList] = await Promise.all([
        certificateApi.getMyCertificates().catch(() => []),
        enrollmentApi.getEnrollments().catch(() => []),
      ])

      setCertificates(certList)
      const paidEnrollments = enrollList.filter((e: any) => e.status === 'active' && e.paymentStatus === 'paid' && e.classId)
      setEnrollments(paidEnrollments)

      // Fetch progress for each active class
      const progressPromises = paidEnrollments.map(async (e: any) => {
        const cId = e.classId?._id || e.classId
        if (cId) {
          try {
            const p = await certificateApi.getProgress(cId)
            return { classId: String(cId), progress: p }
          } catch {
            return null
          }
        }
        return null
      })

      const progressResults = await Promise.all(progressPromises)
      const pMap: Record<string, ClassProgress> = {}
      progressResults.forEach((res) => {
        if (res) pMap[res.classId] = res.progress
      })
      setProgressMap(pMap)
    } catch {
      toast.error('Failed to load certificates & progress.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleClaim = async (classId: string) => {
    setClaimingClassId(classId)
    try {
      const cert = await certificateApi.claimCertificate(classId)
      setCertificates((prev) => [cert, ...prev.filter((c) => c._id !== cert._id)])
      setSelectedCert(cert)
      toast.success('Congratulations! Your Certificate is ready.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to claim certificate.')
    } finally {
      setClaimingClassId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height="2rem" width="220px" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="240px" className="rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">
            My Certificates & Course Progress
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            Track your course completion rate, claim accredited certificates, and verify your credentials.
          </p>
        </div>
        <Link to="/verify-certificate">
          <Button variant="outline" size="sm" className="font-semibold text-primary">
            🔍 Public Verification Tool
          </Button>
        </Link>
      </div>

      {/* Section 1: Issued Certificates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text">Earned Certificates</span>
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
            {certificates.length} Verified
          </span>
        </div>

        {certificates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <p className="text-sm font-semibold text-text">No certificates claimed yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Complete 80% or more of your enrolled course requirements to earn your official certificate.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-surface to-surface p-6 shadow-sm hover:shadow-md hover:border-amber-500/60 transition-all duration-300 overflow-hidden"
              >
                {/* Decorative Top Gold Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      ID: {cert.certificateNumber}
                    </span>
                    <Badge variant="success" className="text-[11px] font-bold">
                      ★ {cert.grade} ({cert.completionPercentage}%)
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-text mb-1.5 group-hover:text-amber-600 transition-colors">
                    {cert.courseId?.title}
                  </h3>
                  <p className="text-xs text-text-muted mb-4">
                    Batch: <span className="font-semibold text-text">{cert.classId?.batchName}</span> • Issued {formatDate(cert.issueDate)}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3.5 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer text-center"
                  >
                    🎓 View & Print PDF
                  </button>
                  <Link
                    to={`/verify-certificate/${cert.certificateNumber}`}
                    className="rounded-xl border border-border bg-surface hover:bg-background px-3 py-2.5 text-xs font-semibold text-text hover:text-primary transition-colors text-center"
                    title="Public Verification"
                  >
                    🔗
                  </Link>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Section 2: In-Progress Courses & Progress Tracking */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text">Course Completion & Progress</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {enrollments.length} Active Courses
          </span>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm font-semibold text-text">You are not enrolled in any active class</p>
            <Link to="/courses" className="mt-3 inline-block">
              <Button variant="primary" size="sm">Explore Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const classId = enrollment.classId?._id || enrollment.classId
              const progress = progressMap[String(classId)]
              const hasCert = certificates.some((c) => String((c.classId as any)?._id || c.classId) === String(classId))
              const percent = progress?.percentage || 0

              return (
                <div
                  key={enrollment._id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-bold text-text">
                            {enrollment.courseId?.title}
                          </h4>
                          <p className="text-xs text-text-muted">
                            Batch: {enrollment.classId?.batchName || 'Assigned Batch'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-primary">
                            {percent}% Complete
                          </span>
                          <p className="text-[11px] text-text-muted">
                            {progress?.completedItems || 0} of {progress?.totalItems || 0} tasks done
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 w-full rounded-full bg-border/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Task Breakdown */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                        <span>📡 Live Sessions: <strong>{progress?.breakdown.live.attended || 0}/{progress?.breakdown.live.total || 0}</strong></span>
                        <span>•</span>
                        <span>📝 Assignments: <strong>{progress?.breakdown.assignments.submitted || 0}/{progress?.breakdown.assignments.total || 0}</strong></span>
                        <span>•</span>
                        <span>⏱️ Quizzes: <strong>{progress?.breakdown.quizzes.attempted || 0}/{progress?.breakdown.quizzes.total || 0}</strong></span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex items-center gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                      {hasCert ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-3.5 py-2 text-xs font-bold text-success border border-success/20">
                          ✓ Certificate Claimed
                        </span>
                      ) : progress?.isEligibleForCertificate ? (
                        <Button
                          variant="primary"
                          onClick={() => handleClaim(String(classId))}
                          loading={claimingClassId === String(classId)}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold"
                        >
                          🎓 Claim Certificate
                        </Button>
                      ) : (
                        <Link to={`/student/classes/${classId}`}>
                          <Button variant="outline" size="sm">
                            Continue Learning →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
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
