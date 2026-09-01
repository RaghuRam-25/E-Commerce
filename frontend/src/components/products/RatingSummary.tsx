import React from 'react'
import type { ReviewSummary } from '@/services/reviewService'

interface RatingSummaryProps {
  summary: ReviewSummary
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  summary,
  activeFilter,
  onFilterChange,
}) => {
  const { averageRating, totalCount, distribution } = summary

  if (!summary || totalCount === 0) {
    return null
  }

  const starOrder = [5, 4, 3, 2, 1] as const
  const filledStars = Math.round(averageRating)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Average score */}
        <div className="flex-shrink-0 text-center sm:border-r sm:border-gray-100 sm:pr-6">
          <div className="text-5xl font-black text-gray-900">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-xl ${s <= filledStars ? 'text-amber-400' : 'text-gray-200'}`}>
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Based on {totalCount.toLocaleString()} review{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2 w-full">
          {starOrder.map((star) => {
            const count = distribution[star] || 0
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0

            return (
              <button
                key={star}
                onClick={() => onFilterChange(activeFilter === String(star) ? 'all' : String(star))}
                className={`w-full flex items-center gap-3 group rounded-lg px-2 py-1 transition-colors ${
                  activeFilter === String(star) ? 'bg-amber-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-semibold text-gray-600 w-5 text-right flex-shrink-0">
                  {star}★
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeFilter === String(star) ? 'bg-amber-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 w-8 text-right flex-shrink-0">
                  {pct}%
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
