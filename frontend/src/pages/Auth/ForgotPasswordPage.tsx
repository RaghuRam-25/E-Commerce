import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const ForgotPasswordPage: React.FC = () => {
  const { users } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanEmail = email.toLowerCase().trim()
    const targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail)

    if (!targetUser) {
      setErrorMsg('No registered account found with this email address.')
      return
    }

    // Generate simulated token
    const token = 'RESET-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setSubmittedEmail(cleanEmail)
    setResetToken(token)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 text-white font-black text-2xl rounded-xl mx-auto flex items-center justify-center shadow-md">
            BD
          </div>
          <h1 className="text-2xl font-black text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-xs">
            Enter your registered email address to receive password reset instructions
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {submittedEmail && resetToken ? (
          <div className="space-y-4 text-center bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Reset Code Generated</h3>
              <p className="text-xs text-gray-600 mt-1">
                Password reset code for <strong className="text-gray-900">{submittedEmail}</strong>:
              </p>
              <div className="my-3 font-mono text-lg font-black text-emerald-800 bg-white py-2 px-4 rounded-xl border border-emerald-300 inline-block shadow-sm">
                {resetToken}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full font-bold"
              onClick={() =>
                navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}&token=${resetToken}`)
              }
            >
              Proceed to Set New Password →
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email Address *"
              type="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold py-3">
              Send Password Reset Code
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Remembered your password?{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
