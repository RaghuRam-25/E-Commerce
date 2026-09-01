import React, { useState, useRef } from 'react'
import type { ReviewImage, CreateProductReviewPayload } from '@/services/reviewService'
import { createProductReview } from '@/services/reviewService'
import { uploadMultipleImages } from '@/services/uploadService'
import { Button } from '@/components/ui/Button'

interface ReviewFormProps {
  productId: string
  onSuccess: () => void
  onCancel?: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 5
const MAX_PHOTOS = 5

interface PreviewFile {
  file: File
  preview: string
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const [uploadedImages, setUploadedImages] = useState<ReviewImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setMessage(null)

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMessage({ type: 'error', text: `"${file.name}" is not a valid image. Please use JPG, PNG, or WEBP.` })
        return
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setMessage({ type: 'error', text: `"${file.name}" exceeds the 5MB size limit.` })
        return
      }
    }

    const totalAfter = previewFiles.length + files.length
    if (totalAfter > MAX_PHOTOS) {
      setMessage({ type: 'error', text: `You can upload a maximum of ${MAX_PHOTOS} photos per review.` })
      return
    }

    // Create previews
    const newPreviews: PreviewFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPreviewFiles((prev) => [...prev, ...newPreviews])

    // Upload to Cloudinary
    setUploading(true)
    setUploadProgress(20)
    try {
      const uploaded = await uploadMultipleImages(files)
      setUploadProgress(100)
      const newImages: ReviewImage[] = uploaded.map((u) => ({
        url: u.url,
        publicId: u.public_id,
      }))
      setUploadedImages((prev) => [...prev, ...newImages])
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to upload photos. Please try again.' })
      // Remove previews that failed
      setPreviewFiles((prev) => prev.filter((p) => !newPreviews.includes(p)))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemovePhoto = (index: number) => {
    setPreviewFiles((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
    setUploadedImages((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (uploading) {
      setMessage({ type: 'error', text: 'Please wait for photos to finish uploading.' })
      return
    }

    setSubmitting(true)

    const payload: CreateProductReviewPayload = {
      productId,
      rating,
      title: title.trim() || undefined,
      review: reviewText.trim() || undefined,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    }

    const result = await createProductReview(payload)

    setSubmitting(false)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  const displayRating = hoverRating || rating

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? '✓ ' : '⚠ '}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Your Rating *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className={`text-3xl transition-all duration-100 ${
                  star <= displayRating
                    ? 'text-amber-400 scale-110'
                    : 'text-gray-200 hover:text-amber-200'
                }`}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-500">
              {starLabels[displayRating]}
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Review Title
          </label>
          <input
            type="text"
            placeholder="Summarise your review in one line..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none transition-all"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{title.length} / 100</p>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Your Review
          </label>
          <textarea
            rows={4}
            placeholder="Share your experience with this product — quality, fit, delivery, etc..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            maxLength={1000}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none resize-none transition-all"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{reviewText.trim().length} / 1000</p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Add Photos (Optional — Max {MAX_PHOTOS})
          </label>

          {/* Existing previews */}
          {previewFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {previewFiles.map((pf, idx) => (
                <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={pf.preview}
                    alt=""
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-rose-600 transition-colors shadow-sm"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                  {/* Uploading overlay */}
                  {uploading && idx >= uploadedImages.length && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}

              {/* Add more button */}
              {previewFiles.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-all text-2xl"
                >
                  +
                </button>
              )}
            </div>
          )}

          {/* Upload progress bar */}
          {uploading && (
            <div className="mb-3">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Uploading photos...</p>
            </div>
          )}

          {/* Upload drop zone (shown when no photos yet) */}
          {previewFiles.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
            >
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">📷</div>
              <p className="text-xs font-semibold text-gray-500 group-hover:text-emerald-600">
                Click to upload photos
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                JPG, PNG, WEBP — max 5MB each, up to {MAX_PHOTOS} photos
              </p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2 border-t border-gray-50">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || uploading}
            className="flex-1 font-bold"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              '⭐ Submit Review'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
