import { apiClient } from './apiClient'
import type { Order } from '@/types'

export interface AdminOrdersResponse {
  success: boolean
  total: number
  page: number
  pages: number
  count: number
  orders: Order[]
}

export interface AdminOrderStatsResponse {
  success: boolean
  stats: {
    total: number
    pending: number
    approved: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    rejected: number
    returned: number
    totalRevenue: number
    paymentBreakdown: Record<string, number>
  }
}

export interface SingleOrderResponse {
  success: boolean
  order: Order
}

export async function adminGetOrders(params: {
  status?: string
  paymentStatus?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
} = {}): Promise<AdminOrdersResponse> {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus)
  if (params.search) searchParams.set('search', params.search)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.sort) searchParams.set('sort', params.sort)

  const qs = searchParams.toString()
  return apiClient.get(`/admin/orders${qs ? '?' + qs : ''}`)
}

export async function adminGetOrderById(id: string): Promise<SingleOrderResponse> {
  return apiClient.get(`/admin/orders/${id}`)
}

export async function adminApproveOrder(id: string) {
  return apiClient.patch(`/admin/orders/${id}/approve`)
}

export async function adminRejectOrder(id: string, reason: string) {
  return apiClient.patch(`/admin/orders/${id}/reject`, { reason })
}

export async function adminUpdateOrderStatus(id: string, status: string) {
  return apiClient.patch(`/admin/orders/${id}/status`, { status })
}

export async function adminGetOrderStats(): Promise<AdminOrderStatsResponse> {
  return apiClient.get('/admin/orders/stats')
}

export async function customerGetMyOrders() {
  return apiClient.get('/orders/my')
}

export async function customerGetOrderById(id: string) {
  return apiClient.get(`/orders/${id}`)
}

export interface PlaceOrderInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    fullName: string
    phone: string
    addressLine: string
    city: string
    district: string
    postalCode?: string
    country: string
  }
  items: {
    productId?: string
    productName: string
    productImage?: string
    price: number
    quantity: number
  }[]
  paymentMethod: string
  deliveryCharge: number
  notes?: string
}

export async function placeOrder(input: PlaceOrderInput) {
  return apiClient.post('/orders', input)
}
