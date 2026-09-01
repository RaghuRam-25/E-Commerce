// Shared order status helpers (frontend)
export interface StatusMeta {
  value: string
  label: string
  variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'accent'
  color: string
  timelineIcon: 'done' | 'current' | 'todo'
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  approved: 'Approved',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  returned: 'Returned',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

// Normal forward fulfillment flow (used by the tracking timeline)
export const TIMELINE_ORDER: string[] = [
  'pending',
  'approved',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
]

export const TIMELINE_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  approved: 'Approved',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

// Allowed transitions (must mirror backend ORDER_STATUSES / STATUS_TRANSITIONS)
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'cancelled', 'rejected'],
  confirmed: ['processing', 'cancelled'],
  approved: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  rejected: [],
  returned: [],
}

export const ALL_STATUSES: string[] = [
  'pending',
  'confirmed',
  'approved',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
  'returned',
]

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] || status
}

export function getAvailableTransitions(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}
