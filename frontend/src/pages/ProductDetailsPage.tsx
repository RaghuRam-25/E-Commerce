import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { ReviewCard } from '@/components/products/ReviewCard'
import { ReviewForm } from '@/components/products/ReviewForm'
import { RatingSummary } from '@/components/products/RatingSummary'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import type { Product } from '@/types'
import type { ProductReview, ReviewSummary } from '@/services/reviewService'
import { getProductReviews, getProductReviewSummary } from '@/services/reviewService'
import { INITIAL_PRODUCTS } from '@/services/mockData'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── Mini helpers ────────────────────────────────────────────────────────────
const StarRow: React.FC<{ rating: number; count?: number; size?: 'sm' | 'md' }> = ({
  rating,
  count,
  size = 'sm',
}) => {
  const cls = size === 'md' ? 'text-base' : 'text-sm'
  return (
    <div className={`flex items-center gap-1 ${cls}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
      {rating > 0 && (
        <span className="font-bold text-gray-700 ml-0.5">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-gray-400">
          · {count.toLocaleString()} review{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' },
  { value: 'helpful', label: 'Most Helpful' },
]

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 ★' },
  { value: '4', label: '4 ★' },
  { value: '3', label: '3 ★' },
  { value: '2', label: '2 ★' },
  { value: '1', label: '1 ★' },
  { value: 'photos', label: '📷 With Photos' },
]

const REVIEWS_PER_PAGE = 10

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user, isAuthenticated } = useAuth()

  // ── Product state ──────────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null)
  const [productLoading, setProductLoading] = useState(true)
  const [productError, setProductError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedNotice, setAddedNotice] = useState(false)

  // ── Related products state ─────────────────────────────────────────────────
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  // ── Review summary state ───────────────────────────────────────────────────
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)

  // ── Review list state ──────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent')
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [reviewTotal, setReviewTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [mySubmittedReview, setMySubmittedReview] = useState<ProductReview | null>(null)

  // Helper to resolve mock product fallback
  const getMockProduct = useCallback((targetId: string): Product | null => {
    return (
      INITIAL_PRODUCTS.find(
        (p) => p.id === targetId || p.slug === targetId || p.sku === targetId
      ) || INITIAL_PRODUCTS[0] || null
    )
  }, [])

  // ── Fetch product with fallback ──────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setProductLoading(true)
    setProductError(null)

    fetch(`${API_BASE}/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.product) {
          const p = {
            ...data.product,
            id: data.product.id || data.product._id,
          }
          setProduct(p)
        } else {
          const mock = getMockProduct(id)
          if (mock) {
            setProduct(mock)
          } else {
            setProductError('Product not found.')
          }
        }
      })
      .catch(() => {
        const mock = getMockProduct(id)
        if (mock) {
          setProduct(mock)
        } else {
          setProductError('Failed to load product. Please try again.')
        }
      })
      .finally(() => setProductLoading(false))
  }, [id, getMockProduct])

  // ── Fetch related products with fallback ──────────────────────────────────
  useEffect(() => {
    if (!id || !product) return

    fetch(`${API_BASE}/products/${id}/related`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const normalized = data.products.map((p: any) => ({
            ...p,
            id: p.id || p._id,
          }))
          setRelatedProducts(normalized)
        } else {
          const localRel = INITIAL_PRODUCTS.filter(
            (p) => p.category === product.category && p.id !== product.id
          ).slice(0, 4)
          setRelatedProducts(localRel)
        }
      })
      .catch(() => {
        const localRel = INITIAL_PRODUCTS.filter(
          (p) => p.category === product.category && p.id !== product.id
        ).slice(0, 4)
        setRelatedProducts(localRel)
      })
  }, [id, product])

  // ── Fetch review summary ───────────────────────────────────────────────────
  const fetchReviewSummary = useCallback(async () => {
    if (!id) return
    try {
      const summary = await getProductReviewSummary(id)
      setReviewSummary(summary)
    } catch {
      setReviewSummary({
        averageRating: product?.rating || 4.5,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      })
    }
  }, [id, product])

  useEffect(() => {
    fetchReviewSummary()
  }, [fetchReviewSummary])

  // ── Fetch reviews (initial + filter/sort changes) ──────────────────────────
  const fetchReviews = useCallback(
    async (page: number, append: boolean) => {
      if (!id) return

      if (append) setLoadingMore(true)
      else setReviewsLoading(true)

      try {
        const params: Record<string, any> = {
          page,
          limit: REVIEWS_PER_PAGE,
          sort: reviewSort,
        }

        if (reviewFilter === 'photos') {
          params.withPhotos = true
        } else if (reviewFilter !== 'all') {
          params.rating = reviewFilter
        }

        const data = await getProductReviews(id, params)

        if (append) {
          setReviews((prev) => [...prev, ...data.reviews])
        } else {
          setReviews(data.reviews)
        }

        setReviewTotalPages(data.pages || 1)
        setReviewTotal(data.total || 0)
        setReviewPage(page)
      } catch (err) {
        // silent
      } finally {
        setReviewsLoading(false)
        setLoadingMore(false)
      }
    },
    [id, reviewFilter, reviewSort]
  )

  // Reset to page 1 when filter/sort changes
  useEffect(() => {
    fetchReviews(1, false)
  }, [reviewFilter, reviewSort, fetchReviews])

  // ── Cart actions ───────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) addItem(product)
    setAddedNotice(true)
    setTimeout(() => setAddedNotice(false), 3000)
  }

  const handleBuyNow = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) addItem(product)
    navigate('/checkout')
  }

  // ── Filter change handler ──────────────────────────────────────────────────
  const handleFilterChange = (f: string) => {
    setReviewFilter(f)
  }

  // ── Review form success ────────────────────────────────────────────────────
  const handleReviewSuccess = (submittedReview?: any) => {
    setShowReviewForm(false)
    if (submittedReview) {
      setMySubmittedReview({
        id: submittedReview.id || 'rev-my-' + Date.now(),
        customerName: submittedReview.customerName || user?.name || 'You',
        title: submittedReview.title || '',
        review: submittedReview.review || '',
        rating: submittedReview.rating || 5,
        images: submittedReview.images || [],
        isVerifiedPurchase: !!submittedReview.isVerifiedPurchase,
        helpfulCount: 0,
        createdAt: submittedReview.createdAt || new Date().toISOString(),
      })
    }
    fetchReviewSummary()
    fetchReviews(1, false)
  }

  const handleWriteReviewClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    setShowLoginPrompt(false)
    setShowReviewForm(true)
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (productLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading product...</p>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold text-gray-900">
          {productError || 'Product not found.'}
        </h2>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Browse Products
        </Button>
      </div>
    )
  }

  const hasDiscount = product.discount > 0
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discount / 100)
    : product.price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-600 transition-colors">Products</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* ── Product Details Card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images column */}
        <div className="space-y-4">
          <ProductImageGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />

          {hasDiscount && (
            <div className="text-center -mt-2">
              <span className="bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
                {product.discount}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5">
          {/* Category + stock */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{product.category}</Badge>
            {product.stock > 0 ? (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Dynamic rating from reviews or product fallback */}
          <button
            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity w-fit"
          >
            <StarRow
              rating={reviewSummary && reviewSummary.totalCount > 0 ? reviewSummary.averageRating : product.rating || 4.5}
              count={reviewSummary?.totalCount || 0}
              size="md"
            />
          </button>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-emerald-600">
              ৳{finalPrice.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-b border-gray-50 py-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* SKU */}
          <p className="text-xs text-gray-400">SKU: <span className="font-mono">{product.sku}</span></p>

          {/* Quantity picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quantity</label>
            <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 font-bold transition-colors"
              >
                −
              </button>
              <span className="px-5 py-2.5 font-bold text-sm text-gray-900 bg-white min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to cart success notice */}
          {addedNotice && (
            <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-emerald-100">
              <span>✓ Added {quantity} item{quantity > 1 ? 's' : ''} to your cart!</span>
              <Link to="/cart" className="underline font-bold hover:text-emerald-900">View Cart →</Link>
            </div>
          )}

          {/* Cart buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 font-bold py-3.5"
            >
              🛒 Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold py-3.5"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* ── Related Products ───────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-emerald-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id || (rp as any)._id} product={{ ...rp, id: rp.id || (rp as any)._id }} />
            ))}
          </div>
        </section>
      )}

      {/* ── Customer Reviews ───────────────────────────────────────────────── */}
      <section id="reviews-section" className="space-y-7">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-amber-400 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
            {reviewSummary && reviewSummary.totalCount > 0 && (
              <span className="text-sm text-gray-400">({reviewSummary.totalCount.toLocaleString()})</span>
            )}
          </div>

          {/* Write a review button */}
          {!showReviewForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleWriteReviewClick}
            >
              ✍️ Write a Review
            </Button>
          )}
        </div>

        {/* Login Prompt if unauthenticated customer clicks Write a Review */}
        {showLoginPrompt && !isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Please login to write a review.</h4>
                <p className="text-xs text-amber-700 mt-0.5">Share your experience with verified customers.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/login')}
              className="font-bold whitespace-nowrap"
            >
              Login Now →
            </Button>
          </div>
        )}

        {/* Highlight Customer's Newly Submitted Review */}
        {mySubmittedReview && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                Your Review
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                ⏳ Pending Admin Approval
              </span>
            </div>
            <p className="text-xs text-emerald-700">
              Your review has been submitted successfully and is waiting for administrator approval before appearing publicly.
            </p>
            <ReviewCard review={mySubmittedReview} isAuthenticated={isAuthenticated} />
          </div>
        )}

        {/* Rating summary chart */}
        {reviewSummary && reviewSummary.totalCount > 0 && (
          <RatingSummary
            summary={reviewSummary}
            activeFilter={reviewFilter}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Review form */}
        {showReviewForm && isAuthenticated && (
          <div id="review-form">
            <ReviewForm
              productId={id!}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {/* Filter tabs & Sort */}
        {(reviewSummary?.totalCount || 0) > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    reviewFilter === tab.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sort by:</span>
              <div className="relative">
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)}
                  className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▾</div>
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          reviewFilter !== 'all' ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
              <p className="text-xs text-gray-500">No reviews match this filter.</p>
              <Button size="sm" variant="outline" onClick={() => setReviewFilter('all')}>
                Show All Reviews
              </Button>
            </div>
          ) : null
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                review={rev}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!reviewsLoading && reviewPage < reviewTotalPages && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="md"
              disabled={loadingMore}
              onClick={() => fetchReviews(reviewPage + 1, true)}
              className="min-w-[180px]"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load More Reviews (${reviewTotal - reviews.length} remaining)`
              )}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}