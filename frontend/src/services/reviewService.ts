// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewImage {
  url: string
  publicId: string
}

/** A product-specific review returned from the public API */
export interface ProductReview {
  id: string
  customerId?: string
  customerName: string
  location?: string
  avatarUrl?: string
  title?: string
  review?: string
  rating: number
  images: ReviewImage[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  hasVoted?: boolean
  createdAt: string
}

/** Summary statistics for a product's reviews */
export interface ReviewSummary {
  averageRating: number
  totalCount: number
  distribution: { [star: number]: number }
}

/** Payload for submitting a new product review */
export interface CreateProductReviewPayload {
  productId: string
  rating: number
  title?: string
  review?: string
  images?: ReviewImage[]
  orderId?: string
  location?: string
}

/** Paginated response for product reviews */
export interface ProductReviewsResponse {
  success: boolean
  total: number
  page: number
  pages: number
  count: number
  reviews: ProductReview[]
}

export interface ReviewQueryParams {
  page?: number
  limit?: number
  rating?: string
  withPhotos?: boolean
  sort?: 'recent' | 'highest' | 'lowest' | 'helpful'
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy interfaces (kept for backwards compatibility with ReviewsPage & Admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  customerId?: string
  customerName: string
  location?: string
  email?: string
  title?: string
  review: string
  rating: number
  avatarUrl?: string
  images?: ReviewImage[]
  status: 'pending' | 'approved' | 'rejected'
  isFeatured: boolean
  isVerifiedPurchase?: boolean
  helpfulCount?: number
  productId?: string
  productName?: string
  productImage?: string
  createdAt: string
  updatedAt?: string
}

export interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  averageRating: number
  featuredCount: number
}

export interface CreateReviewPayload {
  review: string
  rating: number
  location?: string
  productId?: string
  orderId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = '/api'
const REVIEWS_BASE = `${API_BASE}/reviews`

const getToken = (): string | null => localStorage.getItem('bd_commerce_token')

const authHeaders = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Product-specific review functions (new)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated, filtered, sorted reviews for a specific product.
 * GET /api/products/:productId/reviews
 */
export async function getProductReviews(
  productId: string,
  params: ReviewQueryParams = {}
): Promise<ProductReviewsResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.rating && params.rating !== 'all') query.set('rating', params.rating)
  if (params.withPhotos) query.set('withPhotos', 'true')
  if (params.sort) query.set('sort', params.sort)

  const res = await fetch(`${API_BASE}/products/${productId}/reviews?${query.toString()}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch reviews.')
  }

  return data
}

/**
 * Fetch rating summary (avg, total, distribution) for a specific product.
 * GET /api/products/:productId/review-summary
 */
export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const res = await fetch(`${API_BASE}/products/${productId}/review-summary`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch review summary.')
  }

  return data.summary as ReviewSummary
}

/**
 * Submit a new product review (text, photos, or both).
 * POST /api/reviews
 */
export async function createProductReview(
  payload: CreateProductReviewPayload
): Promise<{ success: boolean; message: string; review?: ProductReview }> {
  // Client-side validation
  const hasText = payload.review && payload.review.trim().length >= 10
  const hasImages = payload.images && payload.images.length > 0

  if (!hasText && !hasImages) {
    return {
      success: false,
      message: 'Please provide a review text (min 10 characters) or at least one photo.',
    }
  }
  if (payload.review && payload.review.trim().length > 1000) {
    return { success: false, message: 'Review text cannot exceed 1000 characters.' }
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { success: false, message: 'Rating must be between 1 and 5.' }
  }
  if (payload.images && payload.images.length > 5) {
    return { success: false, message: 'You can upload a maximum of 5 photos per review.' }
  }

  try {
    const res = await fetch(REVIEWS_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Thank you! Your review is pending approval.',
        review: data.review,
      }
    }

    return { success: false, message: data.message || 'Failed to submit review.' }
  } catch (err) {
    return { success: false, message: 'Network error. Please check your connection and try again.' }
  }
}

/**
 * Mark a review as helpful. Backend prevents duplicate votes.
 * POST /api/reviews/:id/helpful
 */
export async function markReviewHelpful(reviewId: string): Promise<{ success: boolean; message: string; helpfulCount?: number }> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${reviewId}/helpful`, {
      method: 'POST',
      headers: { ...authHeaders() },
    })

    const data = await res.json()
    return {
      success: data.success,
      message: data.message || '',
      helpfulCount: data.helpfulCount,
    }
  } catch (err) {
    return { success: false, message: 'Failed to record your vote.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy / Store-wide review functions (kept for ReviewsPage & AdminReviewsPage)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch public approved & featured reviews (for Homepage)
 */
export async function getFeaturedReviews(): Promise<Review[]> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/featured`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline
  }
  return []
}

/**
 * Fetch all public approved reviews (for Reviews page)
 */
export async function getApprovedReviews(): Promise<Review[]> {
  try {
    const res = await fetch(REVIEWS_BASE)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline
  }
  return []
}

/**
 * Submit a store/general review (used by ReviewsPage — legacy)
 */
export async function createReview(
  payload: CreateReviewPayload
): Promise<{ success: boolean; message: string; review?: Review }> {
  if (!payload.review || payload.review.trim().length < 10) {
    return { success: false, message: 'Review text must be at least 10 characters long.' }
  }
  if (payload.review.trim().length > 1000) {
    return { success: false, message: 'Review text cannot exceed 1000 characters.' }
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { success: false, message: 'Rating must be an integer between 1 and 5.' }
  }

  try {
    const res = await fetch(REVIEWS_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Thank you! Your review has been submitted for approval.',
        review: data.review,
      }
    }
    return { success: false, message: data.message || 'Failed to submit review.' }
  } catch (err) {
    return { success: false, message: 'Network error. Please try again.' }
  }
}

/**
 * Fetch all reviews for Admin Panel
 */
export async function getAllReviewsAdmin(
  status?: string,
  rating?: string,
  search?: string
): Promise<Review[]> {
  try {
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    if (rating) queryParams.append('rating', rating)
    if (search) queryParams.append('search', search)

    const res = await fetch(`${REVIEWS_BASE}/admin/all?${queryParams.toString()}`, {
      headers: { ...authHeaders() },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline
  }
  return []
}

/**
 * Fetch review statistics for Admin Dashboard
 */
export async function getReviewStatsAdmin(): Promise<ReviewStats> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/admin/stats`, {
      headers: { ...authHeaders() },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.stats) {
        return data.stats
      }
    }
  } catch (err) {
    // API offline
  }
  return { total: 0, pending: 0, approved: 0, rejected: 0, averageRating: 5.0, featuredCount: 0 }
}

/**
 * Approve a review
 */
export async function approveReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${id}/approve`, {
      method: 'PATCH',
      headers: { ...authHeaders() },
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Reject a review
 */
export async function rejectReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${id}/reject`, {
      method: 'PATCH',
      headers: { ...authHeaders() },
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Toggle featured status
 */
export async function toggleFeaturedReview(id: string, isFeatured?: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${id}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ isFeatured }),
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Delete a review
 */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Update a review (Admin)
 */
export async function updateReviewAdmin(id: string, payload: Partial<Review>): Promise<boolean> {
  try {
    const res = await fetch(`${REVIEWS_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch (err) {
    return false
  }
}
