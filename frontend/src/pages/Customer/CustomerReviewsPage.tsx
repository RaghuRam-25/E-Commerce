import React, { useState, useEffect } from 'react'
import { getApprovedReviews, createReview } from '@/services/reviewService'
import type { Review } from '@/services/reviewService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export const CustomerReviewsPage: React.FC = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [showWriteModal, setShowWriteModal] = useState<boolean>(false)
  const [newReviewText, setNewReviewText] = useState<string>('')
  const [newRating, setNewRating] = useState<number>(5)
  const [userLocation, setUserLocation] = useState<string>('Dhaka, Bangladesh')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadUserReviews()
  }, [])

  const loadUserReviews = async () => {
    setLoading(true)
    try {
      // In local fallback or API, fetch reviews submitted by this customer
      const stored = localStorage.getItem('bd_commerce_reviews')
      if (stored) {
        const all: Review[] = JSON.parse(stored)
        const myRevs = all.filter(
          (r) =>
            r.email === user?.email ||
            r.customerName.toLowerCase() === user?.name?.toLowerCase()
        )
        setReviews(myRevs)
      } else {
        const data = await getApprovedReviews()
        setReviews(data)
      }
    } catch (e) {
      console.error('Failed to load user reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)

    const res = await createReview({
      review: newReviewText,
      rating: newRating,
      location: userLocation,
    })

    setSubmitting(false)
    if (res.success) {
      setMessage({ type: 'success', text: res.message })
      setNewReviewText('')
      loadUserReviews()
      setTimeout(() => {
        setShowWriteModal(false)
        setMessage(null)
      }, 2000)
    } else {
      setMessage({ type: 'error', text: res.message })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Reviews & Testimonials</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track the status of your submitted customer reviews and ratings.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowWriteModal(true)} className="font-bold">
          ✍️ Write New Review
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading your reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 space-y-3">
          <p className="text-3xl">⭐</p>
          <h3 className="font-bold text-gray-900 text-base">No Reviews Submitted Yet</h3>
          <p className="text-xs text-gray-500">
            Share your feedback on your orders and service experience to help other shoppers!
          </p>
          <Button size="sm" variant="primary" onClick={() => setShowWriteModal(true)}>
            Write Your First Review
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < rev.rating ? '★' : '☆'}</span>
                  ))}
                  <span className="text-xs font-bold text-gray-500 ml-1">({rev.rating}/5)</span>
                </div>

                <Badge
                  variant={
                    rev.status === 'approved'
                      ? 'default'
                      : rev.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {rev.status === 'approved'
                    ? 'Approved (Public)'
                    : rev.status === 'rejected'
                    ? 'Rejected'
                    : 'Pending Admin Approval'}
                </Badge>
              </div>

              <p className="text-sm text-gray-700 italic font-normal">"{rev.review}"</p>

              <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span>📍 {rev.location || 'Dhaka'}</span>
                <span>
                  Submitted:{' '}
                  {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Submit Customer Review</h3>
              <button onClick={() => setShowWriteModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`text-2xl ${star <= newRating ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka, Bangladesh"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Review * (10-500 chars)</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your experience..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowWriteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting} className="flex-1 font-bold">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerReviewsPage
