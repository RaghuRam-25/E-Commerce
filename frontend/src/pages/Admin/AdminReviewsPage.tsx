import React, { useState, useEffect } from 'react'
import {
  getAllReviewsAdmin,
  getReviewStatsAdmin,
  approveReview,
  rejectReview,
  toggleFeaturedReview,
  deleteReview,
  updateReviewAdmin,
} from '@/services/reviewService'
import type { Review, ReviewStats } from '@/services/reviewService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ReviewPhotoLightbox } from '@/components/products/ReviewPhotoLightbox'

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 5.0,
    featuredCount: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const [editFormData, setEditFormData] = useState<{
    customerName: string
    location: string
    title: string
    review: string
    rating: number
    status: 'pending' | 'approved' | 'rejected'
    isFeatured: boolean
  }>({
    customerName: '',
    location: '',
    title: '',
    review: '',
    rating: 5,
    status: 'pending',
    isFeatured: false,
  })

  useEffect(() => {
    loadData()
  }, [search, statusFilter, ratingFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [revs, st] = await Promise.all([
        getAllReviewsAdmin(statusFilter, ratingFilter, search),
        getReviewStatsAdmin(),
      ])
      setReviews(revs)
      setStats(st)
    } catch (e) {
      console.error('Failed to load review management data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    const ok = await approveReview(id)
    if (ok) loadData()
  }

  const handleReject = async (id: string) => {
    const ok = await rejectReview(id)
    if (ok) loadData()
  }

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const ok = await toggleFeaturedReview(id, !currentFeatured)
    if (ok) loadData()
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    const ok = await deleteReview(deleteTargetId)
    if (ok) {
      setDeleteTargetId(null)
      loadData()
    }
  }

  const handleOpenEdit = (rev: Review) => {
    setEditingReview(rev)
    setEditFormData({
      customerName: rev.customerName,
      location: rev.location || '',
      title: rev.title || '',
      review: rev.review,
      rating: rev.rating,
      status: rev.status,
      isFeatured: rev.isFeatured,
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview) return

    const ok = await updateReviewAdmin(editingReview.id, editFormData)
    if (ok) {
      setEditingReview(null)
      loadData()
    }
  }

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h1 className="text-xl font-black text-gray-900">Customer Reviews</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Approve, reject, feature, and manage all customer reviews.
          </p>
        </div>
      </div>

      {/* Review Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
          <p className="text-[11px] text-gray-500 font-semibold">Total Reviews</p>
          <p className="text-xl font-black text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
          <p className="text-[11px] text-gray-500 font-semibold">Avg Rating</p>
          <p className="text-xl font-black text-amber-500 mt-1">★ {stats.averageRating}</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-amber-200 bg-amber-50/50 shadow-sm">
          <p className="text-[11px] text-amber-700 font-bold">Pending</p>
          <p className="text-xl font-black text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <p className="text-[11px] text-emerald-700 font-bold">Approved</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-rose-200 bg-rose-50/50 shadow-sm">
          <p className="text-[11px] text-rose-700 font-bold">Rejected</p>
          <p className="text-xl font-black text-rose-600 mt-1">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-purple-200 bg-purple-50/50 shadow-sm">
          <p className="text-[11px] text-purple-700 font-bold">Featured</p>
          <p className="text-xl font-black text-purple-600 mt-1">{stats.featuredCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by customer, product, review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Status:</span>
            <div className="w-36">
              <Select
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                onChange={(val) => setStatusFilter(val)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Rating:</span>
            <div className="w-32">
              <Select
                value={ratingFilter}
                options={[
                  { value: 'all', label: 'All Stars' },
                  { value: '5', label: '5 Stars ★' },
                  { value: '4', label: '4 Stars ★' },
                  { value: '3', label: '3 Stars ★' },
                  { value: '2', label: '2 Stars ★' },
                  { value: '1', label: '1 Star ★' },
                ]}
                onChange={(val) => setRatingFilter(val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No reviews found matching your filters.
          </div>
        ) : (
          reviews.map((rev) => {
            const imageUrls = (rev.images || []).map((img) => img.url)
            return (
              <div
                key={rev.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Customer info */}
                  <div className="flex items-center gap-3">
                    {rev.avatarUrl ? (
                      <img
                        src={rev.avatarUrl}
                        alt={rev.customerName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {getInitials(rev.customerName)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{rev.customerName}</p>
                      {rev.location && (
                        <p className="text-[10px] text-gray-400">📍 {rev.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Status badge + date */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        rev.status === 'approved'
                          ? 'default'
                          : rev.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {rev.status.toUpperCase()}
                    </Badge>
                    {rev.isVerifiedPurchase && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                        ✓ Verified
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Product info */}
                {rev.productName && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    {rev.productImage && (
                      <img
                        src={rev.productImage}
                        alt={rev.productName}
                        className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Product</p>
                      <p className="text-xs font-bold text-gray-700">{rev.productName}</p>
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-sm ${s <= rev.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                  ))}
                  <span className="text-[11px] text-gray-500 ml-1">({rev.rating}/5)</span>
                </div>

                {/* Title */}
                {rev.title && (
                  <p className="font-bold text-gray-900 text-sm">"{rev.title}"</p>
                )}

                {/* Review text */}
                {rev.review && (
                  <p className="text-gray-600 text-sm italic">"{rev.review}"</p>
                )}

                {/* Photos */}
                {imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => openLightbox(imageUrls, idx)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all flex-shrink-0"
                      >
                        <img
                          src={url}
                          alt={`Review photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    <span className="text-[10px] text-gray-400 self-center ml-1">
                      {imageUrls.length} photo{imageUrls.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50">
                  {/* Featured toggle */}
                  <button
                    onClick={() => handleToggleFeatured(rev.id, rev.isFeatured)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                      rev.isFeatured
                        ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {rev.isFeatured ? '✨ Featured' : '+ Feature'}
                  </button>

                  <div className="flex gap-3 ml-auto">
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(rev.id)}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Approve
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(rev.id)}
                        className="text-xs font-bold text-amber-600 hover:underline"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(rev)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(rev.id)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxImages && (
        <ReviewPhotoLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Edit Review</h3>
              <button onClick={() => setEditingReview(null)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>

            {/* Show photos in edit modal */}
            {editingReview.images && editingReview.images.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Review Photos</p>
                <div className="flex flex-wrap gap-2">
                  {editingReview.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(editingReview.images!.map(i => i.url), idx)}
                      className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 transition-all"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <Input
                label="Customer Name *"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                required
              />
              <Input
                label="Location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
              <Input
                label="Review Title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditFormData({ ...editFormData, rating: star })}
                      className={`text-xl ${star <= editFormData.rating ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Review Text</label>
                <textarea
                  rows={4}
                  value={editFormData.review}
                  onChange={(e) => setEditFormData({ ...editFormData, review: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <Select
                label="Status *"
                value={editFormData.status}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                onChange={(val) =>
                  setEditFormData({
                    ...editFormData,
                    status: val as 'pending' | 'approved' | 'rejected',
                  })
                }
              />
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isFeatured}
                    onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Featured on Homepage
                </label>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingReview(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1 font-bold">
                  Save Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="text-4xl">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900">Delete Review</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} className="flex-1">
                Delete Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage
