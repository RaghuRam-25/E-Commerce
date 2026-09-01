import React from 'react'
import {
  TIMELINE_ORDER,
  TIMELINE_LABELS,
  getStatusLabel,
} from '@/services/orderStatus'

interface OrderTimelineProps {
  status: string
}

// Renders the professional order tracking component:
//   ✓ Order Placed
//      ↓
//   ✓ Approved
//   ...
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  const statusKey = status || 'pending'
  const cancelled = statusKey === 'cancelled' || statusKey === 'rejected'

  const currentIndex = cancelled
    ? -1
    : TIMELINE_ORDER.indexOf(statusKey)

  const getState = (stepKey: string): 'completed' | 'current' | 'todo' => {
    const stepIdx = TIMELINE_ORDER.indexOf(stepKey)
    if (cancelled) return 'todo'
    if (stepIdx < currentIndex) return 'completed'
    if (stepIdx === currentIndex) return 'current'
    return 'todo'
  }

  return (
    <div className="w-full">
      {cancelled && (
        <div className="mb-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          This order was {statusKey}. Tracked progress is paused.
        </div>
      )}
      <div className="flex flex-col">
        {TIMELINE_ORDER.map((stepKey, idx) => {
          const state = getState(stepKey)
          const isLast = idx === TIMELINE_ORDER.length - 1
          return (
            <div key={stepKey} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    state === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : state === 'current'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {state === 'completed' ? '✓' : state === 'current' ? '●' : '○'}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 ${state === 'completed' ? 'h-7 bg-emerald-400' : 'h-7 bg-gray-200'}`}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={`text-xs font-semibold ${
                    state === 'completed' || state === 'current' ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {TIMELINE_LABELS[stepKey]}
                </p>
                {state === 'current' && (
                  <p className="text-[10px] text-emerald-600 font-medium">Current stage</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-400 pt-1">
        Current status:{' '}
        <span className="font-bold text-gray-700">{getStatusLabel(statusKey)}</span>
      </p>
    </div>
  )
}
