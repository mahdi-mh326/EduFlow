import { useEffect, useId, useRef } from 'react'
import { XIcon } from './icons'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: Size
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        className={`relative flex max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden ${sizeClasses[size]} rounded-xl bg-surface shadow-lg`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4 shrink-0">
            <h3 id={titleId} className="text-base font-semibold text-text sm:text-lg">{title}</h3>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-background hover:text-text transition-colors duration-150"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-4">{children}</div>
      </div>
    </div>
  )
}
