import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { getAddresses } from '@/services/addressService'
import {
  getEnabledPaymentMethods,
  initializePayment,
  verifyPayment,
} from '@/services/paymentMethodService'
import { AddressPickerModal } from '@/components/checkout/AddressPickerModal'
import { OnlinePaymentGatewayModal } from '@/components/checkout/OnlinePaymentGatewayModal'
import { placeOrder } from '@/services/orderService'
import type { SavedAddress, ShippingInfo, PaymentMethod, PaymentStatus } from '@/types'

const BANGLADESH_DISTRICTS = [
  'Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh',
  'Comilla','Gazipur','Narayanganj','Narsingdi','Munshiganj','Tangail','Faridpur',
  "Cox's Bazar",'Noakhali','Feni','Brahmanbaria','Habiganj','Moulvibazar','Sunamganj',
  'Bogra','Dinajpur','Rangamati','Bandarban','Khagrachhari',
]

export const CheckoutPage: React.FC = () => {
  const { items, total, totalItems, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // --- Address state ---
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null)
  const [loadingAddress, setLoadingAddress] = useState(true)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [useManualForm, setUseManualForm] = useState(false)

  // --- Manual form state ---
  const [manualForm, setManualForm] = useState<ShippingInfo>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine: '',
    city: 'Dhaka',
    district: 'Dhaka',
    postalCode: '',
    country: 'Bangladesh',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({})

  // --- Admin-Controlled Payment Methods State ---
  const [enabledMethods, setEnabledMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [showGatewayModal, setShowGatewayModal] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)

  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string
    address: string
    methodName: string
    paymentStatus: PaymentStatus
    trxId?: string
    amount: number
  } | null>(null)

  const deliveryCharge = 60
  const grandTotal = total + deliveryCharge

  // 1. Load enabled payment methods (Admin-controlled)
  useEffect(() => {
    const loadPayments = async () => {
      setLoadingPaymentMethods(true)
      try {
        const list = await getEnabledPaymentMethods()
        setEnabledMethods(list)
        // Explicitly start with no payment method selected per requirements
        setSelectedMethod(null)
      } catch (e) {
        console.error('Failed to load enabled payment methods:', e)
      } finally {
        setLoadingPaymentMethods(false)
      }
    }
    loadPayments()
  }, [])

  // 2. Load saved addresses (from API or localStorage)
  useEffect(() => {
    const load = async () => {
      setLoadingAddress(true)
      try {
        const list = await getAddresses()
        setSavedAddresses(list)
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0]
          setSelectedAddress(def)
          setManualForm({
            fullName: def.fullName || user?.name || '',
            email: user?.email || '',
            phone: def.phone || user?.phone || '',
            addressLine: def.addressLine || '',
            city: def.city || 'Dhaka',
            district: def.district || 'Dhaka',
            postalCode: def.postalCode || '',
            country: def.country || 'Bangladesh',
          })
        } else if (user) {
          setManualForm((prev) => ({
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
          }))
        }
      } catch (err) {
        console.error('Failed to fetch addresses on checkout:', err)
      } finally {
        setLoadingAddress(false)
      }
    }
    load()
  }, [user, isAuthenticated])

  // Validate manual form
  const validateManual = (): boolean => {
    const e: Partial<Record<keyof ShippingInfo, string>> = {}
    if (!manualForm.fullName.trim()) e.fullName = 'Full name is required'
    if (!manualForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email)) e.email = 'Valid email required'
    if (!manualForm.phone.trim() || manualForm.phone.length < 8) e.phone = 'Valid phone number required'
    if (!manualForm.addressLine.trim()) e.addressLine = 'Street address is required'
    if (!manualForm.city.trim()) e.city = 'City is required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  // Handle Order Submit
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError(null)

    if (enabledMethods.length === 0 || !selectedMethod) {
      setPaymentError('Please select a payment method to continue.')
      return
    }

    if (!selectedAddress && useManualForm && !validateManual()) {
      return
    }

    if (!selectedAddress && !useManualForm) {
      setShowAddressPicker(true)
      return
    }

    // Online Payment Gateway Flow (bKash, Nagad, Rocket, Card)
    if (selectedMethod.type !== 'cod') {
      setSubmitting(true)
      setConnectionMessage(`Connecting to ${selectedMethod.name} gateway...`)

      const initRes = await initializePayment({
        methodId: selectedMethod.id,
        amount: grandTotal,
        customerInfo: {
          name: manualForm.fullName,
          email: manualForm.email,
          phone: manualForm.phone,
        },
      })
      setSubmitting(false)
      setConnectionMessage(null)

      if (initRes.success) {
        setShowGatewayModal(true)
      } else {
        setPaymentError(initRes.message || 'Unable to initialize payment session. Please try again.')
      }
      return
    }

    // Cash on Delivery Flow
    setSubmitting(true)

    const addrObj = selectedAddress && !useManualForm
      ? {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine: selectedAddress.addressLine,
          city: selectedAddress.city,
          district: selectedAddress.district,
          postalCode: selectedAddress.postalCode || '',
          country: selectedAddress.country,
        }
      : {
          fullName: manualForm.fullName,
          phone: manualForm.phone,
          addressLine: manualForm.addressLine,
          city: manualForm.city,
          district: manualForm.district,
          postalCode: manualForm.postalCode,
          country: manualForm.country,
        }

    try {
      const res = await placeOrder({
        customerName: manualForm.fullName,
        customerEmail: manualForm.email,
        customerPhone: manualForm.phone,
        shippingAddress: addrObj,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod: selectedMethod.id,
        deliveryCharge,
        notes: notes || undefined,
      })

      const addrSummary = `${addrObj.addressLine}, ${addrObj.city}, ${addrObj.district}`

      clearCart()
      setSubmitting(false)
      setOrderSuccess({
        orderId: res.order?.orderNumber || res.order?._id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        address: addrSummary,
        methodName: selectedMethod.name,
        paymentStatus: 'unpaid',
        amount: grandTotal,
      })
    } catch (err: any) {
      setSubmitting(false)
      setPaymentError(err.message || 'Failed to place order. Please try again.')
    }
  }

  // ── Helper: Generate Payment CTA Button Label (Section 4, 7, 8) ────────
  const getCtaButtonContent = () => {
    if (!selectedMethod) {
      return { title: 'Select a payment method', subtitle: '' }
    }

    if (selectedMethod.type === 'cod') {
      return {
        title: selectedMethod.ctaText || '✓ Place Order — Cash on Delivery',
        subtitle: selectedMethod.subtitle || 'Pay cash when your package arrives.',
      }
    }

    if (selectedMethod.id === 'bkash') {
      return {
        title: `💳 Pay ৳${grandTotal.toLocaleString()} with bKash`,
        subtitle: 'Direct bKash online payment gateway',
      }
    }

    if (selectedMethod.id === 'nagad') {
      return {
        title: `💳 Pay ৳${grandTotal.toLocaleString()} with Nagad`,
        subtitle: 'Direct Nagad online payment gateway',
      }
    }

    if (selectedMethod.id === 'rocket') {
      return {
        title: `💳 Pay ৳${grandTotal.toLocaleString()} with Rocket`,
        subtitle: 'Direct Rocket online payment gateway',
      }
    }

    if (selectedMethod.id === 'card' || selectedMethod.type === 'card') {
      return {
        title: `💳 Pay ৳${grandTotal.toLocaleString()} Securely`,
        subtitle: '256-Bit SSL Encrypted Card Gateway',
      }
    }

    return {
      title: `💳 Pay ৳${grandTotal.toLocaleString()} with ${selectedMethod.name}`,
      subtitle: 'Online Payment Gateway',
    }
  }

  const ctaContent = getCtaButtonContent()

  // ── Order Confirmation / Success Screen (Section 10 & 12) ─────────
  if (orderSuccess) {
    const isPaid = orderSuccess.paymentStatus === 'paid'

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner text-3xl font-black">
            ✓
          </div>
          <div>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full mb-2">
              {isPaid ? '✓ Payment Successful' : 'Order Confirmed 🎉'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              {isPaid ? 'Your Payment Has Been Confirmed' : 'Thank You for Your Order!'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              {isPaid
                ? 'Your transaction was verified and your order is now confirmed.'
                : 'We have received your Cash on Delivery order. Pay cash when your package arrives.'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 text-xs text-gray-600 border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="font-semibold text-gray-700">Order Number:</span>
              <span className="font-mono font-black text-sm text-gray-900">{orderSuccess.orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Payment Status:</span>
              <span className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isPaid ? '✓ Paid' : '⏳ Unpaid (Cash on Delivery)'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Payment Method:</span>
              <span className="font-bold text-gray-900">{orderSuccess.methodName}</span>
            </div>

            {orderSuccess.trxId && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Transaction ID:</span>
                <span className="font-mono font-bold text-emerald-700">{orderSuccess.trxId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Delivery Address:</span>
              <span className="font-medium text-gray-900 text-right max-w-[220px] truncate">{orderSuccess.address}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-black text-sm text-gray-900">
              <span>Total Amount:</span>
              <span className="text-emerald-600 font-mono text-base">৳{orderSuccess.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/customer/profile" className="flex-1">
              <button className="w-full py-3 border-2 border-emerald-600 text-emerald-700 text-xs font-black rounded-xl hover:bg-emerald-50 transition-colors">
                View My Profile & Orders
              </button>
            </Link>
            <Link to="/products" className="flex-1">
              <button className="w-full py-3 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-colors shadow">
                Continue Shopping →
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Empty Cart ────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-gray-500 text-sm">Add items to your cart before proceeding to checkout.</p>
        <button onClick={() => navigate('/products')}
          className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-colors text-sm">
          Browse Products →
        </button>
      </div>
    )
  }

  // ── Main Checkout Layout ──────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Checkout</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Review your delivery address and confirm your payment method
        </p>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Delivery + Payment ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── 1. Delivery Address Section ─────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">1</span>
                  <h2 className="font-black text-gray-900">Delivery Address</h2>
                </div>

                {selectedAddress && !useManualForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                  >
                    🔄 Change Address
                  </button>
                )}
              </div>

              <div className="p-5">
                {loadingAddress ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Loading delivery address...</div>
                ) : selectedAddress && !useManualForm ? (
                  // ── AUTO-FILLED SAVED / DEFAULT ADDRESS CARD ──
                  <div className="space-y-4">
                    <div className="border-2 border-emerald-500 bg-emerald-50/60 rounded-2xl p-5 relative shadow-sm">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-lg">
                          {selectedAddress.label.toLowerCase().includes('home') ? '🏠' :
                           selectedAddress.label.toLowerCase().includes('office') ? '🏢' : '📍'}
                        </span>
                        <span className="font-black text-emerald-900 text-sm">{selectedAddress.label}</span>
                        {selectedAddress.isDefault && (
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            ✓ Default Address
                          </span>
                        )}
                      </div>

                      <div className="text-sm space-y-1 text-gray-800">
                        <p className="font-bold text-gray-900 text-base">{selectedAddress.fullName}</p>
                        <p className="text-gray-600 text-xs flex items-center gap-1">📞 {selectedAddress.phone}</p>
                        <p className="text-gray-700 text-xs mt-1">
                          📍 {selectedAddress.addressLine}, {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.country}
                        </p>
                        {selectedAddress.postalCode && (
                          <p className="text-gray-500 text-[11px]">Postal Code: {selectedAddress.postalCode}</p>
                        )}
                      </div>

                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  // ── MANUAL FORM OR NO SAVED ADDRESS ──
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && useManualForm && (
                      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold">
                        <span>💡 You have {savedAddresses.length} saved address{savedAddresses.length > 1 ? 'es' : ''}.</span>
                        <button
                          type="button"
                          onClick={() => setUseManualForm(false)}
                          className="underline font-black hover:text-emerald-950"
                        >
                          Use Saved Address →
                        </button>
                      </div>
                    )}

                    {!isAuthenticated && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span>💡</span>
                        <span className="font-semibold">
                          <Link to="/login" className="underline hover:text-amber-900">Sign in</Link> to auto-fill your saved address and track your orders easily.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                        <input type="text" value={manualForm.fullName}
                          onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                          placeholder="e.g. Ayesha Khan"
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${formErrors.fullName ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`} />
                        {formErrors.fullName && <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone <span className="text-rose-500">*</span></label>
                        <input type="tel" value={manualForm.phone}
                          onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                          placeholder="+880 1700 000000"
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${formErrors.phone ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`} />
                        {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                      <input type="email" value={manualForm.email}
                        onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                        placeholder="your@email.com"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${formErrors.email ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`} />
                      {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address <span className="text-rose-500">*</span></label>
                      <input type="text" value={manualForm.addressLine}
                        onChange={(e) => setManualForm({ ...manualForm, addressLine: e.target.value })}
                        placeholder="House no., Road, Area..."
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${formErrors.addressLine ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`} />
                      {formErrors.addressLine && <p className="text-xs text-rose-600 mt-1">{formErrors.addressLine}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* City */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">City <span className="text-rose-500">*</span></label>
                        <input type="text" value={manualForm.city}
                          onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                          placeholder="e.g. Dhaka"
                          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${formErrors.city ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`} />
                        {formErrors.city && <p className="text-xs text-rose-600 mt-1">{formErrors.city}</p>}
                      </div>

                      {/* District */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">District</label>
                        <select value={manualForm.district}
                          onChange={(e) => setManualForm({ ...manualForm, district: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                          {BANGLADESH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Postal Code (Optional)</label>
                      <input type="text" value={manualForm.postalCode}
                        onChange={(e) => setManualForm({ ...manualForm, postalCode: e.target.value })}
                        placeholder="e.g. 1207"
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 2. Payment Method Section (Admin-Controlled) ─────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">2</span>
                  <h2 className="font-black text-gray-900">Payment Option</h2>
                </div>
                {enabledMethods.length > 0 && (
                  <span className="text-[11px] font-bold text-gray-400">
                    {enabledMethods.length} option{enabledMethods.length > 1 ? 's' : ''} available
                  </span>
                )}
              </div>

              <div className="p-5">
                {loadingPaymentMethods ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Loading available payment methods...</div>
                ) : enabledMethods.length === 0 ? (
                  // ── SECTION 15: EMPTY PAYMENT METHOD STATE ──
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center space-y-2">
                    <span className="text-3xl block">⚠️</span>
                    <h3 className="font-black text-amber-900 text-sm">No Payment Methods Currently Available</h3>
                    <p className="text-xs text-amber-800 max-w-sm mx-auto">
                      All payment methods are currently disabled by the store administrator. Please contact support or try again later.
                    </p>
                  </div>
                ) : (
                  // ── DYNAMIC ENABLED PAYMENT METHODS LIST (Admin Ordered) ──
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {enabledMethods.map((method) => {
                        const isSelected = selectedMethod?.id === method.id
                        const isCod = method.type === 'cod'
                        const isBkash = method.id === 'bkash'
                        const isNagad = method.id === 'nagad'
                        const isRocket = method.id === 'rocket'
                        const isCard = method.type === 'card'

                        const activeBorder = isCod
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-400/30'
                          : isBkash
                          ? 'border-pink-500 bg-pink-50/70 shadow-sm ring-1 ring-pink-400/30'
                          : isNagad
                          ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-400/30'
                          : isRocket
                          ? 'border-purple-500 bg-purple-50/70 shadow-sm ring-1 ring-purple-400/30'
                          : 'border-slate-800 bg-slate-50 shadow-sm ring-1 ring-slate-400/30'

                        const activeDotColor = isCod
                          ? 'bg-emerald-600'
                          : isBkash
                          ? 'bg-pink-600'
                          : isNagad
                          ? 'bg-orange-600'
                          : isRocket
                          ? 'bg-purple-600'
                          : 'bg-slate-900'

                        return (
                          <div
                            key={method.id}
                            onClick={() => {
                              setSelectedMethod(method)
                              setPaymentError(null)
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex items-center justify-between ${
                              isCard ? 'sm:col-span-2' : ''
                            } ${isSelected ? activeBorder : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Radio Dot */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-emerald-600' : 'border-gray-300'
                              }`}>
                                {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${activeDotColor}`} />}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xl">{method.icon || '💳'}</span>
                                <p className="font-bold text-sm text-gray-900">{method.name}</p>
                              </div>
                            </div>

                            {/* Check Indicator for Selected */}
                            {isSelected && (
                              <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {paymentError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                        <span>⚠️</span> {paymentError}
                      </div>
                    )}

                    {/* ── SECTION 7 & 8: LARGE PRIMARY PAYMENT CTA BUTTON ── */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => handleSubmitOrder(e)}
                        disabled={submitting || !selectedMethod}
                        className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                          !selectedMethod
                            ? 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                            : submitting
                            ? 'opacity-75 cursor-wait text-white shadow-md'
                            : selectedMethod.type === 'cod'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-xl active:scale-[0.99]'
                            : selectedMethod.id === 'bkash'
                            ? 'bg-[#e2136e] hover:bg-[#c20f5e] text-white shadow-md hover:shadow-xl active:scale-[0.99]'
                            : selectedMethod.id === 'nagad'
                            ? 'bg-[#f7941d] hover:bg-[#de8012] text-white shadow-md hover:shadow-xl active:scale-[0.99]'
                            : selectedMethod.id === 'rocket'
                            ? 'bg-[#8c3494] hover:bg-[#77287e] text-white shadow-md hover:shadow-xl active:scale-[0.99]'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-xl active:scale-[0.99]'
                        }`}
                      >
                        <span className="text-base tracking-wide flex items-center gap-2">
                          {submitting ? (
                            <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> {connectionMessage || 'Processing Payment...'}</>
                          ) : (
                            ctaContent.title
                          )}
                        </span>
                        {ctaContent.subtitle && !submitting && selectedMethod && (
                          <span className="text-[11px] font-normal text-white/85">
                            {ctaContent.subtitle}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. Order Notes ───────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-black">3</span>
                <h2 className="font-black text-gray-900">Order Notes <span className="text-xs font-normal text-gray-400">(Optional)</span></h2>
              </div>
              <div className="p-5">
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for delivery (e.g. ring doorbell, leave at gate)..."
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ─────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-black text-gray-900">Order Summary</h2>
                <p className="text-xs text-gray-400 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''} in cart</p>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <img src={item.productImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                      <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900 flex-shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="px-5 py-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold">৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Delivery Charge</span>
                  <span className="font-semibold">৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">৳0</span>
                </div>
              </div>

              {/* Total */}
              <div className="px-5 pb-5 border-t border-gray-200">
                <div className="flex justify-between items-center py-4">
                  <span className="font-black text-gray-900">Total Payable</span>
                  <span className="text-xl font-black text-emerald-600">৳{grandTotal.toLocaleString()}</span>
                </div>

                {/* Place Order CTA in Sidebar */}
                <button
                  type="submit"
                  disabled={submitting || enabledMethods.length === 0 || !selectedMethod}
                  className={`w-full py-4 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                    !selectedMethod || enabledMethods.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {submitting ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Processing...</>
                  ) : !selectedMethod ? (
                    <>Select Payment Method</>
                  ) : (
                    <>Confirm & Place Order →</>
                  )}
                </button>

                {/* Security Badge */}
                <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                  🔒 Secure checkout — your data is protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Address Picker Modal */}
      {showAddressPicker && (
        <AddressPickerModal
          addresses={savedAddresses}
          selectedId={selectedAddress?.id || null}
          onSelect={(addr) => {
            setSelectedAddress(addr)
            setUseManualForm(false)
            setSavedAddresses((prev) => {
              const exists = prev.find((a) => a.id === addr.id)
              return exists ? prev : [...prev, addr]
            })
          }}
          onClose={() => setShowAddressPicker(false)}
          onAddressCreated={(addr) => {
            setSelectedAddress(addr)
            setUseManualForm(false)
            setSavedAddresses((prev) => {
              const cleaned = addr.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev
              return [addr, ...cleaned]
            })
          }}
        />
      )}

      {/* Online Payment Gateway Popup Modal */}
      {showGatewayModal && selectedMethod && (
        <OnlinePaymentGatewayModal
          provider={selectedMethod.name}
          amount={grandTotal}
          environment={selectedMethod.environment || 'sandbox'}
          onSuccess={async (info) => {
            setShowGatewayModal(false)
            setSubmitting(true)

            // Simulate backend transaction verification
            const verifyRes = await verifyPayment(info.trxId, 'success')

            const addrObj = selectedAddress && !useManualForm
              ? {
                  fullName: selectedAddress.fullName,
                  phone: selectedAddress.phone,
                  addressLine: selectedAddress.addressLine,
                  city: selectedAddress.city,
                  district: selectedAddress.district,
                  postalCode: selectedAddress.postalCode || '',
                  country: selectedAddress.country,
                }
              : {
                  fullName: manualForm.fullName,
                  phone: manualForm.phone,
                  addressLine: manualForm.addressLine,
                  city: manualForm.city,
                  district: manualForm.district,
                  postalCode: manualForm.postalCode,
                  country: manualForm.country,
                }

            try {
              const res = await placeOrder({
                customerName: manualForm.fullName,
                customerEmail: manualForm.email,
                customerPhone: manualForm.phone,
                shippingAddress: addrObj,
                items: items.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  productImage: item.productImage,
                  price: item.price,
                  quantity: item.quantity,
                })),
                paymentMethod: selectedMethod.id,
                deliveryCharge,
                notes: notes || undefined,
              })

              const addrSummary = `${addrObj.addressLine}, ${addrObj.city}, ${addrObj.district}`
              const orderId = res.order?.orderNumber || res.order?._id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`

              clearCart()
              setSubmitting(false)
              setOrderSuccess({
                orderId,
                address: addrSummary,
                methodName: selectedMethod.name,
                paymentStatus: 'paid',
                trxId: verifyRes.trxId || info.trxId,
                amount: grandTotal,
              })
            } catch (err: any) {
              setSubmitting(false)
              setPaymentError(err.message || 'Order was paid but could not be created. Please contact support.')
            }
          }}
          onFailure={(errorMsg) => {
            setShowGatewayModal(false)
            setSubmitting(false)
            setPaymentError(errorMsg || 'Payment was cancelled or failed. Please choose another payment method or try again.')
          }}
          onClose={() => {
            setShowGatewayModal(false)
            setSubmitting(false)
          }}
        />
      )}
    </div>
  )
}

export default CheckoutPage