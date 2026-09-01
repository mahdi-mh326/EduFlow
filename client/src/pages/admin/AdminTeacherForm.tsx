import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PhoneInput } from '@/components'
import { adminApi } from '@/services/api/admin'
import type { AdminTeacher } from '@/types/admin'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

type AdminTeacherFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teacher: AdminTeacher | null
}

export function AdminTeacherForm({ open, onClose, onSuccess, teacher }: AdminTeacherFormProps) {
  const [loading, setLoading] = useState(false)
  const [countryCode, setCountryCode] = useState('+880')
  const [localPhone, setLocalPhone] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: 'male' as 'male' | 'female' | 'other',
    avatar: '',
    designation: '',
    qualification: '',
  })

  useEffect(() => {
    if (open) {
      if (teacher) {
        const phoneNumber = teacher.phone || ''
        let parsedCountryCode = '+880'
        let parsedLocalPhone = phoneNumber

        if (phoneNumber.startsWith('+')) {
          const match = phoneNumber.match(/^(\+\d{1,4})(\d+)$/)
          if (match) {
            parsedCountryCode = match[1]
            parsedLocalPhone = match[2]
          }
        }

        setCountryCode(parsedCountryCode)
        setLocalPhone(parsedLocalPhone)
        setFormData({
          fullName: teacher.fullName || '',
          email: teacher.email || '',
          gender: teacher.gender || 'male',
          avatar: teacher.avatar || '',
          designation: teacher.teacherProfile?.designation || '',
          qualification: teacher.teacherProfile?.qualification || '',
        })
      } else {
        setCountryCode('+880')
        setLocalPhone('')
        setFormData({
          fullName: '',
          email: '',
          gender: 'male',
          avatar: '',
          designation: '',
          qualification: '',
        })
      }
    }
  }, [open, teacher])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedLocalPhone = localPhone.trim().replace(/^0+/, '')
    if (!cleanedLocalPhone || cleanedLocalPhone.length < 6) {
      toast.error('Please enter a valid phone number')
      return
    }
    const formattedPhone = `${countryCode}${cleanedLocalPhone}`

    setLoading(true)
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        gender: formData.gender,
        designation: formData.designation.trim(),
        qualification: formData.qualification.trim(),
      }

      if (formData.avatar && formData.avatar.trim()) {
        payload.avatar = formData.avatar.trim()
      }

      if (teacher) {
        await adminApi.updateTeacher(teacher._id, payload)
        toast.success('Teacher updated successfully')
      } else {
        await adminApi.createTeacher(payload)
        toast.success('Teacher created successfully')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save teacher.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={teacher ? 'Edit Teacher' : 'Add Teacher'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Enter full name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="teacher@example.com"
        />
        <PhoneInput
          label="Phone"
          required
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          value={localPhone}
          onChange={setLocalPhone}
          placeholder="01XXXXXXXXX"
        />
        <Select
          label="Gender"
          required
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
          options={GENDERS}
        />
        <Input
          label="Avatar URL (Optional)"
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          placeholder="https://example.com/avatar.jpg"
        />
        <Input
          label="Designation"
          required
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          placeholder="e.g. Senior Lecturer"
        />
        <Input
          label="Qualification"
          required
          value={formData.qualification}
          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
          placeholder="e.g. M.Sc. in Computer Science"
        />

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {teacher ? 'Update' : 'Create'} Teacher
          </Button>
        </div>
      </form>
    </Modal>
  )
}

