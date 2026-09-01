import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Badge, Skeleton, ErrorState, Container, PhoneInput } from '@/components'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth.store'
import { getAvatarUrl } from '@/utils'
import { CameraIcon } from '@/components/ui/icons'

export function AdminProfile() {
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
    isMasterAdmin?: boolean
    dateOfBirth?: string
    avatar?: string
  } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

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
        isMasterAdmin: data.isMasterAdmin || (data as any)?.user?.isMasterAdmin || false,
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
      setUser(updated)
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
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update profile. Please try again.'
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


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to change password.'
      toast.error(message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="py-8 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Container>
    )
  }

  if (error || !profile) {
    return (
      <Container>
        <div className="py-8 max-w-4xl mx-auto">
          <ErrorState
            title="Could not load profile"
            message={error || 'Profile information is unavailable.'}
            onRetry={loadProfile}
          />
        </div>
      </Container>
    )
  }


  const initials =
    profile.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AD'

  return (
    <Container>
      <div className="py-8 max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-slate-900 text-2xl font-bold text-white shadow-xs">
                {profile.avatar ? (
                  <img src={getAvatarUrl(profile.avatar)} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
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
              <div>
                <h1 className="text-xl font-bold text-text">{profile.fullName}</h1>
                <p className="text-xs text-text-muted">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={profile.isVerified ? 'success' : 'warning'}>
                    {profile.isVerified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                  {profile.isMasterAdmin ? (
                    <Badge variant="primary" className="bg-purple-100 text-purple-800 border-purple-200">
                      Master Admin
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-slate-100 text-slate-700">
                      General Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>


            {/* Profile Details Form */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text">Account Information</h2>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-3.5 py-2 text-xs font-medium text-text">
                      {profile.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Email Address</label>
                  <p className="rounded-xl border border-border/70 bg-slate-50 px-3.5 py-2 text-xs font-medium text-text-muted">
                    {profile.email} (Non-editable)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Phone Number</label>
                  {isEditing ? (
                    <PhoneInput
                      countryCode={countryCode}
                      onCountryCodeChange={setCountryCode}
                      value={localPhone}
                      onChange={setLocalPhone}
                    />
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-3.5 py-2 text-xs font-medium text-text">
                      {profile.phone || 'Not provided'}
                    </p>
                  )}
                </div>


                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Gender</label>
                  {isEditing ? (
                    <select
                      value={profile.gender || ''}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-3.5 py-2 text-xs font-medium text-text capitalize">
                      {profile.gender || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                    </input>
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-3.5 py-2 text-xs font-medium text-text">
                      {profile.dateOfBirth || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>
        </div>



        {/* Change Password Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-base font-bold text-text mb-1">Security & Password</h2>
          <p className="text-xs text-text-muted mb-5">
            Ensure your account is protected with a secure, unique password.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button type="submit" variant="primary" size="md" loading={changingPassword}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </Container>
  )
}
