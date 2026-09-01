import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container, PhoneInput } from '@/components'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth.store'
import { getAvatarUrl } from '@/utils'
import {
  UsersIcon,
  CheckCircleIcon,
  CalendarIcon,
  CameraIcon,
} from '@/components/ui/icons'

export function StudentProfile() {
  const { setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [countryCode, setCountryCode] = useState('+880')
  const [localPhone, setLocalPhone] = useState('')
  const [profile, setProfile] = useState<{
    fullName: string
    email: string
    phone: string
    gender?: string
    role: string
    status: string
    isVerified: boolean
    dateOfBirth?: string
    avatar?: string
  } | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.getCurrentUser()
      const phoneNumber = data.phone || ''
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
      setProfile({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: phoneNumber,
        gender: data.gender || '',
        role: data.role || '',
        status: data.status || '',
        isVerified: data.isVerified,
        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).split('T')[0] : '',
        avatar: data.avatar || '',
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load profile. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)
    try {
      const updated = await authApi.updateProfile({
        fullName: profile.fullName,
        phone: `${countryCode}${localPhone}`,
        gender: profile.gender as 'male' | 'female' | 'other' | undefined,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : undefined,
        avatar: profile.avatar,
      })
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              phone: updated.phone,
              gender: updated.gender,
              dateOfBirth: updated.dateOfBirth ? String(updated.dateOfBirth).split('T')[0] : '',
              avatar: updated.avatar,
            }
          : prev
      )
      setUser(updated)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update profile. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const result = await authApi.uploadAvatar(file)
      const newAvatar = result.avatar || (result as any)?.user?.avatar
      const updatedUser = (result as any)?.user || await authApi.getCurrentUser()
      if (updatedUser) {
        setUser({ ...updatedUser, avatar: newAvatar || updatedUser.avatar })
      }
      setProfile((prev) => (prev ? { ...prev, avatar: newAvatar || updatedUser?.avatar } : prev))
      toast.success('Profile picture updated successfully')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to upload avatar. Please try again.'
      toast.error(message)
    } finally {
      setUploadingAvatar(false)
    }
  }



  const mapStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'success' as const }
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const }
      case 'blocked':
        return { label: 'Blocked', variant: 'error' as const }
      default:
        return { label: status, variant: 'default' as const }
    }
  }

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword(passwordForm)
      toast.success('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to change password.'
      toast.error(message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {

    return (
      <Container className="py-8">
        <div className="space-y-2 mb-6">
          <Skeleton variant="text" height="2rem" width="200px" />
          <Skeleton variant="text" height="1rem" width="400px" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" height="0.875rem" width="120px" />
                <Skeleton variant="text" height="1.25rem" width="300px" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error && !profile) {
    return (
      <Container className="py-8">
        <ErrorState title="Unable to load profile" message={error} onRetry={loadProfile} />
      </Container>
    )
  }

  if (!profile) return null

  const statusBadge = mapStatusBadge(profile.status)

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-text-muted">
            View and manage your account information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); loadProfile() }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {profile.avatar ? (
              <img src={getAvatarUrl(profile.avatar)} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">

              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
              {uploadingAvatar ? (
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <CameraIcon className="h-5 w-5 text-white" />
              )}
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-text">{profile.fullName}</h2>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              {profile.isVerified && (
                <Badge variant="success">Verified</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-text-muted capitalize">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Field
            label="Full Name"
            icon={<UsersIcon className="h-4 w-4 text-primary" />}
            value={profile.fullName}
            editable={isEditing}
            onChange={(value) => setProfile((prev) => prev ? { ...prev, fullName: value } : prev)}
          />
          <Field
            label="Email"
            icon={<svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
            value={profile.email}
            editable={false}
          />
          {isEditing ? (
            <PhoneInput
              label="Phone"
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              value={localPhone}
              onChange={setLocalPhone}
              required
            />
          ) : (
            <Field
              label="Phone"
              icon={<svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a12 12 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              value={profile.phone || 'Not provided'}
              editable={false}
            />
          )}
          <Field
            label="Gender"
            icon={<UsersIcon className="h-4 w-4 text-primary" />}
            value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'}
            editable={isEditing}
            type="select"
            onChange={(value) => setProfile((prev) => prev ? { ...prev, gender: value } : prev)}
            selectOptions={[
              { value: '', label: 'Select gender' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Field
            label="Date of Birth"
            icon={<CalendarIcon className="h-4 w-4 text-primary" />}
            value={profile.dateOfBirth || 'Not provided'}
            editable={isEditing}
            type="date"
            onChange={(value) => setProfile((prev) => prev ? { ...prev, dateOfBirth: value } : prev)}
          />
          <Field
            label="Account Status"
            icon={<CheckCircleIcon className="h-4 w-4 text-primary" />}
            value={statusBadge.label}
            editable={false}
            isBadge
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text">Account Security</h3>
            <p className="text-xs text-text-muted mt-0.5">Manage your password and authentication credentials.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            {showPasswordSection ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="mt-6 max-w-md space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 chars)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" loading={changingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Container>
  )
}

function Field({
  label,
  icon,
  value,
  editable,
  onChange,
  type,
  selectOptions,
  isBadge,
  badgeVariant,
}: {
  label: string
  icon: React.ReactNode
  value: string
  editable?: boolean
  onChange?: (value: string) => void
  type?: 'select' | 'date'
  selectOptions?: { value: string; label: string }[]
  isBadge?: boolean
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'neutral'
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        {editable && type === 'select' && selectOptions ? (
          <select
            value={value === 'Not provided' ? '' : value.toLowerCase()}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : editable && type === 'date' ? (
          <input
            type="date"
            value={value === 'Not provided' ? '' : value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        ) : editable ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        ) : isBadge && badgeVariant ? (
          <Badge variant={badgeVariant}>{value}</Badge>
        ) : (
          <p className="text-sm font-medium text-text">{value}</p>
        )}
      </div>
    </div>
  )
}
