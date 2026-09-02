import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone'

import { teacherApi } from '@/services/api/teacher'
import type { TeacherAssignment, TeacherClass, CreateAssignmentPayload, UpdateAssignmentPayload } from '@/types/teacher'

type TeacherAssignmentFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignment: TeacherAssignment | null
  defaultClassId?: string
  defaultCourseId?: string
}

export function TeacherAssignmentForm({
  open,
  onClose,
  onSuccess,
  assignment,
  defaultClassId,
  defaultCourseId,
}: TeacherAssignmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [formData, setFormData] = useState({
    courseId: defaultCourseId || '',
    classId: defaultClassId || '',
    title: '',
    description: '',
    instructions: '',
    attachmentUrl: '',
    dueDate: '',
    totalMarks: 100,
    status: 'draft' as 'draft' | 'published' | 'closed',
  })

  useEffect(() => {
    if (open) {
      loadClasses()
      if (assignment) {
        setFormData({
          courseId: assignment.courseId?._id || defaultCourseId || '',
          classId: assignment.classId?._id || defaultClassId || '',
          title: assignment.title || '',
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          attachmentUrl: assignment.attachmentUrl || '',
          dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
          totalMarks: assignment.totalMarks || 100,
          status: assignment.status || 'draft',
        })
      } else {
        setFormData({
          courseId: defaultCourseId || '',
          classId: defaultClassId || '',
          title: '',
          description: '',
          instructions: '',
          attachmentUrl: '',
          dueDate: '',
          totalMarks: 100,
          status: 'draft',
        })
      }
    }
  }, [open, assignment, defaultClassId, defaultCourseId])


  const loadClasses = async () => {
    try {
      const result = await teacherApi.getClasses({ limit: 100 })
      setClasses(result.data || [])
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: CreateAssignmentPayload | UpdateAssignmentPayload = {
        courseId: formData.courseId,
        classId: formData.classId,
        title: formData.title,
        description: formData.description || undefined,
        instructions: formData.instructions || undefined,
        attachmentUrl: formData.attachmentUrl || undefined,
        dueDate: new Date(formData.dueDate).toISOString(),
        totalMarks: formData.totalMarks,
        status: formData.status,
      }

      if (assignment) {
        await teacherApi.updateAssignment(assignment._id, payload)
        toast.success('Assignment updated successfully')
      } else {
        await teacherApi.createAssignment(payload as CreateAssignmentPayload)
        toast.success('Assignment created successfully')
      }
      onSuccess()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save assignment.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={assignment ? 'Edit Assignment' : 'Create Assignment'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Course"
          required
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          options={classes.map((c) => ({ value: c.courseId?._id || '', label: c.courseId?.title || 'Unknown' }))}
          placeholder="Select course"
        />
        <Select
          label="Class"
          required
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          options={classes.map((c) => ({ value: c._id, label: `${c.batchName} (${c.courseId?.title || 'Course'})` }))}
          placeholder="Select class"
        />
        <Input
          label="Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Assignment title"
          maxLength={200}
        />
        <TextArea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Assignment description"
          rows={3}
        />
        <TextArea
          label="Instructions"
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Instructions for students"
          rows={3}
        />
        <div className="space-y-2">
          <FileUploadDropzone
            label="Upload Assignment Document / Questions (Drag & Drop)"
            hint="Upload PDF, Doc, or Zip up to 25MB"
            folder="eduflow/assignments"
            value={formData.attachmentUrl}
            onChange={(url) => setFormData({ ...formData, attachmentUrl: url })}
            onRemove={() => setFormData({ ...formData, attachmentUrl: '' })}
          />
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Or Enter Attachment URL
            </label>
            <Input
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              placeholder="https://example.com/file.pdf"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="datetime-local"
            required
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <Input
            label="Total Marks"
            type="number"
            required
            min={1}
            value={formData.totalMarks.toString()}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })}
          />
        </div>
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'closed' })}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
            {assignment ? 'Update' : 'Create'} Assignment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
