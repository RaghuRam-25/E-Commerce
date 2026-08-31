export type UserRole = 'customer' | 'admin' | 'super_admin'

export interface SavedAddress {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode?: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  password?: string
  role: UserRole
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface RegisterFormData {
  name: string
  email: string
  phone: string
  password: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  discount: number
  stock: number
  sku: string
  images: string[]
  rating: number
  isFeatured: boolean
  isActive: boolean
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productImage: string
  price: number
  discount: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  totalItems: number
}

export interface Order {
  id: string
  orderNumber?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address?: string
  city?: string
  postalCode?: string
  shippingAddress?: {
    fullName: string
    phone: string
    addressLine: string
    city: string
    district: string
    postalCode?: string
    country: string
  }
  items: OrderItem[]
  subtotal: number
  total: number
  discount: number
  deliveryCharge: number
  deliveryFee?: number
  paymentMethod: string
  paymentMethodName?: string
  paymentStatus: 'unpaid' | 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  paymentId?: string
  trxId?: string
  status: OrderStatus
  notes?: string
  orderDate: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  rejectedBy?: string
  rejectedAt?: string
  activity?: OrderActivity[]
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected' | 'returned'

export interface OrderActivity {
  action: string
  by?: string
  byName?: string
  note?: string
  timestamp: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  isActive: boolean
  totalOrders: number
  totalSpent: number
  orderHistory: OrderSummary[]
}

export interface OrderSummary {
  orderId: string
  total: number
  date: string
  status: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
}

export interface Review {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
}

export interface ShippingInfo {
  fullName: string
  email: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  country: string
}

export type PaymentMethodType = 'cod' | 'mobile_banking' | 'card'

export type PaymentStatus = 'unpaid' | 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentMethod {
  id: string
  name: string
  description?: string
  type: PaymentMethodType
  icon?: string
  enabled: boolean
  displayOrder: number
  instructions?: string
  environment?: 'sandbox' | 'production'
  merchantId?: string
  merchantNumber?: string
  accountType?: 'Merchant' | 'Personal'
  ctaText?: string
  subtitle?: string
  badge?: string
}