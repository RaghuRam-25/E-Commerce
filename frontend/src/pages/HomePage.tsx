import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/products/ProductCard'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/services/mockData'
import { NewsletterSubscribe } from '@/components/newsletter/NewsletterSubscribe'
import { getFeaturedReviews, createReview } from '@/services/reviewService'
import type { Review } from '@/services/reviewService'
import { useAuth } from '@/contexts/AuthContext'

const businessHighlights = [
  {
    id: '1',
    title: 'Fast Delivery',
    description: 'Quick 2-3 business days delivery across all 64 districts in Bangladesh.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: '2',
    title: 'Cash on Delivery',
    description: 'Pay safely when your package arrives directly at your doorstep.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: '3',
    title: '100% Quality Verified',
    description: 'Carefully curated selection of authentic and premium products.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: '4',
    title: '24/7 Dedicated Support',
    description: 'Our customer care team is always ready to assist you anytime.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export const HomePage: React.FC = () => {
  const featuredProducts = INITIAL_PRODUCTS.filter((p) => p.isFeatured)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [testimonials, setTestimonials] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true)
  const [showWriteModal, setShowWriteModal] = useState<boolean>(false)
  const [newReviewText, setNewReviewText] = useState<string>('')
  const [newRating, setNewRating] = useState<number>(5)
  const [userLocation, setUserLocation] = useState<string>('Dhaka, Bangladesh')
  const [submittingReview, setSubmittingReview] = useState<boolean>(false)
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadFeaturedTestimonials()
  }, [])

  const loadFeaturedTestimonials = async () => {
    setLoadingReviews(true)
    try {
      const data = await getFeaturedReviews()
      setTestimonials(data)
    } catch (e) {
      console.error('Failed to load testimonials:', e)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleOpenWriteModal = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setReviewMessage(null)
    setShowWriteModal(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewMessage(null)
    setSubmittingReview(true)

    const res = await createReview({
      review: newReviewText,
      rating: newRating,
      location: userLocation,
    })

    setSubmittingReview(false)
    if (res.success) {
      setReviewMessage({ type: 'success', text: res.message })
      setNewReviewText('')
      setTimeout(() => {
        setShowWriteModal(false)
        setReviewMessage(null)
      }, 2500)
    } else {
      setReviewMessage({ type: 'error', text: res.message })
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

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 text-white overflow-hidden py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase border border-emerald-500/30">
                Premium E-Commerce Platform
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                Quality Products, <br />
                <span className="text-emerald-400">Delivered Fast.</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Explore top-rated fashion, electronics, home essentials, and sports gear at competitive prices with guaranteed quality across Bangladesh.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link to="/products">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-emerald-900/50">
                    Browse All Products
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-400 text-white hover:bg-white/10">
                    About Our Store
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto lg:mx-0 max-w-md lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                  alt="Shop Banner"
                  className="w-full h-80 lg:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent flex items-end p-6">
                  <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 text-gray-900 shadow-lg w-full">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase">Special Launch Discount</p>
                        <p className="text-lg font-black">Up to 25% Off Featured Items</p>
                      </div>
                      <Link to="/products" className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessHighlights.map((highlight) => (
            <div
              key={highlight.id}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="p-3 bg-emerald-50 rounded-xl flex-shrink-0">
                {highlight.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{highlight.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {INITIAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-xl p-5 border border-gray-200 text-center hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                {cat.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Top Choices</span>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Explore All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">What Our Customers Say</h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenWriteModal}
              className="font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            >
              ✍️ Write a Review
            </Button>
          </div>

          {loadingReviews ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Loading customer reviews...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 max-w-md mx-auto space-y-3">
              <p className="text-3xl">⭐</p>
              <h3 className="font-bold text-gray-900">No Featured Testimonials Yet</h3>
              <p className="text-xs text-gray-500">Be the first customer to share your shopping experience with us!</p>
              <Button size="sm" variant="primary" onClick={handleOpenWriteModal}>
                Submit Your Review
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < t.rating ? '★' : '☆'}</span>
                      ))}
                      <span className="text-xs text-gray-400 font-bold ml-1">({t.rating}.0)</span>
                    </div>

                    <p className="text-gray-700 text-sm italic leading-relaxed font-normal">
                      "{t.review}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                    {t.avatarUrl ? (
                      <img
                        src={t.avatarUrl}
                        alt={t.customerName}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                        {getInitials(t.customerName)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{t.customerName}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span>📍 {t.location || 'Dhaka, Bangladesh'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Reviews Button */}
          <div className="text-center mt-10">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
            >
              ⭐ View All Customer Reviews
              <span className="text-lg">→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Customer Write Review Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Write a Customer Review</h3>
              <button onClick={() => setShowWriteModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            {reviewMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  reviewMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {reviewMessage.text}
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

      {/* Reusable Newsletter Component */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewsletterSubscribe />
      </section>
    </div>
  )
}

export default HomePage