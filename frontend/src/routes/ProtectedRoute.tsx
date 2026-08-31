import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactElement
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            🚫
          </div>
          <h2 className="text-2xl font-black text-gray-900">403 - Access Forbidden</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your account role (<span className="font-bold text-gray-900 capitalize">{user.role.replace('_', ' ')}</span>) does not have permission to view this resource.
          </p>

          <div className="pt-4 flex flex-col gap-2">
            {user.role === 'customer' ? (
              <Link
                to="/"
                className="bg-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Return to Storefront
              </Link>
            ) : (
              <Link
                to="/admin"
                className="bg-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Return to Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return children
}
