import { useRef } from 'react'
import { toast } from 'react-hot-toast'
import type { Certificate } from '@/types/certificate'
import { formatDate } from '@/utils'

interface CertificateModalProps {
  certificate: Certificate
  open: boolean
  onClose: () => void
}

export function CertificateModal({ certificate, open, onClose }: CertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.certificateNumber}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl)
    toast.success('Verification link copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-surface p-6 shadow-2xl border border-border my-8 animate-in fade-in zoom-in duration-200">
        {/* Actions Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">Certificate of Completion</span>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
              ✓ Verified Credential
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface hover:text-primary transition-colors cursor-pointer"
            >
              🔗 Copy Link
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
            >
              🖨️ Print / Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-text-muted hover:text-text hover:bg-surface flex items-center justify-center cursor-pointer ml-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          ref={printRef}
          className="relative bg-gradient-to-br from-amber-50/40 via-white to-slate-50 p-8 sm:p-12 rounded-xl border-4 border-amber-500/30 text-center shadow-inner overflow-hidden print:m-0 print:p-8 print:border-amber-600"
        >
          {/* Decorative Corner Borders */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-600/50" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-600/50" />
          <div className="absolute bottom-3 left-3 w-12 h-2 border-b-2 border-l-2 border-amber-600/50" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-600/50" />

          {/* EduFlow Logo Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/eduflow_logo.png" alt="EduFlow" className="h-10 w-auto object-contain" />
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">EduFlow</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700 mb-2">
            Certificate of Completion
          </p>
          <div className="w-24 h-0.5 bg-amber-500 mx-auto mb-6" />

          <p className="text-xs text-slate-500 italic mb-2">This is to proudly certify that</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-3 tracking-wide">
            {certificate.studentId?.fullName}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-4 leading-relaxed">
            has successfully completed all academic requirements, live sessions, assignments, and examinations for the course:
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">
            {certificate.courseId?.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 mb-6">
            Batch: {certificate.classId?.batchName} • Grade: <span className="font-bold text-slate-800">{certificate.grade}</span> ({certificate.completionPercentage}% Score)
          </p>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-200 mt-6 text-xs text-slate-600">
            <div className="text-left">
              <p className="font-semibold text-slate-900">Issue Date</p>
              <p className="text-slate-500 text-[11px]">{formatDate(certificate.issueDate)}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500/60 bg-amber-100/40 flex items-center justify-center shadow-xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 text-center leading-tight">
                  VERIFIED<br />SEAL
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">Academic Director</p>
              <p className="text-slate-500 text-[11px]">EduFlow LMS Authority</p>
            </div>
          </div>

          {/* Verification ID Footer */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Certificate ID: <strong className="font-mono text-slate-700">{certificate.certificateNumber}</strong></span>
            <span className="text-[10px]">Verify at: {verificationUrl}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
