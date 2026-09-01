import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { teacherApi } from '@/services/api/teacher'
import type { TeacherQuiz, TeacherClass, CreateQuizPayload, UpdateQuizPayload } from '@/types/teacher'

type TeacherQuizFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  quiz: TeacherQuiz | null
  defaultClassId?: string
  defaultCourseId?: string
}

export function TeacherQuizForm({
  open,
  onClose,
  onSuccess,
  quiz,
  defaultClassId,
  defaultCourseId,
}: TeacherQuizFormProps) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [formData, setFormData] = useState({
    courseId: defaultCourseId || '',
    classId: defaultClassId || '',
    title: '',
    description: '',
    instructions: '',
    durationMinutes: 30,
    totalMarks: 100,
    passingMarks: 50,
    startDate: '',
    endDate: '',
    attemptLimit: 1,
    status: 'draft' as 'draft' | 'published' | 'closed',
  })

  useEffect(() => {
    if (open) {
      loadClasses()
      if (quiz) {
        setFormData({
          courseId: quiz.courseId?._id || defaultCourseId || '',
          classId: quiz.classId?._id || defaultClassId || '',
          title: quiz.title || '',
          description: quiz.description || '',
          instructions: quiz.instructions || '',
          durationMinutes: quiz.durationMinutes || 30,
          totalMarks: quiz.totalMarks || 100,
          passingMarks: quiz.passingMarks || 50,
          startDate: quiz.startDate ? new Date(quiz.startDate).toISOString().slice(0, 16) : '',
          endDate: quiz.endDate ? new Date(quiz.endDate).toISOString().slice(0, 16) : '',
          attemptLimit: quiz.attemptLimit || 1,
          status: quiz.status || 'draft',
        })
      } else {
        setFormData({
          courseId: defaultCourseId || '',
          classId: defaultClassId || '',
          title: '',
          description: '',
          instructions: '',
          durationMinutes: 30,
          totalMarks: 100,
          passingMarks: 50,
          startDate: '',
          endDate: '',
          attemptLimit: 1,
          status: 'draft',
        })
      }
    }
  }, [open, quiz, defaultClassId, defaultCourseId])


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
      const payload: CreateQuizPayload | UpdateQuizPayload = {
        courseId: formData.courseId,
        classId: formData.classId,
        title: formData.title,
        description: formData.description || undefined,
        instructions: formData.instructions || undefined,
        durationMinutes: formData.durationMinutes,
        totalMarks: formData.totalMarks,
        passingMarks: formData.passingMarks,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        attemptLimit: formData.attemptLimit,
        status: formData.status,
      }

      if (quiz) {
        await teacherApi.updateQuiz(quiz._id, payload)
        toast.success('Quiz updated successfully')
      } else {
        await teacherApi.createQuiz(payload as CreateQuizPayload)
        toast.success('Quiz created successfully')
      }
      onSuccess()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save quiz.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={quiz ? 'Edit Quiz' : 'Create Quiz'} size="lg">
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
          placeholder="Quiz title"
          maxLength={200}
        />
        <TextArea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Quiz description"
          rows={3}
        />
        <TextArea
          label="Instructions"
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Instructions for students"
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Duration (min)"
            type="number"
            required
            min={1}
            value={formData.durationMinutes.toString()}
            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Total Marks"
            type="number"
            required
            min={1}
            value={formData.totalMarks.toString()}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Passing Marks"
            type="number"
            required
            min={0}
            value={formData.passingMarks.toString()}
            onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Attempt Limit"
            type="number"
            required
            min={1}
            max={10}
            value={formData.attemptLimit.toString()}
            onChange={(e) => setFormData({ ...formData, attemptLimit: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="datetime-local"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="datetime-local"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
            {quiz ? 'Update' : 'Create'} Quiz
          </Button>
        </div>
      </form>
    </Modal>
  )
}
