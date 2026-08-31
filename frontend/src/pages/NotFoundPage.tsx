import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Page Not Found</h2>
        <p className="text-gray-600 text-sm mb-8">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" className="mx-auto">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
