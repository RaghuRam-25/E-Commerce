import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'

export const CartPage: React.FC = () => {
  const { items, total, totalItems, updateQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  const deliveryCharge = items.length > 0 ? 50 : 0
  const grandTotal = total + deliveryCharge

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-10 border border-gray-200 shadow-sm space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Your Cart is Empty</h2>
            <p className="text-gray-500 text-sm mt-2">
              Looks like you haven't added any products to your shopping cart yet.
            </p>
          </div>
          <Link to="/products" className="block">
            <Button variant="primary" size="lg" className="w-full font-bold">
              Start Shopping Now
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">
            Managing {totalItems} item{totalItems === 1 ? '' : 's'} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
        >
          Clear Entire Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {items.map((item) => {
              const effectivePrice = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price
              const itemSubtotal = effectivePrice * item.quantity

              return (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`} className="font-bold text-gray-900 text-sm sm:text-base hover:text-emerald-600 transition-colors line-clamp-1">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Unit Price: ৳{effectivePrice.toLocaleString()}
                        {item.discount > 0 && <span className="text-rose-500 font-semibold ml-1">(-{item.discount}%)</span>}
                      </p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-rose-600 hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Subtotal Controls */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-200 text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-bold text-xs text-gray-900 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-200 text-sm font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="text-xs text-gray-400 block">Subtotal</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        ৳{itemSubtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">Order Summary</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({totalItems})</span>
              <span className="font-medium text-gray-900">৳{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-medium text-gray-900">৳{deliveryCharge}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-emerald-600">৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/checkout')}
            className="w-full font-bold py-3.5 shadow-md shadow-emerald-600/20"
          >
            Proceed to Checkout →
          </Button>

          <Link to="/products" className="block text-center text-xs text-emerald-600 hover:underline font-semibold">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}