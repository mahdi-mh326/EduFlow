import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button, Container, Input } from '@/components'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth.store'
import { getApiErrorMessage } from '@/utils/apiError'

export function SetPassword() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Your new password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('The new password and confirmation do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.setPassword({ currentPassword, newPassword })
      const updatedUser = user ? { ...user, mustChangePassword: false } : null
      if (updatedUser) setUser(updatedUser)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password set successfully!')

      if (updatedUser?.role === 'teacher') {
        navigate('/teacher/profile?onboarding=true', { replace: true })
      } else if (updatedUser?.role === 'student') {
        navigate('/student/dashboard', { replace: true })
      } else if (updatedUser?.role === 'admin' || updatedUser?.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {

      toast.error(getApiErrorMessage(error, 'Unable to update your password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-text">Set a new password</h1>
        <p className="mt-2 text-sm text-text-muted">For security, update the temporary password before continuing.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
          <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
          <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>Update Password</Button>
        </form>
      </div>
    </Container>
  )
}
