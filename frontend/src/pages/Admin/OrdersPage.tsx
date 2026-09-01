import React, { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { OrderDetailDrawer } from '@/components/admin/OrderDetailDrawer'
import {
  adminGetOrders,
  adminApproveOrder,
  adminRejectOrder,
  adminUpdateOrderStatus,
} from '@/services/orderService'
import type { Order } from '@/types'

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'returned', label: 'Returned' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const STATUS_BADGE: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'accent'; label: string }> = {
  pending: { variant: 'secondary', label: 'Pending' },
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

const PAYMENT_BADGE: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'accent'; label: string }> = {
  unpaid: { variant: 'outline', label: 'Unpaid' },
  partially_paid: { variant: 'secondary', label: 'Partially Paid' },
  pending: { variant: 'secondary', label: 'Pending' },
  processing: { variant: 'secondary', label: 'Processing' },
  paid: { variant: 'accent', label: 'Paid' },
  failed: { variant: 'destructive', label: 'Failed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  refunded: { variant: 'outline', label: 'Refunded' },
}

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null)

  const [showApproveConfirm, setShowApproveConfirm] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminGetOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 15,
      })
      setOrders(res.orders)
      setTotalOrders(res.total)
      setTotalPages(res.pages)
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter, searchQuery, currentPage])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, paymentFilter])

  const handleApprove = async (orderId: string) => {
    setActionLoading(true)
    try {
      await adminApproveOrder(orderId)
      showToast('success', 'Order approved successfully.')
      setShowApproveConfirm(null)
      fetchOrders()
      if (drawerOrder?.id === orderId) {
        setDrawerOrder(null)
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve order.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (orderId: string) => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      await adminRejectOrder(orderId, rejectReason)
      showToast('success', 'Order rejected.')
      setShowRejectModal(null)
      setRejectReason('')
      fetchOrders()
      if (drawerOrder?.id === orderId) {
        setDrawerOrder(null)
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject order.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(true)
    try {
      await adminUpdateOrderStatus(orderId, newStatus)
      showToast('success', `Order status updated to '${newStatus}'.`)
      setSelectedOrder(null)
      fetchOrders()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentBadge = (status: string) => {
    const config = PAYMENT_BADGE[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-xs font-bold text-white transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review, approve, and manage customer orders</p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
          {totalOrders} total order{totalOrders !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Input
          placeholder="Search order ID, name, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          value={statusFilter}
          options={ORDER_STATUS_OPTIONS}
          onChange={(val) => setStatusFilter(val)}
        />
        <Select
          value={paymentFilter}
          options={PAYMENT_STATUS_OPTIONS}
          onChange={(val) => setPaymentFilter(val)}
        />
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          ↻ Refresh
        </Button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 ${order.status === 'pending' ? 'bg-amber-50/40' : ''}`}>
                  <td className="p-3">
                    <span className="font-mono font-bold text-gray-900">{order.orderNumber || order.id.slice(-8)}</span>
                    {order.status === 'pending' && (
                      <span className="ml-1.5 inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Awaiting approval" />
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400">{order.customerPhone}</p>
                  </td>
                  <td className="p-3 font-bold text-emerald-600">
                    ৳{order.total.toLocaleString()}
                  </td>
                  <td className="p-3">
                    {getPaymentBadge(order.paymentStatus)}
                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{order.paymentMethodName || order.paymentMethod}</p>
                  </td>
                  <td className="p-3">{getStatusBadge(order.status)}</td>
                  <td className="p-3 text-[11px] text-gray-500">{order.orderDate || new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setDrawerOrder(order)}
                      className="text-[11px] text-emerald-600 hover:underline font-bold"
                    >
                      View Details
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setShowApproveConfirm(order.id)}
                          className="text-[11px] text-emerald-700 hover:underline font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectModal(order.id)}
                          className="text-[11px] text-rose-600 hover:underline font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Quick Status Change Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Update Order #{selectedOrder.orderNumber || selectedOrder.id.slice(-8)}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg text-gray-600">
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Total:</strong> ৳{selectedOrder.total.toLocaleString()}</p>
              <p><strong>Current Status:</strong> {selectedOrder.status}</p>
            </div>

            <div className="space-y-3">
              <Select
                label="New Status"
                value={selectedOrder.status}
                options={[
                  { value: 'approved', label: 'Approved' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                onChange={(val) => {
                  if (val && val !== selectedOrder.status) {
                    handleStatusUpdate(selectedOrder.id, val)
                  }
                }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Approve Order</h3>
              <button onClick={() => setShowApproveConfirm(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to approve this order? This action will confirm the order and move it to processing.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowApproveConfirm(null)} className="flex-1" disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleApprove(showApproveConfirm)} className="flex-1" disabled={actionLoading}>
                {actionLoading ? 'Approving...' : '✓ Confirm Approval'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Reject Order</h3>
              <button onClick={() => { setShowRejectModal(null); setRejectReason('') }} className="text-gray-400 font-bold text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-600">Please provide a reason for rejecting this order.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Product currently unavailable, fraudulent order..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowRejectModal(null); setRejectReason('') }} className="flex-1" disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleReject(showRejectModal)} className="flex-1" disabled={actionLoading || !rejectReason.trim()}>
                {actionLoading ? 'Rejecting...' : '✕ Reject Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      {drawerOrder && (
        <OrderDetailDrawer
          orderId={drawerOrder.id}
          onClose={() => setDrawerOrder(null)}
          onApprove={(id) => { setShowApproveConfirm(id); setDrawerOrder(null) }}
          onReject={(id) => { setShowRejectModal(id); setDrawerOrder(null) }}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  )
}

export default AdminOrdersPage
