import React, { useState, useEffect } from 'react'
import {
  getPaymentMethods,
  togglePaymentMethod,
  updatePaymentMethod,
  movePaymentMethodOrder,
  resetDefaultPaymentMethods,
} from '@/services/paymentMethodService'
import type { PaymentMethod } from '@/types'

export const AdminPaymentMethodsPage: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [editForm, setEditForm] = useState<Partial<PaymentMethod>>({})
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    setLoading(true)
    try {
      const data = await getPaymentMethods()
      setMethods(data)
    } catch (e) {
      console.error('Failed to load payment methods:', e)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 3500)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const res = await togglePaymentMethod(id, newStatus)
    if (res.success) {
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: newStatus } : m))
      )
      showNotification('success', res.message)
    } else {
      showNotification('error', res.message)
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const res = await movePaymentMethodOrder(id, direction)
    if (res.success) {
      await loadMethods()
      showNotification('success', 'Display order updated.')
    }
  }

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setEditForm({
      name: method.name,
      enabled: method.enabled,
      environment: method.environment || 'sandbox',
      merchantId: method.merchantId || '',
      merchantNumber: method.merchantNumber || '',
      accountType: method.accountType || 'Merchant',
      ctaText: method.ctaText || '',
      subtitle: method.subtitle || '',
      icon: method.icon || '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMethod) return
    setSaving(true)

    const res = await updatePaymentMethod(editingMethod.id, editForm)
    setSaving(false)

    if (res.success) {
      setEditingMethod(null)
      await loadMethods()
      showNotification('success', res.message)
    } else {
      showNotification('error', res.message)
    }
  }

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all payment methods to factory defaults?')) {
      const defs = resetDefaultPaymentMethods()
      setMethods(defs)
      showNotification('success', 'Reset to default payment methods.')
    }
  }

  const enabledCount = methods.filter((m) => m.enabled).length
  const disabledCount = methods.length - enabledCount

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Payment Methods</h1>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 font-bold hover:text-gray-700">✕</button>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Methods</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{methods.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            💳
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Active (Shown at Checkout)</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{enabledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Disabled (Hidden)</p>
            <p className="text-2xl font-black text-gray-400 mt-0.5">{disabledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl font-bold">
            ✕
          </div>
        </div>
      </div>

      {/* Main Payment Methods Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-gray-900">Payment Methods</h2>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading payment methods...</div>
        ) : methods.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-bold">No payment methods found.</p>
            <button
              onClick={handleResetDefaults}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              Load Default Methods
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {methods.map((method, index) => {
              const typeBadge =
                method.type === 'cod'
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : method.type === 'mobile_banking'
                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'

              return (
                <div
                  key={method.id}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    method.enabled ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/50 opacity-75'
                  }`}
                >
                  {/* Left: Reorder Arrows + Method Info */}
                  <div className="flex items-start gap-4">
                    {/* Display Order Position & Controls */}
                    <div className="flex flex-col items-center justify-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex-shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(method.id, 'up')}
                        title="Move Up"
                        className="w-6 h-6 flex items-center justify-center text-xs font-black text-gray-600 hover:bg-white hover:text-emerald-600 rounded disabled:opacity-30 transition-colors"
                      >
                        ▲
                      </button>
                      <span className="text-xs font-mono font-black text-gray-700">#{method.displayOrder}</span>
                      <button
                        type="button"
                        disabled={index === methods.length - 1}
                        onClick={() => handleMove(method.id, 'down')}
                        title="Move Down"
                        className="w-6 h-6 flex items-center justify-center text-xs font-black text-gray-600 hover:bg-white hover:text-emerald-600 rounded disabled:opacity-30 transition-colors"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Method Icon & Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{method.icon || '💳'}</span>
                        <h3 className="font-black text-gray-900 text-sm sm:text-base">{method.name}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${typeBadge}`}>
                          {method.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">ID: {method.id}</span>
                      </div>

                      {method.merchantNumber && (
                        <p className="text-[11px] text-gray-600 flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-gray-800 font-sans">Account:</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-900">
                            {method.merchantNumber} ({method.accountType || 'Merchant'})
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Toggle Switch & Edit Button */}
                  <div className="flex items-center gap-4 self-end lg:self-center">
                    {/* Status Toggle Switch */}
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-black uppercase ${method.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {method.enabled ? 'ON' : 'OFF'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggle(method.id, method.enabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                          method.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            method.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Edit Configuration Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(method)}
                      className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>✏️</span>
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Live Customer Checkout Preview */}
      <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
        {enabledCount === 0 ? (
          <div className="bg-amber-950/40 border border-amber-800 p-4 rounded-xl text-xs text-amber-200 space-y-1">
            <p className="font-black">⚠️ Payment methods are disabled!</p>
            <p className="text-[11px] text-amber-300">
              Customers will see "No payment methods available" and cannot place orders until you enable at least one method.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {methods
              .filter((m) => m.enabled)
              .map((m) => (
                <div
                  key={m.id}
                  className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl flex items-center gap-3"
                >
                  <span className="text-2xl">{m.icon || '💳'}</span>
                  <div>
                    <p className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{m.name}</span>
                      <span className="text-[10px] font-mono text-gray-400">#{m.displayOrder}</span>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{editForm.icon || '💳'}</span>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Configure {editingMethod.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">ID: {editingMethod.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingMethod(null)} className="text-gray-400 font-bold hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Method Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Display Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-bold text-gray-900">Enable on Checkout</p>
                  <p className="text-[11px] text-gray-400">Controls visibility on customer order page</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, enabled: !editForm.enabled })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    editForm.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      editForm.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Gateway Configuration (For Online Payment Methods) */}
              {editingMethod.type !== 'cod' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900">🌐 Official Gateway Environment & Keys</p>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      Backend-Ready
                    </span>
                  </div>

                  {/* Environment Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, environment: 'sandbox' })}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        editForm.environment === 'sandbox'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      🧪 Sandbox (Test Mode)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, environment: 'production' })}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        editForm.environment === 'production'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      🔒 Live / Production
                    </button>
                  </div>

                  {/* Merchant ID / App Key Placeholder */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Merchant ID / Gateway App Key (Public)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BKASH_MERCHANT_LIVE_01"
                      value={editForm.merchantId || ''}
                      onChange={(e) => setEditForm({ ...editForm, merchantId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      🔒 Sensitive API Secrets & Private Keys must remain strictly in backend environment variables.
                    </p>
                  </div>
                </div>
              )}

              {/* Custom CTA Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Custom Button CTA Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pay with bKash, Place Order"
                  value={editForm.ctaText || ''}
                  onChange={(e) => setEditForm({ ...editForm, ctaText: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-md"
                >
                  {saving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPaymentMethodsPage
