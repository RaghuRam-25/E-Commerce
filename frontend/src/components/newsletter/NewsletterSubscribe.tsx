import React, { useState } from 'react'
import { subscribeToNewsletter } from '@/services/subscriptionService'

export interface NewsletterSubscribeProps {
  title?: string
  description?: string
  variant?: 'card' | 'inline' | 'compact'
  className?: string
}

export const NewsletterSubscribe: React.FC<NewsletterSubscribeProps> = ({
  title = 'Subscribe for Exclusive Deals',
  description = 'Get instant updates on new product launches, special sales, and promotional discount vouchers.',
  variant = 'card',
  className = '',
}) => {
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanEmail = email.trim()

    // 1. Client-side Validation
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.')
      return
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    // 2. Loading State
    setLoading(true)

    try {
      // 3. Call Service
      const res = await subscribeToNewsletter(cleanEmail)

      if (res.success) {
        setSubscribedEmail(cleanEmail)
        setEmail('')
      } else {
        setErrorMsg(res.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubscribedEmail(null)
    setEmail('')
    setErrorMsg(null)
  }

  // --- Success View ---
  if (subscribedEmail) {
    return (
      <div
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 text-center animate-fade-in shadow-lg space-y-4 max-w-xl mx-auto ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          ✓
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-white">🎉 Subscription Successful!</h3>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Thank you for subscribing with{' '}
            <span className="font-bold underline text-white font-mono">{subscribedEmail}</span>.
            <br />
            You're now on our priority list for special vouchers and launch offers!
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white underline hover:no-underline transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded px-2 py-1"
          >
            <span>Subscribe another email</span> →
          </button>
        </div>
      </div>
    )
  }

  // --- Main Form View ---
  return (
    <div
      className={
        variant === 'card'
          ? `bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-10 text-white text-center shadow-xl relative overflow-hidden ${className}`
          : `space-y-4 ${className}`
      }
    >
      <div className="relative z-10 max-w-2xl mx-auto space-y-3">
        {title && (
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-emerald-100 text-xs sm:text-sm max-w-lg mx-auto font-normal leading-relaxed">
            {description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="pt-3 max-w-md mx-auto space-y-3" noValidate>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMsg) setErrorMsg(null)
                }}
                disabled={loading}
                aria-label="Email address for newsletter"
                aria-invalid={!!errorMsg}
                required
                className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-sm bg-white placeholder:text-gray-400 disabled:opacity-70 transition-all border border-transparent focus:border-emerald-400 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-extrabold px-7 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 min-w-[140px]"
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  ></span>
                  <span>Subscribing...</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </div>

          {/* Validation & Server Error Display */}
          {errorMsg && (
            <div
              className="bg-rose-500/20 border border-rose-300/40 text-rose-100 px-3.5 py-2 rounded-xl text-xs font-semibold animate-fade-in flex items-center justify-center gap-2"
              role="alert"
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default NewsletterSubscribe
