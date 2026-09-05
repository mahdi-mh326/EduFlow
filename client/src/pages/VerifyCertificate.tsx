import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Container, Button, Skeleton } from '@/components'
import { AwardIcon, XCircleIcon } from '@/components/ui/icons'
import { certificateApi } from '@/services/api/certificate'
import type { CertificateVerificationResult } from '@/types/certificate'
import { formatDate } from '@/utils'

export function VerifyCertificate() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>()
  const [queryId, setQueryId] = useState(certificateNumber || '')
  const [result, setResult] = useState<CertificateVerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = async (idToVerify: string) => {
    if (!idToVerify.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await certificateApi.verifyCertificate(idToVerify.trim())
      setResult(data)
    } catch (err: any) {
      setResult(null)
      setError(err?.response?.data?.message || 'Certificate not found or invalid certificate identifier.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (certificateNumber) {
      verify(certificateNumber)
    }
  }, [certificateNumber])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    verify(queryId)
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16 bg-background">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <AwardIcon className="h-4 w-4" />
            <span>EduFlow Credential Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
            Verify Certificate Authenticity
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Enter the unique Certificate ID to verify the graduate&apos;s credential and course completion record.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8 flex gap-2">
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="e.g. EDF-2026-A1B2C3D4"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text uppercase tracking-wider font-mono placeholder:normal-case placeholder:font-sans focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
            <Button type="submit" loading={loading}>
              Verify
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-72 mx-auto mb-8" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        )}

        {/* Verified Result Card */}
        {!loading && result && (
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-success/40 bg-surface p-8 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 pb-6 border-b border-border">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text">Official Verified Credential</h3>
                  <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                    Active
                  </span>
                </div>
                <p className="text-xs font-mono text-text-muted">
                  Certificate ID: {result.certificateNumber}
                </p>
              </div>
            </div>

            <div className="py-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <span className="text-text-muted">Recipient Name</span>
                <span className="font-bold text-text text-base">{result.recipient.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <span className="text-text-muted">Course Title</span>
                <span className="font-semibold text-primary">{result.course.title}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <span className="text-text-muted">Batch</span>
                <span className="font-medium text-text">{result.class.batchName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <span className="text-text-muted">Grade / Score</span>
                <span className="font-bold text-success">{result.grade} ({result.completionPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <span className="text-text-muted">Issue Date</span>
                <span className="font-medium text-text">{formatDate(result.issueDate)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-text-muted">Issuing Authority</span>
                <span className="font-semibold text-text">EduFlow LMS Authority</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Link to="/courses" className="text-xs font-semibold text-primary hover:underline">
                Explore More Courses on EduFlow →
              </Link>
            </div>
          </div>
        )}

        {/* Error / Invalid State */}
        {!loading && searched && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-error/30 bg-error/5 p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
              <XCircleIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-text">Invalid or Unverified Certificate</h3>
            <p className="mt-1 text-xs text-text-muted">{error}</p>
          </div>
        )}
      </Container>
    </div>
  )
}
