import { useRef } from 'react'
import { toast } from 'react-hot-toast'
import type { Certificate } from '@/types/certificate'
import { formatDate } from '@/utils'
import {
  GraduationCapIcon,
  CopyIcon,
  LinkIcon,
  PrinterIcon,
  XIcon,
  StarIcon,
} from '@/components/ui/icons'

interface CertificateModalProps {
  certificate: Certificate
  open: boolean
  onClose: () => void
}

export function CertificateModal({ certificate, open, onClose }: CertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.certificateNumber}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(verificationUrl)}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl)
    toast.success('Verification link copied to clipboard!')
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificate.certificateNumber)
    toast.success('Certificate ID copied!')
  }

  const isDistinction = certificate.grade === 'Distinction' || (certificate.completionPercentage && certificate.completionPercentage >= 90)
  const isMerit = certificate.grade === 'Merit' || (certificate.completionPercentage && certificate.completionPercentage >= 80)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Embedded Print CSS to force landscape A4 without browser headers */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              background: #fff !important;
              color: #000 !important;
            }
            body * {
              visibility: hidden;
            }
            #certificate-print-root, #certificate-print-root * {
              visibility: visible;
            }
            #certificate-print-root {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 1.5rem !important;
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .certificate-no-print {
              display: none !important;
            }
          }
        `
      }} />

      <div className="relative w-full max-w-5xl rounded-3xl bg-surface p-4 sm:p-6 shadow-2xl border border-border my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="certificate-no-print flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <GraduationCapIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Official Certificate of Achievement</h3>
              <p className="text-[11px] text-text-muted">Accredited and publicly verifiable credential</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-background hover:text-primary transition-all cursor-pointer shadow-2xs"
              title="Copy unique Certificate ID"
            >
              <CopyIcon className="h-3.5 w-3.5" /> Copy ID
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-background hover:text-primary transition-all cursor-pointer shadow-2xs"
            >
              <LinkIcon className="h-3.5 w-3.5" /> Copy Link
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
            >
              <PrinterIcon className="h-3.5 w-3.5" /> Print / Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-text-muted hover:text-text hover:bg-background flex items-center justify-center cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div id="certificate-print-root" className="w-full overflow-x-auto pb-2">
          <div
            ref={printRef}
            className="relative min-w-[760px] w-full bg-[#fdfbf7] p-8 sm:p-12 rounded-2xl border-[10px] border-[#0c1f38] text-center shadow-xl overflow-hidden select-text text-slate-800"
            style={{
              backgroundImage: `radial-gradient(#c59b27 0.65px, transparent 0.65px), radial-gradient(#0c1f38 0.65px, #fdfbf7 0.65px)`,
              backgroundSize: '26px 26px',
              backgroundPosition: '0 0, 13px 13px',
              backgroundBlendMode: 'multiply',
            }}
          >
            {/* Inner Gold Filigree Inset Frame */}
            <div className="absolute inset-3 border-2 border-[#c59b27] pointer-events-none rounded-xl" />
            <div className="absolute inset-4 border border-[#c59b27]/40 pointer-events-none rounded-lg" />

            {/* Corner Ornaments */}
            {/* Top-Left */}
            <div className="absolute top-5 left-5 w-12 h-12 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#c59b27] fill-current opacity-90">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z M30,30 L70,30 L70,40 L40,40 L40,70 L30,70 Z" />
              </svg>
            </div>
            {/* Top-Right */}
            <div className="absolute top-5 right-5 w-12 h-12 pointer-events-none rotate-90">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#c59b27] fill-current opacity-90">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z M30,30 L70,30 L70,40 L40,40 L40,70 L30,70 Z" />
              </svg>
            </div>
            {/* Bottom-Left */}
            <div className="absolute bottom-5 left-5 w-12 h-12 pointer-events-none -rotate-90">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#c59b27] fill-current opacity-90">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z M30,30 L70,30 L70,40 L40,40 L40,70 L30,70 Z" />
              </svg>
            </div>
            {/* Bottom-Right */}
            <div className="absolute bottom-5 right-5 w-12 h-12 pointer-events-none rotate-180">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#c59b27] fill-current opacity-90">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z M30,30 L70,30 L70,40 L40,40 L40,70 L30,70 Z" />
              </svg>
            </div>

            {/* Institution Header */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-2">
              <div className="flex items-center gap-3 mb-1">
                <img src="/eduflow_logo.png" alt="EduFlow" className="h-11 w-auto object-contain drop-shadow-xs" />
                <span className="text-2xl sm:text-3xl font-black text-[#0c1f38] tracking-tight font-sans">
                  EduFlow <span className="text-[#c59b27] font-serif font-normal">Academy</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-[#735118]">
                Center for Academic Excellence & Professional Development
              </p>
            </div>

            {/* Certificate Title */}
            <div className="relative z-10 mt-6 mb-4">
              <div className="inline-flex items-center gap-3">
                <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#c59b27]" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-[0.18em] text-[#0c1f38] uppercase drop-shadow-xs">
                  Certificate of Achievement
                </h1>
                <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#c59b27]" />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-serif italic text-slate-600">
                This prestigious credential is intentionally and proudly conferred upon
              </p>
            </div>

            {/* Recipient Full Name */}
            <div className="relative z-10 my-4 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#0c1f38] tracking-wide capitalize drop-shadow-xs">
                {certificate.studentId?.fullName || 'Distinguished Student'}
              </h2>
              {/* Ornate Name Underline */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-[1.5px] w-24 sm:w-36 bg-[#c59b27]" />
                <div className="w-2.5 h-2.5 rotate-45 border-2 border-[#c59b27] bg-[#fdfbf7]" />
                <div className="h-[1.5px] w-24 sm:w-36 bg-[#c59b27]" />
              </div>
            </div>

            {/* Conformance Description */}
            <p className="relative z-10 text-xs sm:text-sm text-slate-700 max-w-2xl mx-auto mt-3 leading-relaxed font-sans">
              for successfully fulfilling all academic standards, actively participating in live interactive lectures, completing hands-on assignments, and demonstrating outstanding proficiency in the specialized course:
            </p>

            {/* Course Title & Batch Badge */}
            <div className="relative z-10 my-5 py-3 px-6 bg-gradient-to-r from-[#0c1f38]/5 via-[#c59b27]/10 to-[#0c1f38]/5 rounded-xl border border-[#c59b27]/30 max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-black text-[#0c1f38] font-sans tracking-tight">
                {certificate.courseId?.title}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs font-semibold text-slate-700">
                <span>Cohort: <strong>{certificate.classId?.batchName}</strong></span>
                <span>•</span>
                <span>Category: <strong>{certificate.courseId?.category || 'Professional Studies'}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[#b45309] font-bold">
                  <StarIcon className="h-3.5 w-3.5 fill-current" /> {isDistinction ? 'Graduated with Distinction' : isMerit ? 'Graduated with Merit' : 'Graduated with Honor'} ({certificate.completionPercentage}% Score)
                </span>
              </div>
            </div>

            {/* Authentication & Signatures Grid */}
            <div className="relative z-10 grid grid-cols-3 items-end pt-6 mt-6 border-t border-[#c59b27]/40 text-xs">
              {/* Left Column: Issuance Date */}
              <div className="text-left pl-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#735118]">Date of Conformance</p>
                <p className="font-serif font-bold text-slate-900 text-sm mt-0.5">
                  {formatDate(certificate.issueDate)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Registry Ref: {certificate.certificateNumber.slice(-8)}
                </p>
              </div>

              {/* Center Column: Golden Rosette Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex flex-col items-center">
                  {/* Golden Medallion Badge */}
                  <div className="relative w-20 h-20 rounded-full border-4 border-[#c59b27] bg-gradient-to-br from-[#fbf5b7] via-[#d4af37] to-[#aa771c] p-1 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-dashed border-[#735118]/80 flex flex-col items-center justify-center text-center p-1 bg-gradient-to-br from-[#d4af37] to-[#8c6214] text-white">
                      <div className="flex items-center justify-center gap-0.5 text-amber-200">
                        <StarIcon className="h-2 w-2 fill-current" />
                        <StarIcon className="h-2 w-2 fill-current" />
                        <StarIcon className="h-2 w-2 fill-current" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5">
                        EDUFLOW
                      </span>
                      <span className="text-[7px] font-bold uppercase tracking-widest text-amber-200 leading-none mt-0.5">
                        SEAL
                      </span>
                      <span className="text-[6px] text-amber-100/90 tracking-tighter mt-0.5">VERIFIED</span>
                    </div>
                  </div>
                  {/* Silk Ribbon Tails */}
                  <div className="flex gap-2 -mt-2 pointer-events-none">
                    <div className="w-3.5 h-6 bg-[#8c6214] shadow-xs transform -rotate-12 rounded-b-xs" />
                    <div className="w-3.5 h-6 bg-[#8c6214] shadow-xs transform rotate-12 rounded-b-xs" />
                  </div>
                </div>
              </div>

              {/* Right Column: Academic Authority Signature */}
              <div className="text-right pr-2">
                {/* Stylized Digital Signature */}
                <div className="font-serif italic text-lg sm:text-xl text-[#0c1f38] font-bold tracking-wider -mb-1 select-none">
                  K. Mahdi
                </div>
                <div className="h-[1px] w-32 ml-auto bg-slate-400 mb-1" />
                <p className="font-bold text-slate-900 text-xs">Director of Academic Affairs</p>
                <p className="text-[10px] text-slate-500">EduFlow Global Certification Board</p>
              </div>
            </div>

            {/* Bottom Verification Strip */}
            <div className="relative z-10 mt-7 pt-4 border-t border-dashed border-[#c59b27]/40 flex flex-col sm:flex-row items-center justify-between text-left text-[11px] text-slate-500 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Verification"
                  className="h-11 w-11 rounded-lg border border-border bg-white p-0.5 shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-xs tracking-wider">
                      ID: {certificate.certificateNumber}
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Scan QR or verify at: <span className="text-primary font-medium">{verificationUrl}</span>
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 sm:max-w-xs">
                This accredited digital credential confirms the holder completed all mandatory coursework on EduFlow LMS.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
