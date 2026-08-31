import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, UserRole, RegisterFormData } from '@/types'
import { apiClient } from '@/services/apiClient'

const INITIAL_USERS_DB: User[] = [
  {
    id: 'usr-super-admin-01',
    name: 'Master Super Admin',
    email: 'superadmin@bangladeshcommerce.com',
    phone: '+880 1700 000000',
    password: 'superadmin123',
    role: 'super_admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-02',
    name: 'Store Manager Admin',
    email: 'admin@bangladeshcommerce.com',
    phone: '+880 1711 111111',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'usr-customer-03',
    name: 'Ayesha Khan',
    email: 'ayesha@email.com',
    phone: '+880 1712 345678',
    password: 'customer123',
    role: 'customer',
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
]

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  users: User[]
  promoteToAdmin: (targetUserId: string) => void
  demoteToCustomer: (targetUserId: string) => void
  toggleUserStatus: (targetUserId: string) => void
  updateProfile: (updatedData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('bd_commerce_users_db')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load users DB:', e)
    }
    return INITIAL_USERS_DB
  })

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('bd_commerce_current_user')
      if (storedUser) return JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to load current user:', e)
    }
    return null
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Verify stored JWT token against backend API on startup
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('bd_commerce_token')
      if (token) {
        try {
          const res = await apiClient.get('/users/me')
          if (res?.success && res?.user) {
            setUser(res.user)
            localStorage.setItem('bd_commerce_current_user', JSON.stringify(res.user))
          }
        } catch (err) {
          console.warn('Backend session expired or unreachable, maintaining local session:', err)
        }
      }
      setLoading(false)
    }
    fetchMe()
  }, [])

  // Persist users DB to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('bd_commerce_users_db', JSON.stringify(users))
    } catch (e) {
      console.error('Failed to save users DB:', e)
    }
  }, [users])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    // Attempt Backend API login first
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      if (res?.success && res?.token) {
        localStorage.setItem('bd_commerce_token', res.token)
        localStorage.setItem('bd_commerce_current_user', JSON.stringify(res.user))
        setUser(res.user)
        setLoading(false)
        return { success: true, user: res.user }
      }
    } catch (apiErr: any) {
      console.warn('Backend API login failed, attempting local fallback:', apiErr.message)
    }

    // Fallback: local user matching if backend is not reachable or returns error
    const targetUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    )

    setLoading(false)

    if (!targetUser) {
      const errMsg = 'Invalid email address or password.'
      setError(errMsg)
      return { success: false, error: errMsg }
    }

    if (targetUser.status === 'inactive') {
      const errMsg = 'Your account has been deactivated. Please contact support.'
      setError(errMsg)
      return { success: false, error: errMsg }
    }

    setUser(targetUser)
    localStorage.setItem('bd_commerce_current_user', JSON.stringify(targetUser))
    return { success: true, user: targetUser }
  }

  const register = async (data: RegisterFormData) => {
    setError(null)
    setLoading(true)

    // Attempt Backend API registration first
    try {
      const res = await apiClient.post('/auth/register', data)
      if (res?.success && res?.token) {
        localStorage.setItem('bd_commerce_token', res.token)
        localStorage.setItem('bd_commerce_current_user', JSON.stringify(res.user))
        setUser(res.user)
        setLoading(false)
        return { success: true }
      }
    } catch (apiErr: any) {
      console.warn('Backend API register failed, attempting local fallback:', apiErr.message)
    }

    // Fallback: local registration
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim())
    if (existing) {
      setLoading(false)
      const errMsg = 'An account with this email address already exists.'
      setError(errMsg)
      return { success: false, error: errMsg }
    }

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      password: data.password,
      role: 'customer',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setUsers((prev) => [...prev, newUser])
    setUser(newUser)
    localStorage.setItem('bd_commerce_current_user', JSON.stringify(newUser))

    setLoading(false)
    return { success: true }
  }

  const resetPassword = async (email: string, newPassword: string) => {
    setError(null)
    setLoading(true)

    try {
      const res = await apiClient.post('/auth/reset-password', { email, newPassword })
      if (res?.success) {
        setLoading(false)
        return { success: true }
      }
    } catch (apiErr: any) {
      console.warn('Backend reset password failed, using local fallback:', apiErr.message)
    }

    const targetUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
    if (!targetUser) {
      setLoading(false)
      const errMsg = 'No registered account found with this email address.'
      setError(errMsg)
      return { success: false, error: errMsg }
    }

    const updatedUser = {
      ...targetUser,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    }

    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)))

    if (user && user.id === targetUser.id) {
      setUser(updatedUser)
      localStorage.setItem('bd_commerce_current_user', JSON.stringify(updatedUser))
    }

    setLoading(false)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bd_commerce_current_user')
    localStorage.removeItem('bd_commerce_token')
  }

  const promoteToAdmin = async (targetUserId: string) => {
    if (!user || user.role !== 'super_admin') {
      alert('Unauthorized: Only Super Admin can grant administrative privileges.')
      return
    }

    try {
      await apiClient.put(`/users/${targetUserId}/role`, { role: 'admin' })
    } catch (e) {
      console.warn('Backend role update fallback to local state:', e)
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId ? { ...u, role: 'admin' as UserRole, updatedAt: new Date().toISOString() } : u
      )
    )
  }

  const demoteToCustomer = async (targetUserId: string) => {
    if (!user || user.role !== 'super_admin') {
      alert('Unauthorized: Only Super Admin can modify administrative privileges.')
      return
    }

    try {
      await apiClient.put(`/users/${targetUserId}/role`, { role: 'customer' })
    } catch (e) {
      console.warn('Backend role update fallback to local state:', e)
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId ? { ...u, role: 'customer' as UserRole, updatedAt: new Date().toISOString() } : u
      )
    )
  }

  const toggleUserStatus = async (targetUserId: string) => {
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      alert('Unauthorized: You do not have permission to change user statuses.')
      return
    }

    try {
      await apiClient.put(`/users/${targetUserId}/status`, {})
    } catch (e) {
      console.warn('Backend status update fallback to local state:', e)
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
          : u
      )
    )
  }

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return

    try {
      const res = await apiClient.put('/users/me', updatedData)
      if (res?.user) {
        setUser(res.user)
        localStorage.setItem('bd_commerce_current_user', JSON.stringify(res.user))
        return
      }
    } catch (e) {
      console.warn('Backend profile update fallback to local state:', e)
    }

    const updated = { ...user, ...updatedData, updatedAt: new Date().toISOString() }
    setUser(updated)
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    localStorage.setItem('bd_commerce_current_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        resetPassword,
        logout,
        users,
        promoteToAdmin,
        demoteToCustomer,
        toggleUserStatus,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
