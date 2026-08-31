import React, { useState } from 'react'
import type { SavedAddress } from '@/types'
import { createAddress } from '@/services/addressService'

interface AddressPickerModalProps {
  addresses: SavedAddress[]
  selectedId: string | null
  onSelect: (address: SavedAddress) => void
  onClose: () => void
  onAddressCreated: (address: SavedAddress) => void
}

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal',
  'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj',
  'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Faridpur',
  'Gopalganj', 'Madaripur', 'Shariatpur', 'Kishoreganj', 'Netrokona',
  'Sherpur', 'Jamalpur', 'Chapai Nawabganj', 'Naogaon', 'Natore',
  'Sirajganj', 'Pabna', 'Bogra', 'Joypurhat', 'Dinajpur', 'Thakurgaon',
  'Panchagarh', 'Nilphamari', 'Lalmonirhat', 'Kurigram', 'Gaibandha',
  'Jashore', 'Satkhira', 'Bagerhat', 'Narail', 'Magura', 'Jhenaidah',
  'Meherpur', 'Chuadanga', 'Kushtia', 'Rajbari', 'Pirojpur', 'Jhalokati',
  'Patuakhali', 'Barguna', 'Bhola', 'Noakhali', 'Lakshmipur', 'Feni',
  'Chandpur', 'Brahmanbaria', 'Habiganj', 'Moulvibazar', 'Sunamganj',
  "Cox's Bazar", 'Bandarban', 'Rangamati', 'Khagrachhari',
]

export const AddressPickerModal: React.FC<AddressPickerModalProps> = ({
  addresses,
  selectedId,
  onSelect,
  onClose,
  onAddressCreated,
}) => {
  const [view, setView] = useState<'list' | 'new'>('list')
  const [localSelected, setLocalSelected] = useState<string | null>(selectedId)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveForFuture, setSaveForFuture] = useState(true)

  const [form, setForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
    country: 'Bangladesh',
    isDefault: false,
  })

  const handleConfirmSelection = () => {
    const addr = addresses.find((a) => a.id === localSelected)
    if (addr) onSelect(addr)
    onClose()
  }

  const handleNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)

    if (!form.fullName.trim() || !form.phone.trim() || !form.addressLine.trim() || !form.city.trim()) {
      setSaveError('Full Name, Phone, Address, and City are required.')
      return
    }

    setSaving(true)

    // If saveForFuture is true, persist via service; otherwise create temp object
    if (saveForFuture) {
      const res = await createAddress({ ...form, isDefault: form.isDefault })
      setSaving(false)
      if (res.success && res.address) {
        onAddressCreated(res.address)
        onSelect(res.address)
        onClose()
      } else {
        setSaveError(res.message)
      }
    } else {
      // Temp address — not saved to DB/localStorage
      const tempAddr: SavedAddress = {
        id: 'temp-' + Date.now(),
        ...form,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSaving(false)
      onSelect(tempAddr)
      onClose()
    }
  }

  const getAddressIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return '🏠'
    if (l.includes('office') || l.includes('work')) return '🏢'
    if (l.includes('other')) return '📍'
    return '📌'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {view === 'new' && (
              <button
                onClick={() => setView('list')}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ← Back
              </button>
            )}
            <h3 className="font-black text-gray-900 text-base">
              {view === 'list' ? 'Choose Delivery Address' : 'Add New Address'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
        </div>

        {view === 'list' ? (
          <>
            {/* Address List */}
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {addresses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No saved addresses yet.</p>
              )}

              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    localSelected === addr.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="addr_pick"
                    value={addr.id}
                    checked={localSelected === addr.id}
                    onChange={() => setLocalSelected(addr.id)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{getAddressIcon(addr.label)}</span>
                      <span className="font-bold text-gray-900 text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-semibold">{addr.fullName} · {addr.phone}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {addr.addressLine}, {addr.city}, {addr.district}
                    </p>
                  </div>
                </label>
              ))}

              {/* Add New Option */}
              <button
                onClick={() => setView('new')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-all text-sm font-semibold"
              >
                <span className="text-lg">＋</span>
                Add New Address
              </button>
            </div>

            {/* Confirm Button */}
            <div className="p-5 border-t border-gray-100">
              <button
                disabled={!localSelected}
                onClick={handleConfirmSelection}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Deliver to This Address →
              </button>
            </div>
          </>
        ) : (
          /* New Address Form */
          <form onSubmit={handleNewAddressSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {saveError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-semibold">
                {saveError}
              </div>
            )}

            {/* Label */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm({ ...form, label: l })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      form.label === l
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    {l === 'Home' ? '🏠' : l === 'Office' ? '🏢' : '📍'} {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Recipient's full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+880 1700 000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Address Line */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                placeholder="House no., Road, Area..."
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* City + District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District *</label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Postal Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 1207"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Save for future + Set as default */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                💾 Save this address for future orders
              </label>
              {saveForFuture && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 pl-6">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Set as my default address
                </label>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Use This Address →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddressPickerModal
