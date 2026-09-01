import { Card, Badge } from '@/components'
import { ClockIcon, UsersIcon, MonitorIcon } from '@/components/ui/icons'

export interface SectionInfo {
  _id?: string
  name: string
  capacity: number
  currentStudents: number
  status: string
}

export interface ClassInfo {
  _id: string
  batchName: string
  startDate: string
  endDate: string
  teacherId: {
    _id: string
    fullName: string
    email: string
  }
  sections: SectionInfo[]
  startTime: string
  endTime: string
  classDays: string[]
}

export interface SectionOption {
  classId: ClassInfo
  section: SectionInfo
  availableSeats: number
  isFull: boolean
}

interface SectionSelectorProps {
  sections: SectionOption[]
  selectedSection?: SectionOption | null
  onSelect?: (section: SectionOption) => void
  disabled?: boolean
}

function formatTime(time: string) {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SectionSelector(props: SectionSelectorProps) {
  const { sections } = props

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center">
        <MonitorIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-text">No sections available</p>
        <p className="mt-1 text-xs text-text-muted">There are no upcoming sections for this course at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs font-medium text-primary">
          Available Sections
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          Your section will be assigned automatically after enrollment based on availability.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((option) => {
          const cls = option.classId
          const section = option.section

          return (
            <Card
              key={`${cls._id}-${section.name}`}
              variant="bordered"
              className={`transition-all duration-150 ${
                option.isFull
                  ? 'border-border bg-background opacity-60'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">Section {section.name}</p>
                    <p className="text-xs text-text-muted">{cls.batchName}</p>
                  </div>
                  {option.isFull ? (
                    <Badge variant="error">Full</Badge>
                  ) : (
                    <Badge variant="success">Available</Badge>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-xs text-text-muted">
                  <p className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {cls.teacherId?.fullName || 'TBD'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                  </p>
                  <p>
                    {cls.classDays?.map((day) => day.slice(0, 3)).join(', ') || 'Schedule TBD'}
                  </p>
                  <p>
                    {formatDate(cls.startDate)} – {formatDate(cls.endDate)}
                  </p>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Seats</span>
                    <span>{section.currentStudents}/{section.capacity}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-border">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        option.isFull ? 'bg-error' : option.availableSeats <= 3 ? 'bg-accent' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((section.currentStudents / section.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {option.availableSeats} available
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
