export interface Review {
  id: string
  customerId?: string
  customerName: string
  location?: string
  email?: string
  review: string
  rating: number
  avatarUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  isFeatured: boolean
  isVerifiedPurchase?: boolean
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

const API_BASE = '/api/reviews'

const INITIAL_FALLBACK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Ayesha Khan',
    location: 'Dhaka, Bangladesh',
    review: 'Excellent service and fast delivery! The quality of the cotton shirt exceeded my expectations.',
    rating: 5,
    status: 'approved',
    isFeatured: true,
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'rev-2',
    customerName: 'Rahman Islam',
    location: 'Chittagong, Bangladesh',
    review: 'Great variety of products and very responsive customer support. Cash on delivery was seamless.',
    rating: 5,
    status: 'approved',
    isFeatured: true,
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'rev-3',
    customerName: 'Fatima Ahmed',
    location: 'Sylhet, Bangladesh',
    review: 'Love the quality and packaging. Everything arrived in perfect condition within 2 days.',
    rating: 5,
    status: 'approved',
    isFeatured: true,
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'rev-4',
    customerName: 'Tanvir Hossain',
    location: 'Rajshahi, Bangladesh',
    review: 'Very smooth shopping experience and quick response on WhatsApp hotline.',
    rating: 4,
    status: 'pending',
    isFeatured: false,
    isVerifiedPurchase: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
]

const getLocalReviews = (): Review[] => {
  try {
    const stored = localStorage.getItem('bd_commerce_reviews')
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.error('Failed to load reviews from localStorage', e)
  }
  return INITIAL_FALLBACK_REVIEWS
}

const saveLocalReviews = (reviews: Review[]) => {
  try {
    localStorage.setItem('bd_commerce_reviews', JSON.stringify(reviews))
  } catch (e) {
    console.error('Failed to save reviews to localStorage', e)
  }
}

/**
 * Fetch public approved & featured reviews (for Homepage)
 */
export async function getFeaturedReviews(): Promise<Review[]> {
  try {
    const res = await fetch(`${API_BASE}/featured`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalReviews()
  return list.filter((r) => r.status === 'approved' && r.isFeatured)
}

/**
 * Fetch all public approved reviews
 */
export async function getApprovedReviews(): Promise<Review[]> {
  try {
    const res = await fetch(API_BASE)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalReviews()
  return list.filter((r) => r.status === 'approved')
}

/**
 * Submit a customer review (Authenticated)
 */
export async function createReview(
  payload: CreateReviewPayload
): Promise<{ success: boolean; message: string; review?: Review }> {
  // Client-side validation
  if (!payload.review || payload.review.trim().length < 10) {
    return { success: false, message: 'Review text must be at least 10 characters long.' }
  }
  if (payload.review.trim().length > 500) {
    return { success: false, message: 'Review text cannot exceed 500 characters.' }
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { success: false, message: 'Rating must be an integer between 1 and 5.' }
  }

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
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
    } else {
      return {
        success: false,
        message: data.message || 'Failed to submit review.',
      }
    }
  } catch (err) {
    // API offline fallback
    const list = getLocalReviews()
    
    // Get user from localStorage
    let userName = 'Valued Customer'
    let userEmail = undefined
    try {
      const u = localStorage.getItem('bd_commerce_user')
      if (u) {
        const parsed = JSON.parse(u)
        if (parsed.name) userName = parsed.name
        if (parsed.email) userEmail = parsed.email
      }
    } catch (e) {}

    const newReview: Review = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      customerName: userName,
      location: payload.location || 'Dhaka, Bangladesh',
      email: userEmail,
      review: payload.review.trim(),
      rating: payload.rating,
      status: 'pending',
      isFeatured: false,
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    }

    list.unshift(newReview)
    saveLocalReviews(list)

    return {
      success: true,
      message: 'Thank you! Your review has been submitted and is pending administrator approval.',
      review: newReview,
    }
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
    const token = localStorage.getItem('token')
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    if (rating) queryParams.append('rating', rating)
    if (search) queryParams.append('search', search)

    const res = await fetch(`${API_BASE}/admin/all?${queryParams.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews
      }
    }
  } catch (err) {
    // API offline fallback
  }

  let list = getLocalReviews()
  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status)
  }
  if (rating && rating !== 'all') {
    list = list.filter((r) => r.rating === Number(rating))
  }
  if (search) {
    const q = search.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.review.toLowerCase().includes(q) ||
        (r.location && r.location.toLowerCase().includes(q))
    )
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Fetch review statistics for Admin Dashboard
 */
export async function getReviewStatsAdmin(): Promise<ReviewStats> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.stats) {
        return data.stats
      }
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalReviews()
  const total = list.length
  const pending = list.filter((r) => r.status === 'pending').length
  const approved = list.filter((r) => r.status === 'approved').length
  const rejected = list.filter((r) => r.status === 'rejected').length
  const featuredCount = list.filter((r) => r.status === 'approved' && r.isFeatured).length
  const approvedList = list.filter((r) => r.status === 'approved')
  const sumRating = approvedList.reduce((acc, curr) => acc + curr.rating, 0)
  const averageRating = approvedList.length > 0 ? Number((sumRating / approvedList.length).toFixed(1)) : 5.0

  return { total, pending, approved, rejected, averageRating, featuredCount }
}

/**
 * Approve Review
 */
export async function approveReview(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (res.ok) return true
  } catch (err) {}

  const list = getLocalReviews()
  const target = list.find((r) => r.id === id)
  if (target) {
    target.status = 'approved'
    saveLocalReviews(list)
    return true
  }
  return false
}

/**
 * Reject Review
 */
export async function rejectReview(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (res.ok) return true
  } catch (err) {}

  const list = getLocalReviews()
  const target = list.find((r) => r.id === id)
  if (target) {
    target.status = 'rejected'
    target.isFeatured = false
    saveLocalReviews(list)
    return true
  }
  return false
}

/**
 * Toggle Featured Status
 */
export async function toggleFeaturedReview(id: string, isFeatured?: boolean): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ isFeatured }),
    })
    if (res.ok) return true
  } catch (err) {}

  const list = getLocalReviews()
  const target = list.find((r) => r.id === id)
  if (target) {
    target.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !target.isFeatured
    if (target.isFeatured && target.status !== 'approved') {
      target.status = 'approved'
    }
    saveLocalReviews(list)
    return true
  }
  return false
}

/**
 * Delete Review
 */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (res.ok) return true
  } catch (err) {}

  const list = getLocalReviews()
  const updated = list.filter((r) => r.id !== id)
  saveLocalReviews(updated)
  return true
}

/**
 * Update Review (Admin)
 */
export async function updateReviewAdmin(
  id: string,
  payload: Partial<Review>
): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) return true
  } catch (err) {}

  const list = getLocalReviews()
  const target = list.find((r) => r.id === id)
  if (target) {
    Object.assign(target, payload, { updatedAt: new Date().toISOString() })
    saveLocalReviews(list)
    return true
  }
  return false
}
