import React, { useState, useEffect } from 'react'

interface OnlinePaymentGatewayModalProps {
  provider: string
  amount: number
  orderId?: string
  environment?: 'sandbox' | 'production'
  onSuccess: (paymentInfo: {
    provider: string
    trxId: string
  }) => void
  onFailure?: (errorMsg: string) => void
  onClose: () => void
}

export const OnlinePaymentGatewayModal: React.FC<OnlinePaymentGatewayModalProps> = ({
  provider,
  amount,
  orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000),
  environment = 'sandbox',
  onSuccess,
  onFailure,
  onClose,
}) => {
  const [phase, setPhase] = useState<'connecting' | 'gateway_session' | 'verifying' | 'success' | 'failed'>('connecting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isBkash = provider.toLowerCase().includes('bkash')
  const isNagad = provider.toLowerCase().includes('nagad')
  const isRocket = provider.toLowerCase().includes('rocket')
  const isCard = provider.toLowerCase().includes('card')

  const providerName = isBkash
    ? 'bKash Checkout'
    : isNagad
    ? 'Nagad Payment Gateway'
    : isRocket
    ? 'DBBL Rocket Gateway'
    : isCard
    ? 'Card Payment Gateway'
    : provider

  const themeBg = isBkash
    ? 'bg-[#e2136e]'
    : isNagad
    ? 'bg-[#f7941d]'
    : isRocket
    ? 'bg-[#8c3494]'
    : 'bg-slate-900'

  const providerIcon = isBkash ? '🌸' : isNagad ? '🔶' : isRocket ? '🚀' : '💳'

  // Step 1: Simulate connection to official gateway
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('gateway_session')
    }, 900)
    return () => clearTimeout(timer)
  }, [])

  // Step 2: Handle Complete Test Payment
  const handleCompletePayment = () => {
    setPhase('verifying')

    // Simulate official gateway returning to backend webhook / verification endpoint
    setTimeout(() => {
      const generatedTrx =
        (isBkash ? 'BK' : isNagad ? 'NG' : isRocket ? 'RK' : 'TX') +
        Math.random().toString(36).substring(2, 9).toUpperCase()

      setPhase('success')
      setTimeout(() => {
        onSuccess({
          provider: isBkash ? 'bKash' : isNagad ? 'Nagad' : isRocket ? 'Rocket' : 'Card',
          trxId: generatedTrx,
        })
      }, 1000)
    }, 1800)
  }

  // Handle Payment Failure simulation
  const handleFailPayment = () => {
    setPhase('failed')
    setErrorMessage(`Payment session was rejected or cancelled on the ${providerName} portal.`)
    setTimeout(() => {
      if (onFailure) {
        onFailure(`Payment could not be completed with ${providerName}. Please try again.`)
      }
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">

        {/* ── Official Gateway Header ──────────────────────── */}
        <div className={`${themeBg} text-white p-6 relative flex flex-col items-center justify-center text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-bold w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-colors"
          >
            ✕
          </button>

          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-2.5 text-3xl">
            {providerIcon}
          </div>
          <h2 className="text-lg font-black tracking-tight">{providerName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 text-white/90 border border-white/20">
              {environment === 'sandbox' ? '🧪 Sandbox Test Mode' : '🔒 Live Gateway'}
            </span>
            <span className="text-[11px] text-white/80">Order #{orderId}</span>
          </div>
        </div>

        {/* ── Modal Body ──────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* Invoice Summary */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Merchant</p>
              <p className="text-xs font-black text-gray-800 mt-0.5">BD Commerce Online Store</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Payable Total</p>
              <p className="text-xl font-black text-emerald-600">৳{amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Architecture & Security Notice (Requirements 7, 13, 14) */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-slate-900">
              <span>🔒</span> Official Gateway Redirect Simulation:
            </p>
            <p className="text-[11px] text-slate-600">
              In production, the customer is securely redirected to the official <strong>{providerName}</strong> portal.
              Customer PINs, OTPs, and passwords are never handled by this store.
            </p>
          </div>

          {/* Phase 1: Connecting State */}
          {phase === 'connecting' && (
            <div className="py-6 text-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <div>
                <p className="text-sm font-black text-gray-800">Connecting to {providerName}...</p>
                <p className="text-xs text-gray-400 mt-0.5">Creating secure payment session</p>
              </div>
            </div>
          )}

          {/* Phase 2: Gateway Session Ready */}
          {phase === 'gateway_session' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleCompletePayment}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>Complete Gateway Payment (Test)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFailPayment}
                  className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors"
                >
                  Simulate Cancel / Fail
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Return to Checkout
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Verifying Transaction with Backend */}
          {phase === 'verifying' && (
            <div className="py-6 text-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <div>
                <p className="text-sm font-black text-gray-800">Verifying Transaction with Backend...</p>
                <p className="text-xs text-gray-500 mt-0.5">Confirming payment session with {providerName}</p>
              </div>
            </div>
          )}

          {/* Phase 4: Payment Confirmed */}
          {phase === 'success' && (
            <div className="py-6 text-center space-y-2 animate-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl font-black">
                ✓
              </div>
              <p className="text-sm font-black text-emerald-700">Payment Successfully Confirmed!</p>
              <p className="text-xs text-gray-500">Redirecting to Order Confirmation...</p>
            </div>
          )}

          {/* Phase 5: Payment Failed */}
          {phase === 'failed' && (
            <div className="py-6 text-center space-y-2 animate-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl font-bold">
                ✕
              </div>
              <p className="text-sm font-black text-rose-700">Payment Unsuccessful</p>
              <p className="text-xs text-rose-600">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnlinePaymentGatewayModal
