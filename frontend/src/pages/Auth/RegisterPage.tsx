import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }

    const res = await register({
      name,
      email,
      phone,
      password,
    })

    if (res.success) {
      navigate('/', { replace: true })
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
          <h1 className="text-2xl font-black text-gray-900">Create Customer Account</h1>
          <p className="text-gray-500 text-xs">Join thousands of happy shoppers across Bangladesh</p>
        </div>

        {(error || formError) && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {formError || error}
          </div>
        )}

        {/* Public Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Tanvir Rahman"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. tanvir@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number *"
            type="tel"
            placeholder="e.g. +880 1700 000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Password *"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password *"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full font-bold py-3">
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs text-gray-500 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
