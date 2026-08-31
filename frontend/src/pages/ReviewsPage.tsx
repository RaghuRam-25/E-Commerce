import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApprovedReviews, createReview } from '@/services/reviewService'
import type { Review } from '@/services/reviewService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'

export const ReviewsPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  const [showWriteModal, setShowWriteModal] = useState<boolean>(false)
  const [newReviewText, setNewReviewText] = useState<string>('')
  const [newRating, setNewRating] = useState<number>(5)
  const [userLocation, setUserLocation] = useState<string>('Dhaka, Bangladesh')
  const [submittingReview, setSubmittingReview] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const data = await getApprovedReviews()
      setReviews(data)
    } catch (e) {
      console.error('Failed to load public reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWriteModal = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setMessage(null)
    setShowWriteModal(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmittingReview(true)

    const res = await createReview({
      review: newReviewText,
      rating: newRating,
      location: userLocation,
    })

    setSubmittingReview(false)
    if (res.success) {
      setMessage({ type: 'success', text: res.message })
      setNewReviewText('')
      setTimeout(() => {
        setShowWriteModal(false)
        setMessage(null)
      }, 2500)
    } else {
      setMessage({ type: 'error', text: res.message })
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Filter reviews
  let filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const matchName = r.customerName.toLowerCase().includes(q)
      const matchText = r.review.toLowerCase().includes(q)
      const matchLoc = r.location && r.location.toLowerCase().includes(q)
      if (!matchName && !matchText && !matchLoc) return false
    }
    return true
  })

  // Calculate rating summary
  const totalCount = reviews.length
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalCount).toFixed(1)
    : '5.0'

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white py-14 px-4 text-center rounded-3xl shadow-xl">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Customer Reviews</h1>

          <div className="pt-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenWriteModal}
              className="font-extrabold shadow-lg shadow-emerald-950/40"
            >
              ✍️ Write a Customer Review
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stat Card & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          {/* Average Rating Score */}
          <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
            <p className="text-xs text-gray-500 font-bold uppercase">Overall Store Rating</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className="text-4xl font-black text-gray-900">{avgRating}</span>
              <div>
                <div className="flex text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-semibold">{totalCount} Verified Reviews</p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Search Reviews</label>
            <Input
              placeholder="Search by name, location, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Rating Filter Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Filter by Rating</label>
            <Select
              value={ratingFilter}
              options={[
                { value: 'all', label: 'All Star Ratings' },
                { value: '5', label: '5 Stars ★★★★★' },
                { value: '4', label: '4 Stars ★★★★☆' },
                { value: '3', label: '3 Stars ★★★☆☆' },
                { value: '2', label: '2 Stars ★★☆☆☆' },
                { value: '1', label: '1 Star ★☆☆☆☆' },
              ]}
              onChange={(val) => setRatingFilter(val)}
            />
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Loading verified customer reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl mx-auto">
              ⭐
            </div>
            <h3 className="font-bold text-gray-900 text-lg">No Reviews Found</h3>
            <p className="text-xs text-gray-500">
              No customer reviews match your search filter. Try clearing your search query or rating filter.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setSearch(''); setRatingFilter('all'); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div className="space-y-3">
                  {/* Top Row: Stars + Verified Badge */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < rev.rating ? '★' : '☆'}</span>
                      ))}
                      <span className="text-xs text-gray-500 font-mono ml-1">({rev.rating}.0)</span>
                    </div>

                    {rev.isVerifiedPurchase && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Review Body */}
                  <p className="text-gray-700 text-sm italic leading-relaxed font-normal">
                    "{rev.review}"
                  </p>
                </div>

                {/* Footer Reviewer Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-5">
                  {rev.avatarUrl ? (
                    <img
                      src={rev.avatarUrl}
                      alt={rev.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                      {getInitials(rev.customerName)}
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{rev.customerName}</h4>
                    <p className="text-xs text-gray-400">📍 {rev.location || 'Dhaka, Bangladesh'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Write a Customer Review</h3>
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

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`text-2xl transition-transform ${
                        star <= newRating ? 'text-amber-400 scale-110' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Location</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka, Bangladesh"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Review * (10-500 characters)</label>
                <textarea
                  rows={4}
                  placeholder="Share your experience regarding product quality, delivery speed, and service..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {newReviewText.trim().length} / 500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowWriteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingReview}
                  className="flex-1 font-bold"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsPage
