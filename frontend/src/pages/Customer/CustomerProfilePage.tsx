import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/services/addressService'
import { getApprovedReviews, createReview } from '@/services/reviewService'
import type { Review } from '@/services/reviewService'
import { INITIAL_ORDERS } from '@/services/mockData'
import type { SavedAddress, Order } from '@/types'

const BANGLADESH_DISTRICTS = [
  'Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh',
  'Comilla','Gazipur','Narayanganj','Narsingdi','Munshiganj','Manikganj','Tangail',
  'Faridpur','Gopalganj','Madaripur','Shariatpur','Kishoreganj','Netrokona','Sherpur',
  'Jamalpur','Chapai Nawabganj','Naogaon','Natore','Sirajganj','Pabna','Bogra',
  'Joypurhat','Dinajpur','Thakurgaon','Panchagarh','Nilphamari','Lalmonirhat',
  'Kurigram','Gaibandha','Jashore','Satkhira','Bagerhat','Narail','Magura',
  'Jhenaidah','Meherpur','Chuadanga','Kushtia','Rajbari','Pirojpur','Jhalokati',
  "Patuakhali",'Barguna','Bhola','Noakhali','Lakshmipur','Feni','Chandpur',
  'Brahmanbaria','Habiganj','Moulvibazar','Sunamganj',"Cox's Bazar",'Bandarban',
  'Rangamati','Khagrachhari',
]

const emptyAddressForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  district: 'Dhaka',
  postalCode: '',
  country: 'Bangladesh',
  isDefault: false,
}

type ActiveTab = 'profile' | 'addresses' | 'orders' | 'reviews'

export const CustomerProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')

  // --- Profile form state ---
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // --- Addresses state ---
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({ ...emptyAddressForm })
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressMsg, setAddressMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrderFilter, setSelectedOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'processing'>('all')

  // --- Reviews state ---
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)
  const [newReviewText, setNewReviewText] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [userLocation, setUserLocation] = useState('Dhaka, Bangladesh')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (activeTab === 'addresses') {
      loadAddresses()
    } else if (activeTab === 'orders') {
      loadOrders()
    } else if (activeTab === 'reviews') {
      loadReviews()
    }
  }, [activeTab, user])

  // Load addresses
  const loadAddresses = async () => {
    setLoadingAddresses(true)
    const data = await getAddresses()
    setAddresses(data)
    setLoadingAddresses(false)
  }

  // Load orders
  const loadOrders = () => {
    setLoadingOrders(true)
    try {
      const storedOrders = localStorage.getItem('bd_commerce_orders')
      let orderList: Order[] = []
      if (storedOrders) {
        orderList = JSON.parse(storedOrders)
      } else {
        orderList = INITIAL_ORDERS
      }
      // Filter orders by user if logged in, or fallback to user matching
      const userOrders = orderList.filter(
        (o) => !user?.email || o.customerEmail?.toLowerCase() === user.email.toLowerCase()
      )
      setOrders(userOrders.length > 0 ? userOrders : orderList.slice(0, 3))
    } catch {
      setOrders(INITIAL_ORDERS.slice(0, 3))
    } finally {
      setLoadingOrders(false)
    }
  }

  // Load reviews
  const loadReviews = async () => {
    setLoadingReviews(true)
    try {
      const stored = localStorage.getItem('bd_commerce_reviews')
      if (stored) {
        const all: Review[] = JSON.parse(stored)
        const myRevs = all.filter(
          (r) =>
            r.email?.toLowerCase() === user?.email?.toLowerCase() ||
            r.customerName?.toLowerCase() === user?.name?.toLowerCase()
        )
        setReviews(myRevs.length > 0 ? myRevs : all.slice(0, 3))
      } else {
        const data = await getApprovedReviews()
        setReviews(data)
      }
    } catch (e) {
      console.error('Failed to load reviews:', e)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    await updateProfile({ name, email, phone })
    setSavingProfile(false)
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3500)
  }

  const openAddModal = () => {
    setEditingAddress(null)
    setAddressForm({ ...emptyAddressForm, fullName: user?.name || '', phone: user?.phone || '' })
    setAddressMsg(null)
    setShowAddressModal(true)
  }

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddress(addr)
    setAddressForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode || '',
      country: addr.country,
      isDefault: addr.isDefault,
    })
    setAddressMsg(null)
    setShowAddressModal(true)
  }

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressMsg(null)
    let res: { success: boolean; message: string }

    if (editingAddress) {
      res = await updateAddress(editingAddress.id, addressForm)
    } else {
      res = await createAddress(addressForm)
    }

    setSavingAddress(false)
    if (res.success) {
      setAddressMsg({ type: 'success', text: editingAddress ? 'Address updated!' : 'Address saved successfully!' })
      await loadAddresses()
      setTimeout(() => {
        setShowAddressModal(false)
        setAddressMsg(null)
      }, 1200)
    } else {
      setAddressMsg({ type: 'error', text: res.message })
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAddress(id)
    setDeleteConfirmId(null)
    await loadAddresses()
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id)
    await loadAddresses()
  }

  // Handle Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewMsg(null)
    setSubmittingReview(true)

    const res = await createReview({
      review: newReviewText,
      rating: newRating,
      location: userLocation,
    })

    setSubmittingReview(false)
    if (res.success) {
      setReviewMsg({ type: 'success', text: res.message || 'Review submitted for approval!' })
      setNewReviewText('')
      await loadReviews()
      setTimeout(() => {
        setShowWriteReviewModal(false)
        setReviewMsg(null)
      }, 1500)
    } else {
      setReviewMsg({ type: 'error', text: res.message || 'Failed to submit review.' })
    }
  }

  if (!user) return null

  const initials = user.name
    ? user.name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : 'U'

  const roleLabel = user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Customer'
  const roleColor = user.role === 'super_admin'
    ? 'bg-purple-100 text-purple-700 border-purple-300'
    : user.role === 'admin'
    ? 'bg-blue-100 text-blue-700 border-blue-300'
    : 'bg-emerald-100 text-emerald-700 border-emerald-300'

  const getAddrIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return '🏠'
    if (l.includes('office') || l.includes('work')) return '🏢'
    return '📍'
  }

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Personal Info', icon: '👤' },
    { id: 'addresses', label: 'My Addresses', icon: '📍' },
    { id: 'orders', label: 'My Orders', icon: '📦' },
    { id: 'reviews', label: 'My Reviews', icon: '⭐' },
  ]

  const filteredOrders = orders.filter((o) => {
    if (selectedOrderFilter === 'all') return true
    return o.status?.toLowerCase() === selectedOrderFilter
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600" />
        <div className="px-6 pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-2xl shadow-lg ring-4 ring-white flex-shrink-0">
              {initials}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-black text-gray-900 leading-tight">{user.name}</h1>
              <p className="text-xs text-gray-400">{user.email}</p>
              <span className={`mt-1 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-100 px-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab 1: Personal Info ─────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <span className="text-lg">👤</span>
            <div>
              <h2 className="font-black text-gray-900 text-base">Personal Information</h2>
              <p className="text-xs text-gray-400">Update your name, email and phone number</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold mb-5">
              <span className="text-base">✅</span> Profile updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Personal Info Form */}
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1700 000000"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={savingProfile}
                  className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm hover:shadow-md">
                  {savingProfile
                    ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving...</>
                    : <>💾 Save Profile Changes</>}
                </button>
              </div>
            </form>

            {/* Right: Address Management Quick Card */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-5 bg-emerald-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Delivery Addresses</h3>
                      <p className="text-[11px] text-gray-400">Manage your saved delivery locations</p>
                    </div>
                  </div>
                </div>

                {/* Show default address if available */}
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.slice(0, 2).map((addr) => (
                      <div key={addr.id} className={`bg-white rounded-xl p-3.5 border ${addr.isDefault ? 'border-emerald-400' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">{getAddrIcon(addr.label)}</span>
                          <span className="text-xs font-black text-gray-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">DEFAULT</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          {addr.fullName} · {addr.phone}<br/>
                          {addr.addressLine}, {addr.city}
                        </p>
                      </div>
                    ))}
                    {addresses.length > 2 && (
                      <p className="text-[11px] text-gray-400 text-center">+{addresses.length - 2} more address{addresses.length - 2 > 1 ? 'es' : ''}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-gray-400">
                    <span className="text-2xl block mb-1">📭</span>
                    No saved addresses yet
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('addresses')
                    loadAddresses()
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  📍 {addresses.length > 0 ? 'Manage My Addresses' : 'Add Delivery Address'}
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: My Addresses ─────────────────────────────────── */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900 text-lg">Saved Delivery Addresses</h2>
              <p className="text-xs text-gray-400 mt-0.5">Save multiple addresses for fast checkout</p>
            </div>
            <button onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-sm">
              ＋ Add Address
            </button>
          </div>

          {loadingAddresses ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto">📍</div>
              <h3 className="font-bold text-gray-900">No Saved Addresses Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Add your delivery address once and use it across all future orders — no retyping needed!</p>
              <button onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all">
                ＋ Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id}
                  className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all relative ${
                    addr.isDefault ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      ✓ DEFAULT
                    </span>
                  )}

                  {/* Label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{getAddrIcon(addr.label)}</span>
                    <span className="font-black text-gray-900 text-sm">{addr.label}</span>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-0.5 text-xs text-gray-700 mb-4">
                    <p className="font-bold text-gray-900">{addr.fullName}</p>
                    <p className="text-gray-500">{addr.phone}</p>
                    <p>{addr.addressLine}</p>
                    <p>{addr.city}, {addr.district}, {addr.country}</p>
                    {addr.postalCode && <p className="text-gray-400">Postal: {addr.postalCode}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => openEditModal(addr)}
                      className="flex-1 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      ✏️ Edit
                    </button>
                    {!addr.isDefault && (
                      <button onClick={() => handleSetDefault(addr.id)}
                        className="flex-1 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                        ✓ Set Default
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirmId(addr.id)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              {/* Add more card */}
              <button onClick={openAddModal}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-all min-h-[160px]">
                <span className="text-3xl">＋</span>
                <span className="text-xs font-bold">Add New Address</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: My Orders ────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">My Order History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track current packages and past purchases</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter tags */}
              {(['all', 'pending', 'processing', 'delivered'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedOrderFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    selectedOrderFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}

              <Link to="/products" className="ml-2 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                + Shop More
              </Link>
            </div>
          </div>

          {loadingOrders ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto">📦</div>
              <h3 className="font-bold text-gray-900 text-base">No Orders Found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {selectedOrderFilter !== 'all'
                  ? `No orders matching status "${selectedOrderFilter}".`
                  : "You haven't placed any orders yet. Discover our latest items and get them delivered to your doorstep!"}
              </p>
              <Link to="/products" className="inline-block px-6 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-sm">
                Browse Products →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusColor =
                  order.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : order.status === 'processing' || order.status === 'confirmed'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : order.status === 'shipped'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : order.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'

                const displayAddress = order.shippingAddress
                  ? `${order.shippingAddress.addressLine}, ${order.shippingAddress.city}, ${order.shippingAddress.district || ''}`
                  : `${order.address || ''}, ${order.city || ''}`

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-gray-100 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-gray-900">{order.orderNumber || order.id}</span>
                        <span className="text-xs text-gray-400">Placed: {order.orderDate || new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                            <div>
                              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.productName}</h4>
                              <p className="text-gray-400 text-[11px]">Quantity: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="font-black text-gray-900 text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div className="text-gray-500 space-y-0.5">
                        <p><span className="font-semibold text-gray-700">📍 Delivery:</span> {displayAddress}</p>
                        <p><span className="font-semibold text-gray-700">💳 Payment:</span> {order.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : 'Online Gateway'} ({order.paymentStatus})</p>
                      </div>
                      <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                        <span className="text-gray-400 text-[11px] block">Total Amount</span>
                        <span className="text-lg font-black text-emerald-600">৳{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: My Reviews ───────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">My Reviews & Ratings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage your submitted reviews and feedback</p>
            </div>

            <button
              onClick={() => setShowWriteReviewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              ✍️ Write a Review
            </button>
          </div>

          {loadingReviews ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading your reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto">⭐</div>
              <h3 className="font-bold text-gray-900 text-base">No Reviews Submitted Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Share your shopping experience, product quality, or delivery service to help other customers in Bangladesh!
              </p>
              <button
                onClick={() => setShowWriteReviewModal(true)}
                className="inline-block px-6 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
              >
                Write Your First Review →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Rating stars */}
                      <div className="flex items-center gap-1 text-amber-400 text-sm mb-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx}>{idx < rev.rating ? '★' : '☆'}</span>
                        ))}
                        <span className="text-xs font-black text-gray-600 ml-1">({rev.rating}.0)</span>
                      </div>
                      <p className="text-xs text-gray-400">📍 {rev.location || 'Dhaka, Bangladesh'}</p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        rev.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : rev.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {rev.status === 'approved' ? '✓ Approved (Live)' : rev.status === 'rejected' ? '✕ Rejected' : '⏳ Pending Review'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 italic bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                    "{rev.review}"
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-600">{rev.customerName}</span>
                    <span>
                      Submitted: {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Address Modal ─────────────────────────────── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddressSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {addressMsg && (
                <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${
                  addressMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {addressMsg.text}
                </div>
              )}

              {/* Label Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Label</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((l) => (
                    <button key={l} type="button" onClick={() => setAddressForm({ ...addressForm, label: l })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        addressForm.label === l ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}>
                      {l === 'Home' ? '🏠' : l === 'Office' ? '🏢' : '📍'} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="Recipient's full name" value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone <span className="text-rose-500">*</span></label>
                <input required type="tel" placeholder="+880 1700 000000" value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="House no., Road, Area..." value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              {/* City + District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">City <span className="text-rose-500">*</span></label>
                  <input required type="text" placeholder="e.g. Dhaka" value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">District <span className="text-rose-500">*</span></label>
                  <select value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                    {BANGLADESH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Postal + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Postal Code</label>
                  <input type="text" placeholder="e.g. 1207" value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Country</label>
                  <input type="text" value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>

              {/* Set as Default */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 pt-1">
                <input type="checkbox" checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500" />
                ✓ Set as my default delivery address
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingAddress}
                  className="flex-1 py-2.5 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                  {savingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">🗑️</div>
            <h3 className="font-black text-gray-900 text-base">Delete Address</h3>
            <p className="text-xs text-gray-500">Are you sure you want to delete this saved address? This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 text-sm font-black text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Write Review Modal ───────────────────────────────────── */}
      {showWriteReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">✍️ Write Customer Review</h3>
              <button onClick={() => setShowWriteReviewModal(false)} className="text-gray-400 font-bold hover:text-gray-700">✕</button>
            </div>

            {reviewMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  reviewMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {reviewMsg.text}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rating (1 to 5 Stars) *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= newRating ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Your Location</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka, Bangladesh"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Review Feedback * (min 10 characters)</label>
                <textarea
                  rows={4}
                  placeholder="Describe product quality, delivery speed, customer service experience..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  required
                  minLength={10}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWriteReviewModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default CustomerProfilePage
