import React, { useState } from 'react'
import type { ProductReview } from '@/services/reviewService'
import { ReviewPhotoLightbox } from './ReviewPhotoLightbox'
import { markReviewHelpful } from '@/services/reviewService'

interface ReviewCardProps {
  review: ProductReview
  isAuthenticated: boolean
}

const getInitials = (name: string): string => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const StarDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({
  rating,
  size = 'sm',
}) => {
  const cls = size === 'md' ? 'text-base' : 'text-sm'
  return (
    <div className={`flex items-center gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </div>
  )
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, isAuthenticated }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0)
  const [hasVoted, setHasVoted] = useState(false)
  const [votingLoading, setVotingLoading] = useState(false)

  const imageUrls = (review.images || []).map((img) => img.url)

  const handleHelpful = async () => {
    if (!isAuthenticated || hasVoted || votingLoading) return
    setVotingLoading(true)
    const result = await markReviewHelpful(review.id)
    if (result.success) {
      setHelpfulCount((c) => c + 1)
      setHasVoted(true)
    }
    setVotingLoading(false)
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(review.createdAt))

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {review.avatarUrl ? (
              <img
                src={review.avatarUrl}
                alt={review.customerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                {getInitials(review.customerName)}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{review.customerName}</p>
              {review.location && (
                <p className="text-[11px] text-gray-400 mt-0.5">📍 {review.location}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StarDisplay rating={review.rating} />
            {review.isVerifiedPurchase && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                ✓ Verified Purchase
              </span>
            )}
          </div>
        </div>

        {/* Review title */}
        {review.title && (
          <h4 className="font-bold text-gray-900 text-sm leading-snug">{review.title}</h4>
        )}

        {/* Review body */}
        {review.review && (
          <p className="text-gray-600 text-sm leading-relaxed">"{review.review}"</p>
        )}

        {/* Photo grid */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all flex-shrink-0 group relative"
              >
                <img
                  src={url}
                  alt={`Review photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {idx === 3 && imageUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm rounded-xl">
                    +{imageUrls.length - 4}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer: Date + Helpful */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">{formattedDate}</span>
          <button
            onClick={handleHelpful}
            disabled={hasVoted || !isAuthenticated || votingLoading}
            title={!isAuthenticated ? 'Login to mark as helpful' : hasVoted ? 'Already voted' : 'Mark as helpful'}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
              hasVoted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                : !isAuthenticated
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 cursor-pointer'
            }`}
          >
            <span>{hasVoted ? '👍' : '👍'}</span>
            <span>Helpful</span>
            {helpfulCount > 0 && (
              <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">
                {helpfulCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && imageUrls.length > 0 && (
        <ReviewPhotoLightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
