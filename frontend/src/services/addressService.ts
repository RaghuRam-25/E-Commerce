import type { SavedAddress } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/addresses`
  : 'http://localhost:5000/api/addresses'

const STORAGE_KEY = 'bd_commerce_addresses'

// ── Local Fallback Helpers ───────────────────────────────────────
function getLocalAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalAddresses(addresses: SavedAddress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
  } catch {}
}

function makeId(): string {
  return 'addr-' + Math.random().toString(36).substring(2, 10)
}

function getToken(): string {
  return localStorage.getItem('bd_commerce_token') || ''
}

// ── Normalize backend response ───────────────────────────────────
function normalizeAddress(raw: any): SavedAddress {
  return {
    id: raw._id || raw.id,
    label: raw.label || 'Home',
    fullName: raw.fullName || '',
    phone: raw.phone || '',
    addressLine: raw.addressLine || '',
    city: raw.city || '',
    district: raw.district || '',
    postalCode: raw.postalCode || '',
    country: raw.country || 'Bangladesh',
    isDefault: Boolean(raw.isDefault),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

// ── GET /api/addresses ───────────────────────────────────────────
export async function getAddresses(): Promise<SavedAddress[]> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.addresses)) {
          const normalized = data.addresses.map(normalizeAddress)
          saveLocalAddresses(normalized)
          return normalized
        }
      }
    } catch {}
  }

  return getLocalAddresses()
}

// ── GET default address ──────────────────────────────────────────
export async function getDefaultAddress(): Promise<SavedAddress | null> {
  const all = await getAddresses()
  return all.find((a) => a.isDefault) || all[0] || null
}

// ── POST /api/addresses ──────────────────────────────────────────
export async function createAddress(
  data: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; address?: SavedAddress; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.address) {
          const normalized = normalizeAddress(json.address)
          const existing = getLocalAddresses().filter((a) => a.id !== normalized.id)
          const updated = data.isDefault
            ? existing.map((a) => ({ ...a, isDefault: false }))
            : existing
          saveLocalAddresses([...updated, normalized])
          return { success: true, address: normalized, message: 'Address saved successfully.' }
        }
      } else if (res.status !== 404) {
        // Validation errors from backend
        const json = await res.json().catch(() => null)
        if (json?.message) {
          return { success: false, message: json.message }
        }
      }
    } catch {}
  }

  // Local fallback (if backend route 404 or backend unavailable)
  const existing = getLocalAddresses()
  if (existing.length >= 10) {
    return { success: false, message: 'Maximum 10 addresses allowed.' }
  }
  const newAddr: SavedAddress = {
    ...data,
    id: makeId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const shouldBeDefault = data.isDefault || existing.length === 0
  const updated = shouldBeDefault
    ? existing.map((a) => ({ ...a, isDefault: false }))
    : existing
  const finalAddr = { ...newAddr, isDefault: shouldBeDefault }
  saveLocalAddresses([...updated, finalAddr])
  return { success: true, address: finalAddr, message: 'Address saved successfully.' }
}

// ── PATCH /api/addresses/:id ─────────────────────────────────────
export async function updateAddress(
  id: string,
  data: Partial<Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; address?: SavedAddress; message: string }> {
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
        if (json.success && json.address) {
          const normalized = normalizeAddress(json.address)
          const existing = getLocalAddresses()
          saveLocalAddresses(existing.map((a) => (a.id === id ? normalized : a)))
          return { success: true, address: normalized, message: 'Address updated successfully.' }
        }
      } else if (res.status !== 404) {
        const json = await res.json().catch(() => null)
        if (json?.message) {
          return { success: false, message: json.message }
        }
      }
    } catch {}
  }

  // Local fallback
  const existing = getLocalAddresses()
  const target = existing.find((a) => a.id === id)
  if (!target) return { success: false, message: 'Address not found.' }
  const updated = { ...target, ...data, updatedAt: new Date().toISOString() }
  saveLocalAddresses(existing.map((a) => (a.id === id ? updated : a)))
  return { success: true, address: updated, message: 'Address updated successfully.' }
}

// ── DELETE /api/addresses/:id ────────────────────────────────────
export async function deleteAddress(id: string): Promise<{ success: boolean; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const existing = getLocalAddresses().filter((a) => a.id !== id)
        saveLocalAddresses(existing)
        return { success: true, message: 'Address deleted successfully.' }
      }
    } catch {}
  }

  // Local fallback
  const existing = getLocalAddresses()
  const removed = existing.find((a) => a.id === id)
  const remaining = existing.filter((a) => a.id !== id)
  if (removed?.isDefault && remaining.length > 0) {
    remaining[0].isDefault = true
  }
  saveLocalAddresses(remaining)
  return { success: true, message: 'Address deleted successfully.' }
}

// ── PATCH /api/addresses/:id/default ────────────────────────────
export async function setDefaultAddress(id: string): Promise<{ success: boolean; message: string }> {
  const token = getToken()
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const existing = getLocalAddresses().map((a) => ({ ...a, isDefault: a.id === id }))
        saveLocalAddresses(existing)
        return { success: true, message: 'Default address updated.' }
      }
    } catch {}
  }

  // Local fallback
  const existing = getLocalAddresses().map((a) => ({ ...a, isDefault: a.id === id }))
  saveLocalAddresses(existing)
  return { success: true, message: 'Default address updated.' }
}
