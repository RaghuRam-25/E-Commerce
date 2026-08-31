import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const LoginPage: React.FC = () => {
  const { login, loading, error, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const from = location.state?.from?.pathname

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (from) {
        navigate(from, { replace: true })
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate, from])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success && result.user) {
      if (from) {
        navigate(from, { replace: true })
      } else if (result.user.role === 'admin' || result.user.role === 'super_admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 text-white font-black text-2xl rounded-xl mx-auto flex items-center justify-center shadow-md">
            BD
          </div>
          <h1 className="text-2xl font-black text-gray-900">Account Sign In</h1>
          <p className="text-gray-500 text-xs">Enter your email and password to access your account</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password *"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Remember Me
            </label>

            <Link
              to="/forgot-password"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full font-bold py-3">
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Test Demo Fillers */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase text-center tracking-wider">Quick Fill Test Credentials</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('superadmin@bangladeshcommerce.com', 'superadmin123')}
              className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-1.5 px-2 rounded-lg border border-purple-200"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@bangladeshcommerce.com', 'admin123')}
              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-2 rounded-lg border border-blue-200"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ayesha@email.com', 'customer123')}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-2 rounded-lg border border-emerald-200"
            >
              Customer
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center text-xs text-gray-500 pt-2">
          Don't have a customer account?{' '}
          <Link to="/register" className="text-emerald-600 font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
