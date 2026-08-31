import type { PaymentMethod, PaymentStatus } from '@/types'

const STORAGE_KEY = 'bd_commerce_payment_methods'
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/payment-methods`
  : 'http://localhost:5000/api/payment-methods'

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    icon: '💵',
    enabled: true,
    displayOrder: 1,
    ctaText: 'Place Order — Cash on Delivery',
    subtitle: 'Pay cash when your package arrives.',
    badge: 'Popular',
  },
  {
    id: 'bkash',
    name: 'bKash',
    type: 'mobile_banking',
    icon: '🌸',
    enabled: true,
    displayOrder: 2,
    environment: 'sandbox',
    merchantId: 'BKASH_DEMO_MERCHANT',
    ctaText: 'Pay with bKash',
    subtitle: 'Direct bKash online payment gateway',
    badge: 'Fast',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    type: 'mobile_banking',
    icon: '🔶',
    enabled: true,
    displayOrder: 3,
    environment: 'sandbox',
    merchantId: 'NAGAD_DEMO_MERCHANT',
    ctaText: 'Pay with Nagad',
    subtitle: 'Direct Nagad online payment gateway',
    badge: 'Fast',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    type: 'mobile_banking',
    icon: '🚀',
    enabled: true,
    displayOrder: 4,
    environment: 'sandbox',
    merchantId: 'ROCKET_DEMO_MERCHANT',
    ctaText: 'Pay with Rocket',
    subtitle: 'Direct DBBL Rocket online payment gateway',
    badge: 'Secure',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    type: 'card',
    icon: '💳',
    enabled: true,
    displayOrder: 5,
    environment: 'sandbox',
    merchantId: 'CARD_GATEWAY_DEMO',
    ctaText: 'Pay Securely',
    subtitle: '256-Bit SSL Encrypted Card Gateway',
    badge: 'Instant',
  },
]

// ── Helpers ───────────────────────────────────────────────────────
function getLocalMethods(): PaymentMethod[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS))
      return DEFAULT_PAYMENT_METHODS
    }
    const parsed: PaymentMethod[] = JSON.parse(raw)
    return parsed.sort((a, b) => a.displayOrder - b.displayOrder)
  } catch {
    return DEFAULT_PAYMENT_METHODS
  }
}

function saveLocalMethods(methods: PaymentMethod[]): void {
  try {
    const sorted = [...methods].sort((a, b) => a.displayOrder - b.displayOrder)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
  } catch {}
}

function getToken(): string {
  return localStorage.getItem('bd_commerce_token') || ''
}

// ── GET all payment methods (Admin) ──────────────────────────────
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.paymentMethods)) {
          saveLocalMethods(data.paymentMethods)
          return data.paymentMethods.sort(
            (a: PaymentMethod, b: PaymentMethod) => a.displayOrder - b.displayOrder
          )
        }
      }
    } catch {}
  }

  return getLocalMethods()
}

// ── GET only enabled payment methods (Checkout) ──────────────────
export async function getEnabledPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const res = await fetch(`${API_BASE}?enabled=true`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.paymentMethods)) {
        return data.paymentMethods
          .filter((m: PaymentMethod) => m.enabled)
          .sort((a: PaymentMethod, b: PaymentMethod) => a.displayOrder - b.displayOrder)
      }
    }
  } catch {}

  const all = getLocalMethods()
  return all
    .filter((m) => m.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

// ── GET single payment method ────────────────────────────────────
export async function getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
  const all = await getPaymentMethods()
  return all.find((m) => m.id === id) || null
}

// ── UPDATE payment method (Admin) ────────────────────────────────
export async function updatePaymentMethod(
  id: string,
  data: Partial<PaymentMethod>
): Promise<{ success: boolean; method?: PaymentMethod; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.paymentMethod) {
          const all = getLocalMethods().map((m) =>
            m.id === id ? { ...m, ...json.paymentMethod } : m
          )
          saveLocalMethods(all)
          return { success: true, method: json.paymentMethod, message: 'Payment method updated.' }
        }
      }
    } catch {}
  }

  // Local fallback
  const all = getLocalMethods()
  const idx = all.findIndex((m) => m.id === id)
  if (idx === -1) return { success: false, message: 'Payment method not found.' }

  const updated: PaymentMethod = {
    ...all[idx],
    ...data,
  }
  all[idx] = updated
  saveLocalMethods(all)
  return { success: true, method: updated, message: 'Payment method updated successfully.' }
}

// ── TOGGLE payment method enabled/disabled (Admin) ───────────────
export async function togglePaymentMethod(
  id: string,
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const endpoint = `${API_BASE}/${id}/${enabled ? 'enable' : 'disable'}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const all = getLocalMethods().map((m) => (m.id === id ? { ...m, enabled } : m))
        saveLocalMethods(all)
        return {
          success: true,
          message: `${id} is now ${enabled ? 'enabled' : 'disabled'}.`,
        }
      }
    } catch {}
  }

  // Local fallback
  const all = getLocalMethods().map((m) => (m.id === id ? { ...m, enabled } : m))
  saveLocalMethods(all)
  return {
    success: true,
    message: `Payment method ${enabled ? 'enabled' : 'disabled'} successfully.`,
  }
}

// ── REORDER payment methods (Admin) ──────────────────────────────
export async function reorderPaymentMethods(
  orderedIds: string[]
): Promise<{ success: boolean; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedIds }),
      })
      if (res.ok) {
        const all = getLocalMethods()
        const reordered = orderedIds
          .map((id, index) => {
            const item = all.find((m) => m.id === id)
            return item ? { ...item, displayOrder: index + 1 } : null
          })
          .filter(Boolean) as PaymentMethod[]
        saveLocalMethods(reordered)
        return { success: true, message: 'Order updated successfully.' }
      }
    } catch {}
  }

  // Local fallback
  const all = getLocalMethods()
  const reordered = orderedIds
    .map((id, index) => {
      const item = all.find((m) => m.id === id)
      return item ? { ...item, displayOrder: index + 1 } : null
    })
    .filter(Boolean) as PaymentMethod[]

  saveLocalMethods(reordered)
  return { success: true, message: 'Display order updated successfully.' }
}

// ── MOVE up or down single method (Admin) ────────────────────────
export async function movePaymentMethodOrder(
  id: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; message: string }> {
  const all = getLocalMethods()
  const index = all.findIndex((m) => m.id === id)
  if (index === -1) return { success: false, message: 'Method not found.' }

  if (direction === 'up' && index > 0) {
    const temp = all[index]
    all[index] = all[index - 1]
    all[index - 1] = temp
  } else if (direction === 'down' && index < all.length - 1) {
    const temp = all[index]
    all[index] = all[index + 1]
    all[index + 1] = temp
  } else {
    return { success: true, message: 'No change in position.' }
  }

  const updatedIds = all.map((m) => m.id)
  return reorderPaymentMethods(updatedIds)
}

// ── RESET to factory defaults (Admin) ────────────────────
export function resetDefaultPaymentMethods(): PaymentMethod[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS))
  return DEFAULT_PAYMENT_METHODS
}

// ── INITIALIZE ONLINE PAYMENT GATEWAY SESSION ─────────────────────
export interface PaymentInitParams {
  methodId: string
  amount: number
  orderId?: string
  customerInfo?: {
    name: string
    email: string
    phone: string
  }
}

export interface PaymentInitResponse {
  success: boolean
  paymentId: string
  gatewaySessionUrl?: string
  status: PaymentStatus
  message: string
}

export async function initializePayment(
  params: PaymentInitParams
): Promise<PaymentInitResponse> {
  // Simulate network request to POST /api/payments/initialize
  await new Promise((r) => setTimeout(r, 800))

  const paymentId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

  if (params.methodId === 'cod') {
    return {
      success: true,
      paymentId,
      status: 'unpaid',
      message: 'Cash on Delivery order session initiated.',
    }
  }

  return {
    success: true,
    paymentId,
    gatewaySessionUrl: `https://checkout.pay-gateway.com/session/${paymentId}?amount=${params.amount}`,
    status: 'processing',
    message: `Secure ${params.methodId.toUpperCase()} gateway session created.`,
  }
}

// ── VERIFY PAYMENT WITH BACKEND (Simulated Backend Webhook/Verify) ──
export async function verifyPayment(
  paymentId: string,
  simulateResult: 'success' | 'failed' = 'success'
): Promise<{ success: boolean; status: PaymentStatus; trxId?: string; message: string }> {
  // Simulate POST /api/payments/:paymentId/verify
  await new Promise((r) => setTimeout(r, 1200))

  if (simulateResult === 'success') {
    const randomTrx = 'TRX-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    return {
      success: true,
      status: 'paid',
      trxId: randomTrx,
      message: `Payment ${paymentId} verified and confirmed by payment gateway.`,
    }
  }

  return {
    success: false,
    status: 'failed',
    message: `Payment ${paymentId} verification failed or was cancelled by user.`,
  }
}

// ── GET PAYMENT STATUS (GET /api/payments/:id/status) ────────────
export async function getPaymentStatus(
  paymentId: string
): Promise<{ status: PaymentStatus; message: string }> {
  return {
    status: 'paid',
    message: `Payment ${paymentId} status verified.`,
  }
}
