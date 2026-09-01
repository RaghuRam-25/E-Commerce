import React from 'react'
import type { Order } from '@/types'
import { getPaymentStatusLabel } from '@/services/orderStatus'

interface PaymentSummaryProps {
  order: Order
  showPaymentStatus?: boolean
}

/**
 * Financial breakdown for an order. Amounts are calculated and stored
 * on the backend — the UI only displays them.
 */
export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  order,
  showPaymentStatus = true,
}) => {
  const subtotal = order.subtotal || 0
  const shipping = (order.deliveryFee ?? order.deliveryCharge) || 0
  const codCharge = order.codCharge || 0
  const discount = order.discount || 0
  const total = order.total || 0

  // Prefer the structured payment object when available
  const payment = order.payment || {
    method: order.paymentMethod || 'cod',
    status: order.paymentStatus || 'unpaid',
    paidAmount: order.paymentStatus === 'paid' ? total : 0,
    remainingAmount: order.paymentStatus === 'paid' ? 0 : total,
    transactionId: order.trxId || order.paymentId || '',
  }

  const paidAmount = payment.paidAmount || 0
  const remainingAmount = payment.remainingAmount != null ? payment.remainingAmount : total - paidAmount
  const isCod = (payment.method || order.paymentMethod || '').toLowerCase() === 'cod'

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
      <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
        Payment Summary
        {showPaymentStatus && (
          <span
            className={`ml-2 normal-case font-bold px-2 py-0.5 rounded-full text-[10px] ${
              payment.status === 'paid'
                ? 'bg-emerald-100 text-emerald-800'
                : payment.status === 'partially_paid'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {getPaymentStatusLabel(payment.status)}
          </span>
        )}
      </h3>

      <div className="flex justify-between text-gray-600">
        <span>Product Subtotal</span>
        <span className="font-semibold">৳{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Shipping Charge</span>
        <span className="font-semibold">৳{shipping.toLocaleString()}</span>
      </div>
      {isCod && (
        <div className="flex justify-between text-gray-600">
          <span>COD / Courier Charge</span>
          <span className="font-semibold">৳{codCharge.toLocaleString()}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-emerald-700">
          <span>Discount</span>
          <span className="font-semibold">-৳{discount.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-200">
        <span>Total Order</span>
        <span className="text-emerald-600">৳{total.toLocaleString()}</span>
      </div>

      <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-200">
        <span>Paid Upfront</span>
        <span className="font-semibold text-emerald-700">৳{paidAmount.toLocaleString()}</span>
      </div>

      {isCod && remainingAmount > 0 && (
        <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="font-bold text-amber-800">💵 Cash to Pay on Delivery</span>
          <span className="font-black text-amber-900 text-base">৳{remainingAmount.toLocaleString()}</span>
        </div>
      )}

      {payment.transactionId && (
        <div className="flex justify-between text-gray-500 mt-1">
          <span>Transaction ID</span>
          <span className="font-mono font-bold text-emerald-700">{payment.transactionId}</span>
        </div>
      )}
    </div>
  )
}
