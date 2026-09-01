import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { adminApi } from '@/services/api/admin'
import type { AdminClass, AdminCreateClassPayload, AdminUpdateClassPayload } from '@/types/admin'

const CLASS_DAYS = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
]

const CLASS_STATUSES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type AdminClassFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classData: AdminClass | null
  courses: Array<{ _id: string; title: string }>
  teachers: Array<{ _id: string; fullName: string }>
}

export function AdminClassForm({ open, onClose, onSuccess, classData, courses, teachers }: AdminClassFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    batchName: '',
    startDate: '',
    endDate: '',
    classDays: [] as string[],
    startTime: '',
    endTime: '',
    status: 'upcoming' as AdminClass['status'],
  })

  useEffect(() => {
    if (open) {
      if (classData) {
        setFormData({
          courseId: classData.courseId?._id || '',
          teacherId: classData.teacherId?._id || '',
          batchName: classData.batchName || '',
          startDate: classData.startDate ? new Date(classData.startDate).toISOString().slice(0, 10) : '',
          endDate: classData.endDate ? new Date(classData.endDate).toISOString().slice(0, 10) : '',
          classDays: classData.classDays || [],
          startTime: classData.startTime || '',
          endTime: classData.endTime || '',
          status: classData.status || 'upcoming',
        })
      } else {
        setFormData({
          courseId: '',
          teacherId: '',
          batchName: '',
          startDate: '',
          endDate: '',
          classDays: [],
          startTime: '',
          endTime: '',
          status: 'upcoming',
        })
      }
    }
  }, [open, classData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: AdminCreateClassPayload | AdminUpdateClassPayload = {
        courseId: formData.courseId,
        teacherId: formData.teacherId,
        batchName: formData.batchName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        classDays: formData.classDays,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
      }

      if (classData) {
        await adminApi.updateClass(classData._id, payload)
        toast.success('Class updated successfully')
      } else {
        await adminApi.createClass(payload as AdminCreateClassPayload)
        toast.success('Class created successfully')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save class.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      classDays: formData.classDays.includes(day)
        ? formData.classDays.filter((d) => d !== day)
        : [...formData.classDays, day],
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={classData ? 'Edit Class' : 'Create Class'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Course"
          required
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          options={courses.map((c) => ({ value: c._id, label: c.title }))}
          placeholder="Select a course"
        />
        <Select
          label="Teacher"
          required
          value={formData.teacherId}
          onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
          options={teachers.map((t) => ({ value: t._id, label: t.fullName }))}
          placeholder="Select a teacher"
        />
        <Input
          label="Batch Name"
          required
          value={formData.batchName}
          onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
          placeholder="e.g. Batch 2024-A"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start Time"
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
          <Input
            label="End Time"
            type="time"
            required
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Class Days</label>
          <div className="flex flex-wrap gap-2">
            {CLASS_DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  formData.classDays.includes(day.value)
                    ? 'bg-primary text-white'
                    : 'bg-background text-text hover:bg-background/80'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as AdminClass['status'] })}
          options={CLASS_STATUSES}
        />
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {classData ? 'Update' : 'Create'} Class
          </Button>
        </div>
      </form>
    </Modal>
  )
}
