import React, { useState, useEffect } from 'react'
import {
  getShippingCodSettings,
  updateShippingCodSettings,
} from '@/services/orderService'
import type { ShippingCodSettings } from '@/types'

export const AdminShippingCodSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [form, setForm] = useState<ShippingCodSettings>({
    codEnabled: true,
    codCharge: 30,
    minimumCodCharge: 100,
    requireUpfrontCodCharge: false,
    shippingCharge: 60,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getShippingCodSettings()
        setForm(data)
      } catch (e: any) {
        toastError(e.message || 'Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toastSuccess = (msg: string) => {
    setToast({ type: 'success', message: msg })
    setTimeout(() => setToast(null), 3000)
  }
  const toastError = (msg: string) => {
    setToast({ type: 'error', message: msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateShippingCodSettings(form)
      setForm(res.settings)
      toastSuccess(res.message || 'Settings saved.')
    } catch (err: any) {
      toastError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const numField = (key: keyof ShippingCodSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: Number(e.target.value) || 0 })
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Shipping &amp; COD</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure cash-on-delivery charges and delivery fee. All amounts are calculated on the backend.
          </p>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm ${
          toast.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'} {toast.message}</span>
          <button onClick={() => setToast(null)} className="font-black">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-5">
          {/* Cash on Delivery Enable */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-gray-900">Cash on Delivery</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Allow customers to pay cash upon delivery.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, codEnabled: !form.codEnabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  form.codEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  form.codEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <span className={`mt-2 inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              form.codEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {form.codEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* COD Charge */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                COD Charge <span className="text-gray-400 font-normal">(added to every COD order)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  min={0}
                  value={form.codCharge}
                  onChange={numField('codCharge')}
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Minimum COD / Courier Charge
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  min={0}
                  value={form.minimumCodCharge}
                  onChange={numField('minimumCodCharge')}
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Flat Shipping / Delivery Charge
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  min={0}
                  value={form.shippingCharge}
                  onChange={numField('shippingCharge')}
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Require Upfront COD Charge */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-gray-900">Require Upfront COD Charge</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Yes: customer pays the courier/COD charge now; product + shipping remain cash on delivery.
                  No: nothing is paid online; full amount is collected on delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, requireUpfrontCodCharge: !form.requireUpfrontCodCharge })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  form.requireUpfrontCodCharge ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  form.requireUpfrontCodCharge ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <span className={`mt-2 inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              form.requireUpfrontCodCharge ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {form.requireUpfrontCodCharge ? 'Yes' : 'No'}
            </span>
          </div>

          {/* Example calculation preview */}
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-2">
            <p className="text-xs font-black mb-2">Live Preview (example: ৳2,000 subtotal)</p>
            <div className="flex justify-between text-[11px] text-gray-300">
              <span>Product Subtotal</span><span>৳2,000</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-300">
              <span>Shipping</span><span>৳{form.shippingCharge}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-300">
              <span>COD Charge</span><span>৳{form.codEnabled ? form.codCharge : 0}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-700">
              <span>Total</span><span>৳{2000 + form.shippingCharge + (form.codEnabled ? form.codCharge : 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-300 pt-1 border-t border-gray-700">
              <span>Paid Upfront</span><span>৳{form.requireUpfrontCodCharge && form.codEnabled ? (form.codCharge || form.minimumCodCharge) : 0}</span>
            </div>
            <div className="flex justify-between text-[11px] text-amber-300">
              <span>Remaining (Cash on Delivery)</span>
              <span>৳{2000 + form.shippingCharge + (form.codEnabled ? form.codCharge : 0) - (form.requireUpfrontCodCharge && form.codEnabled ? (form.codCharge || form.minimumCodCharge) : 0)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-md"
            >
              {saving ? 'Saving...' : 'Save Shipping & COD Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminShippingCodSettingsPage
