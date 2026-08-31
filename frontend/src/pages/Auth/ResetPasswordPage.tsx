import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { resetPassword, loading } = useAuth()
  const navigate = useNavigate()

  const defaultEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(defaultEmail)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }

    const res = await resetPassword(email, newPassword)
    if (res.success) {
      setIsSuccess(true)
    } else if (res.error) {
      setFormError(res.error)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 text-white font-black text-2xl rounded-xl mx-auto flex items-center justify-center shadow-md">
            BD
          </div>
          <h1 className="text-2xl font-black text-gray-900">Set New Password</h1>
          <p className="text-gray-500 text-xs">Create a strong new password for your account</p>
        </div>

        {formError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {formError}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Password Reset Complete!</h3>
              <p className="text-xs text-gray-600 mt-1">
                Your password has been updated successfully. You can now sign in using your new credentials.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full font-bold"
              onClick={() => navigate('/login')}
            >
              Go to Sign In →
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="New Password *"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password *"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold py-3">
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Back to{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            Sign In Page
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
