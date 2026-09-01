import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { OrderTimeline } from '@/components/ui/OrderTimeline'
import { PaymentSummary } from '@/components/ui/PaymentSummary'
import {
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminMarkOrderPaid,
} from '@/services/orderService'
import { getStatusLabel, getAvailableTransitions } from '@/services/orderStatus'
import type { Order, OrderActivity } from '@/types'

interface OrderDetailDrawerProps {
  orderId: string
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRefresh?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200',
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  orderId,
  onClose,
  onApprove,
  onReject,
  onRefresh,
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminGetOrderById(orderId)
        setOrder(res.order)
        setSelectedStatus(res.order.status || '')
      } catch {
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, onClose])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return
    setUpdating(true)
    try {
      const res = await adminUpdateOrderStatus(order.id, selectedStatus)
      showToast('success', res.message || `Status updated to '${selectedStatus}'.`)
      const nextStatus = res.order?.status || selectedStatus
      setSelectedStatus(nextStatus)
      setOrder(res.order)
      if (onRefresh) onRefresh()
    } catch (err: any) {
      const msg = err?.message || 'Failed to update status.'
      showToast('error', msg)
      try {
        const fresh = await adminGetOrderById(order.id)
        setOrder(fresh.order)
        setSelectedStatus(fresh.order?.status || '')
      } catch {
        /* keep current state if refetch fails */
      }
      if (onRefresh) onRefresh()
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!order) return
    setUpdating(true)
    try {
      const res = await adminMarkOrderPaid(order.id)
      showToast('success', 'Order marked as paid.')
      setOrder(res.order)
      if (onRefresh) onRefresh()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to mark order as paid.')
    } finally {
      setUpdating(false)
    }
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
  const availableTransitions = getAvailableTransitions(order.status)
  const canChangeStatus = availableTransitions.length > 0
  const items = Array.isArray(order.items) ? order.items : []
  const orderDisplayId = order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')
  const orderDisplayDate = order.orderDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '')
  const payment = order.payment || {
    method: order.paymentMethod || 'cod',
    status: order.paymentStatus || 'unpaid',
    paidAmount: order.paymentStatus === 'paid' ? order.total : 0,
    remainingAmount: order.paymentStatus === 'paid' ? 0 : order.total,
  }
  const isCod = (payment.method || order.paymentMethod || '').toLowerCase() === 'cod'
  const isPaid = payment.status === 'paid'

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
              Order #{orderDisplayId}
            </h2>
            <p className="text-[11px] text-gray-400">
              Placed on {orderDisplayDate}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        {toast && (
          <div className={`px-4 py-2 text-xs font-bold text-white text-center ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        )}

        <div className="p-4 space-y-5">
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {getStatusLabel(order.status)}
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
            <OrderTimeline status={order.status} />
          </div>

          {/* ── Change Status (Requirement 4, 13) ─────────────── */}
          {canChangeStatus && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Change Status</h3>
              <p className="text-[11px] text-gray-500">
                Current: <span className="font-bold text-gray-800">{getStatusLabel(order.status)}</span>
              </p>
              <Select
                label="Select New Status"
                value={selectedStatus}
                options={[
                  { value: order.status, label: `${getStatusLabel(order.status)} (current)` },
                  ...availableTransitions.map((s) => ({ value: s, label: getStatusLabel(s) })),
                ]}
                onChange={(val) => setSelectedStatus(val)}
              />
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                disabled={updating || selectedStatus === order.status}
                onClick={handleUpdateStatus}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          )}

          {/* ── Mark as Paid (COD) ────────────────────────────── */}
          {isCod && !isPaid && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Collection</h3>
              <p className="text-[11px] text-gray-500">
                When the courier/admin collects the remaining{' '}
                <span className="font-bold text-amber-800">৳{(payment.remainingAmount || 0).toLocaleString()}</span>,
                mark the order as paid.
              </p>
              <Button variant="primary" size="sm" className="w-full" disabled={updating} onClick={handleMarkPaid}>
                {updating ? 'Saving...' : '✓ Mark as Paid (Collected)'}
              </Button>
            </div>
          )}

          {/* Order Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Order Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">Order ID</p>
                <p className="font-mono font-bold text-gray-900">{orderDisplayId}</p>
              </div>
              <div>
                <p className="text-gray-400">Order Date</p>
                <p className="font-semibold text-gray-900">{orderDisplayDate}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="font-semibold text-gray-900 capitalize">{order.paymentMethodName || order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Status</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  payment.status === 'partially_paid' ? 'bg-amber-100 text-amber-800' :
                  payment.status === 'unpaid' ? 'bg-gray-100 text-gray-700' :
                  payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status === 'paid' ? '✓ Paid' : payment.status === 'partially_paid' ? 'Partially Paid' : payment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <PaymentSummary order={order} />

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
              {items.map((item, idx) => (
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

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Status History</h3>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">
                      {new Date(h.changedAt).toLocaleString()}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{h.status.replace(/_/g, ' ')}</p>
                      <p className="text-gray-500">by {h.changedByName || h.changedByRole || 'system'}</p>
                      {h.note && <p className="text-gray-400 italic">"{h.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
