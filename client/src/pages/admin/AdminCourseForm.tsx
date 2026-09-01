import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { adminApi } from '@/services/api/admin'
import { getImageUrl } from '@/utils'
import type { AdminCourse, AdminCreateCoursePayload, AdminUpdateCoursePayload } from '@/types/admin'

const COURSE_DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const COURSE_CATEGORIES = [
  { value: 'Programming', label: 'Programming' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Mobile Development', label: 'Mobile Development' },
  { value: 'UI/UX Design', label: 'UI/UX Design' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Cyber Security', label: 'Cyber Security' },
  { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Database', label: 'Database' },
  { value: 'Cloud Computing', label: 'Cloud Computing' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Other', label: 'Other' },
]

const COURSE_DURATION_UNITS = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
  { value: 'year', label: 'Year(s)' },
]

const COURSE_STATUSES = [
  { value: 'published', label: 'Published (Active)' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

type AdminCourseFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  course: AdminCourse | null
}

export function AdminCourseForm({ open, onClose, onSuccess, course }: AdminCourseFormProps) {
  const [loading, setLoading] = useState(false)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    price: '',
    offerPrice: '',
    durationValue: '',
    durationUnit: 'month' as 'day' | 'week' | 'month' | 'year',
    category: 'Programming' as AdminCourse['category'],
    difficulty: 'beginner' as AdminCourse['difficulty'],
    status: 'published' as AdminCourse['status'],
  })

  useEffect(() => {
    if (open) {
      setPosterFile(null)
      if (course) {
        const populateForm = (c: AdminCourse) => {
          setFormData({
            title: c.title || '',
            shortDescription: c.shortDescription || '',
            description: c.description || '',
            price: c.price !== undefined ? String(c.price) : '',
            offerPrice: c.offerPrice !== undefined ? String(c.offerPrice) : '',
            durationValue: c.durationValue !== undefined ? String(c.durationValue) : '',
            durationUnit: c.durationUnit || 'month',
            category: c.category || 'Programming',
            difficulty: c.difficulty || 'beginner',
            status: c.status || 'published',
          })
          const initialPoster = c.thumbnail || c.banner || ''
          setPosterPreview(initialPoster ? getImageUrl(initialPoster) : '')
        }

        populateForm(course)

        if (!course.description && course.slug) {
          adminApi.getCourseBySlug(course.slug).then((res) => {
            if (res?.data) {
              populateForm(res.data)
            }
          }).catch(() => {})
        }
      } else {
        setFormData({
          title: '',
          shortDescription: '',
          description: '',
          price: '',
          offerPrice: '',
          durationValue: '3',
          durationUnit: 'month',
          category: 'Programming',
          difficulty: 'beginner',
          status: 'published',
        })
        setPosterPreview('')
      }
    }
  }, [open, course])


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }
      setPosterFile(file)
      setPosterPreview(URL.createObjectURL(file))
    }
  }

  const handleRemovePoster = async () => {
    setPosterFile(null)
    setPosterPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (course && (course.thumbnail || course.banner)) {
      try {
        await adminApi.deleteCoursePoster(course._id)
        toast.success('Course poster removed')
      } catch {
        // will be cleared upon update
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid course price.')
      return
    }

    const offerPriceNum = formData.offerPrice ? parseFloat(formData.offerPrice) : undefined
    if (offerPriceNum !== undefined && offerPriceNum > priceNum) {
      toast.error('Offer price cannot exceed regular price.')
      return
    }

    const durationVal = parseInt(formData.durationValue, 10)
    if (isNaN(durationVal) || durationVal < 1) {
      toast.error('Please enter a valid course duration.')
      return
    }

    setLoading(true)
    try {
      let uploadedPosterUrl: string | undefined = undefined

      if (posterFile) {
        const uploadRes = await adminApi.uploadCoursePoster(posterFile, course?._id)
        uploadedPosterUrl = uploadRes.posterUrl
      }

      const payload: AdminCreateCoursePayload | AdminUpdateCoursePayload = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        price: priceNum,
        ...(offerPriceNum !== undefined && { offerPrice: offerPriceNum }),
        durationValue: durationVal,
        durationUnit: formData.durationUnit,
        category: formData.category,
        difficulty: formData.difficulty,
        status: formData.status,
      }

      if (uploadedPosterUrl) {
        payload.thumbnail = uploadedPosterUrl
        payload.banner = uploadedPosterUrl
      } else if (!posterPreview) {
        payload.thumbnail = ''
        payload.banner = ''
      }

      if (course) {
        await adminApi.updateCourse(course._id, payload)
        toast.success('Course updated successfully')
      } else {
        await adminApi.createCourse(payload as AdminCreateCoursePayload)
        toast.success('Course created successfully')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save course.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Edit Course' : 'Create Course'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Course Info */}
        <div className="space-y-4">
          <Input
            label="Course Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Master Web Development with Next.js"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as AdminCourse['category'] })}
              options={COURSE_CATEGORIES}
            />
            <Select
              label="Difficulty Level"
              required
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as AdminCourse['difficulty'] })}
              options={COURSE_DIFFICULTIES}
            />
          </div>

          <TextArea
            label="Short Description"
            required
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="A brief 1-2 sentence overview of the course (min 10 characters)..."
            rows={2}
          />

          <TextArea
            label="Full Course Description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed course description covering topics, prerequisites, and learning outcomes..."
            rows={4}
          />
        </div>

        {/* Section 2: Pricing & Duration */}
        <div className="rounded-xl border border-border/80 bg-slate-50/50 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Pricing & Duration</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Regular Price (৳)"
              type="number"
              required
              min={0}
              step="any"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Offer Price (৳) (Optional)"
              type="number"
              min={0}
              step="any"
              value={formData.offerPrice}
              onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
              placeholder="Optional discount price"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Duration Value"
              type="number"
              required
              min={1}
              value={formData.durationValue}
              onChange={(e) => setFormData({ ...formData, durationValue: e.target.value })}
              placeholder="e.g. 3"
            />
            <Select
              label="Duration Unit"
              required
              value={formData.durationUnit}
              onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as AdminCourse['durationUnit'] })}
              options={COURSE_DURATION_UNITS}
            />
          </div>
        </div>

        {/* Section 3: Course Poster (Upload / Change / Delete) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Course Poster / Thumbnail</label>
            {posterPreview && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                ✓ Poster Attached
              </span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />

          {posterPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-slate-900 shadow-sm group max-h-56">
              <img
                src={posterPreview}
                alt="Course Poster Preview"
                className="w-full h-48 sm:h-52 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="shadow-md"
                >
                  Change Poster
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemovePoster}
                  className="shadow-md"
                >
                  Delete Poster
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-text">Click to upload course poster</p>
                <p className="text-[11px] text-text-muted mt-0.5">PNG, JPG, WEBP or GIF (Max 10MB, Recommended 16:9 ratio)</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Publishing Status */}
        <div className="space-y-4">
          <Select
            label="Publication Status"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AdminCourse['status'] })}
            options={COURSE_STATUSES}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {course ? 'Update' : 'Create'} Course
          </Button>
        </div>
      </form>
    </Modal>
  )
}


