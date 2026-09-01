import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { OrderTimeline } from '@/components/ui/OrderTimeline'
import { customerGetMyOrders } from '@/services/orderService'
import { getStatusLabel } from '@/services/orderStatus'
import type { Order } from '@/types'

const STATUS_BADGE: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'accent'; label: string }> = {
  pending: { variant: 'secondary', label: 'Pending Review' },
  confirmed: { variant: 'secondary', label: 'Confirmed' },
  approved: { variant: 'accent', label: 'Approved' },
  processing: { variant: 'default', label: 'Processing' },
  shipped: { variant: 'default', label: 'Shipped' },
  out_for_delivery: { variant: 'default', label: 'Out for Delivery' },
  delivered: { variant: 'default', label: 'Delivered' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  returned: { variant: 'outline', label: 'Returned' },
}

const PAYMENT_BADGE: Record<string, { bg: string; label: string }> = {
  unpaid: { bg: 'bg-amber-100 text-amber-800', label: 'Unpaid' },
  partially_paid: { bg: 'bg-amber-100 text-amber-800', label: 'Partially Paid' },
  pending: { bg: 'bg-gray-100 text-gray-800', label: 'Pending' },
  paid: { bg: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
  failed: { bg: 'bg-red-100 text-red-800', label: 'Failed' },
  cancelled: { bg: 'bg-red-100 text-red-800', label: 'Cancelled' },
  refunded: { bg: 'bg-gray-100 text-gray-800', label: 'Refunded' },
}

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await customerGetMyOrders()
        setOrders(res.orders || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter)

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track your current and past orders</p>
        </div>
        <Link to="/products" className="text-xs font-bold text-emerald-600 hover:underline">
          + Continue Shopping
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] bg-white text-amber-700 rounded-full">
                {orders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse h-48" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <p className="text-rose-700 text-sm font-bold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-3">
            Try Again
          </Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto">
            📦
          </div>
          <p className="text-gray-500 text-sm">
            {statusFilter === 'all' ? 'You have no orders yet.' : `No ${statusFilter} orders found.`}
          </p>
          <Link to="/products" className="inline-block">
            <Button variant="primary" size="sm">Browse Products →</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_BADGE[order.status] || { variant: 'secondary' as const, label: order.status }
            const paymentConfig = PAYMENT_BADGE[order.paymentStatus] || { bg: 'bg-gray-100 text-gray-800', label: order.paymentStatus }

            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-900">
                      {order.orderNumber || order.id.slice(-8)}
                    </span>
                    <span className="text-xs text-gray-400 ml-3">
                      {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentConfig.bg}`}>
                      {order.paymentStatus === 'paid' ? '✓' : '⏳'} {paymentConfig.label}
                    </span>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img src={item.productImage} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900">{item.productName}</h4>
                          <p className="text-gray-400">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="py-2 text-xs text-gray-400">+ {order.items.length - 3} more item(s)</p>
                  )}
                </div>

                {/* Rejection notice */}
                {order.status === 'rejected' && order.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                    <p className="font-bold text-rose-800">Rejection Reason: {order.rejectionReason}</p>
                  </div>
                )}

                {/* Order Status Timeline */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Order Tracking</h4>
                  <OrderTimeline status={order.status} />
                </div>

                {/* Payment details */}
                {(() => {
                  const payment = order.payment || {
                    method: order.paymentMethod || 'cod',
                    status: order.paymentStatus || 'unpaid',
                    paidAmount: order.paymentStatus === 'paid' ? order.total : 0,
                    remainingAmount: order.paymentStatus === 'paid' ? 0 : order.total,
                  }
                  const isCod = (payment.method || order.paymentMethod || '').toLowerCase() === 'cod'
                  const remaining = payment.remainingAmount ?? (isCod ? order.total - (payment.paidAmount || 0) : 0)
                  const paidAmount = payment.paidAmount || 0
                  return (
                    <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Order Total</span>
                        <span className="font-bold text-emerald-600">৳{order.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Paid {!isCod ? 'Online' : 'Upfront'}</span>
                        <span className="font-semibold text-emerald-700">৳{paidAmount.toLocaleString()}</span>
                      </div>
                      {isCod && remaining > 0 && (
                        <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="font-bold text-amber-800">💵 Cash to Pay on Delivery</span>
                          <span className="font-black text-amber-900 text-base">৳{remaining.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-gray-500">
                          {order.shippingAddress
                            ? `${order.shippingAddress.city}, ${order.shippingAddress.district}`
                            : order.city || 'N/A'}
                        </span>
                        <button
                          onClick={() => setExpandedOrder(order.id === expandedOrder ? null : order.id)}
                          className="text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          {expandedOrder === order.id ? 'Hide Details ▲' : `Status: ${getStatusLabel(order.status)} ▾`}
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* Status history */}
                {expandedOrder === order.id && order.statusHistory && order.statusHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 text-xs">
                    <h4 className="font-bold text-gray-700 mb-2 uppercase tracking-wider">Status History</h4>
                    <div className="space-y-1.5">
                      {[...order.statusHistory].reverse().map((h, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600">
                          <span className="font-semibold capitalize">{h.status.replace(/_/g, ' ')}</span>
                          <span className="text-gray-400">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerOrdersPage
