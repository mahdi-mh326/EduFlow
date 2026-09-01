import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PhoneInput } from '@/components'
import { adminApi } from '@/services/api/admin'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

type AdminAdminFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AdminAdminForm({ open, onClose, onSuccess }: AdminAdminFormProps) {
  const [loading, setLoading] = useState(false)
  const [countryCode, setCountryCode] = useState('+880')
  const [localPhone, setLocalPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setFullName('')
      setEmail('')
      setLocalPhone('')
      setCountryCode('+880')
      setGender('male')
      setErrors({})
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const cleanPhoneDigits = localPhone.replace(/[^\d]/g, '').replace(/^0+/, '')

    if (!trimmedName || trimmedName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters.'
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!cleanPhoneDigits || cleanPhoneDigits.length < 6 || cleanPhoneDigits.length > 14) {
      newErrors.phone = 'Please enter a valid phone number.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const fullPhone = `${countryCode}${cleanPhoneDigits}`

    setLoading(true)
    try {
      await adminApi.createAdmin({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: fullPhone,
        gender,
      })
      toast.success('General Admin created! A welcome email with temporary password has been sent.')
      onSuccess()
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create general admin.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add General Admin" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-text-muted">
          A temporary password will be auto-generated and emailed to the new admin. On first login, they will be required to verify their email, set a new password, and complete their profile.
        </p>

        <Input
          label="Full Name"
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }))
          }}
          error={errors.fullName}
          placeholder="e.g. John Doe"
          autoFocus
        />

        <Input
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
          }}
          error={errors.email}
          placeholder="admin@example.com"
        />

        <PhoneInput
          label="Phone Number"
          required
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          value={localPhone}
          onChange={(val) => {
            setLocalPhone(val)
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
          }}
          error={errors.phone}
          placeholder="01XXXXXXXXX"
        />

        <Select
          label="Gender"
          required
          value={gender}
          onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
          options={GENDERS}
        />

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Create & Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}
