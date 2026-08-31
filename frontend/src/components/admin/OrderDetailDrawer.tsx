import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { adminGetOrderById } from '@/services/orderService'
import type { Order, OrderActivity } from '@/types'

interface OrderDetailDrawerProps {
  orderId: string
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200',
}

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'approved', label: 'Order Approved' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  approved: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  rejected: -1,
  returned: -1,
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  orderId,
  onClose,
  onApprove,
  onReject,
  onStatusChange,
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminGetOrderById(orderId)
        setOrder(res.order)
      } catch {
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  const getTimelineStepState = (stepKey: string): 'completed' | 'current' | 'pending' => {
    if (!order) return 'pending'
    if (order.status === 'cancelled' || order.status === 'rejected') {
      if (stepKey === 'pending') return 'completed'
      if (STATUS_ORDER[order.status] !== undefined && STATUS_ORDER[stepKey] <= Math.abs(STATUS_ORDER[order.status])) {
        return 'completed'
      }
      return 'pending'
    }
    const currentIdx = STATUS_ORDER[order.status] ?? -1
    const stepIdx = STATUS_ORDER[stepKey] ?? -1
    if (stepIdx < currentIdx) return 'completed'
    if (stepIdx === currentIdx) return 'current'
    return 'pending'
  }

  const getTransitionStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      pending: ['approved', 'cancelled', 'rejected'],
      confirmed: ['processing', 'cancelled'],
      approved: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
      rejected: [],
      returned: [],
    }
    return transitions[currentStatus] || []
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
        <div className="w-full max-w-lg bg-white h-full shadow-2xl flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const addr = order.shippingAddress
  const isRejected = order.status === 'rejected'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Order #{order.orderNumber || order.id.slice(-8)}
            </h2>
            <p className="text-[11px] text-gray-400">
              Placed on {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => onApprove(order.id)}>
                    ✓ Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onReject(order.id)}>
                    ✕ Reject
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Rejection Notice */}
          {isRejected && order.rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-rose-800">Rejection Reason</p>
              <p className="text-rose-700">{order.rejectionReason}</p>
              {order.rejectedAt && (
                <p className="text-rose-400 text-[10px]">Rejected on {new Date(order.rejectedAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Order Timeline</h3>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const state = getTimelineStepState(step.key)
                const isLast = idx === TIMELINE_STEPS.length - 1
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        state === 'completed' ? 'bg-emerald-500 text-white' :
                        state === 'current' ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 animate-pulse' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {state === 'completed' ? '✓' : state === 'current' ? '●' : '○'}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-6 ${state === 'completed' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-xs font-semibold ${state === 'completed' || state === 'current' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {state === 'current' && (
                        <p className="text-[10px] text-emerald-600 font-medium">Current stage</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Status change for approved/processing orders */}
            {['approved', 'processing', 'shipped'].includes(order.status) && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Select
                  label="Update Status"
                  value={order.status}
                  options={getTransitionStatuses(order.status).map((s) => ({
                    value: s,
                    label: s.charAt(0).toUpperCase() + s.slice(1),
                  }))}
                  onChange={(val) => {
                    if (val) onStatusChange(order.id, val)
                  }}
                />
              </div>
            )}
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Order Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">Order ID</p>
                <p className="font-mono font-bold text-gray-900">{order.orderNumber || order.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-gray-400">Order Date</p>
                <p className="font-semibold text-gray-900">{order.orderDate || new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="font-semibold text-gray-900 capitalize">{order.paymentMethodName || order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Status</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  order.paymentStatus === 'unpaid' ? 'bg-amber-100 text-amber-800' :
                  order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus === 'unpaid' ? '⏳ Unpaid' : order.paymentStatus}
                </span>
              </div>
              {order.trxId && (
                <div className="col-span-2">
                  <p className="text-gray-400">Transaction ID</p>
                  <p className="font-mono font-bold text-emerald-700">{order.trxId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Customer</h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-gray-600">{order.customerEmail}</p>
              <p className="text-gray-600">{order.customerPhone}</p>
            </div>
          </div>

          {/* Delivery Information */}
          {addr && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Delivery Address</h3>
              <div className="text-xs space-y-1 text-gray-700">
                <p className="font-semibold text-gray-900">{addr.fullName}</p>
                <p>{addr.phone}</p>
                <p>{addr.addressLine}</p>
                <p>{addr.city}{addr.district ? `, ${addr.district}` : ''}</p>
                {addr.postalCode && <p>Postal Code: {addr.postalCode}</p>}
                <p>{addr.country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Items</h3>
            <div className="divide-y divide-gray-200">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                  {item.productImage && (
                    <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900 flex-shrink-0">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-semibold">৳{(order.deliveryFee || order.deliveryCharge || 0).toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-emerald-600">৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          {order.activity && order.activity.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Activity Log</h3>
              <div className="space-y-2">
                {[...order.activity].reverse().map((act: OrderActivity, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{act.action}</p>
                      {act.byName && <p className="text-gray-500">by {act.byName}</p>}
                      {act.note && <p className="text-gray-400 italic">"{act.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
              <p className="font-bold text-amber-800 mb-1">Customer Note</p>
              <p className="text-amber-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailDrawer
