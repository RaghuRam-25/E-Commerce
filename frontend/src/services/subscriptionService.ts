export interface Subscriber {
  id: string
  email: string
  status: 'active' | 'unsubscribed'
  subscribedAt: string
  updatedAt: string
}

export interface SubscriberStats {
  total: number
  active: number
  unsubscribed: number
  newThisWeek: number
}

export interface SubscriptionResponse {
  success: boolean
  message: string
  subscriber?: Subscriber
}

const API_BASE = '/api/subscribers'

const INITIAL_FALLBACK_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    email: 'ayesha.khan@example.com',
    status: 'active',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'sub-2',
    email: 'rahman.islam@example.com',
    status: 'active',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'sub-3',
    email: 'fatima.ahmed@example.com',
    status: 'unsubscribed',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'sub-4',
    email: 'tanvir.hossain@example.com',
    status: 'active',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

// Helper for local persistence when backend is offline
const getLocalSubscribers = (): Subscriber[] => {
  try {
    const stored = localStorage.getItem('bd_commerce_subscribers')
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.error('Failed to load subscribers from localStorage', e)
  }
  return INITIAL_FALLBACK_SUBSCRIBERS
}

const saveLocalSubscribers = (subscribers: Subscriber[]) => {
  try {
    localStorage.setItem('bd_commerce_subscribers', JSON.stringify(subscribers))
  } catch (e) {
    console.error('Failed to save subscribers to localStorage', e)
  }
}

/**
 * Public Newsletter Subscription API call
 */
export async function subscribeToNewsletter(email: string): Promise<SubscriptionResponse> {
  const cleanEmail = (email || '').trim().toLowerCase()

  // 1. Validation Checks
  if (!cleanEmail) {
    return { success: false, message: 'Please enter your email address.' }
  }

  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  // 2. Try Backend API first
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Successfully subscribed',
        subscriber: data.subscriber,
      }
    } else {
      return {
        success: false,
        message: data.message || 'Subscription failed. Please try again.',
      }
    }
  } catch (err) {
    // 3. Fallback to LocalStorage persistence if backend server is unreachable
    const subscribers = getLocalSubscribers()
    const existing = subscribers.find((s) => s.email.toLowerCase() === cleanEmail)

    if (existing) {
      if (existing.status === 'active') {
        return { success: false, message: 'This email is already subscribed.' }
      } else {
        existing.status = 'active'
        existing.updatedAt = new Date().toISOString()
        saveLocalSubscribers(subscribers)
        return {
          success: true,
          message: '🎉 Subscription reactivated successfully!',
          subscriber: existing,
        }
      }
    }

    const newSub: Subscriber = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    subscribers.unshift(newSub)
    saveLocalSubscribers(subscribers)

    return {
      success: true,
      message: 'Successfully subscribed',
      subscriber: newSub,
    }
  }
}

/**
 * Fetch all subscribers (Admin Endpoint)
 */
export async function getAllSubscribers(
  search?: string,
  status?: string
): Promise<Subscriber[]> {
  try {
    const token = localStorage.getItem('token')
    const queryParams = new URLSearchParams()
    if (search) queryParams.append('search', search)
    if (status) queryParams.append('status', status)

    const res = await fetch(`${API_BASE}?${queryParams.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.subscribers)) {
        return data.subscribers
      }
    }
  } catch (err) {
    // API offline fallback
  }

  let list = getLocalSubscribers()
  if (search) {
    const q = search.trim().toLowerCase()
    list = list.filter((s) => s.email.toLowerCase().includes(q))
  }
  if (status && status !== 'all') {
    list = list.filter((s) => s.status === status)
  }
  return list.sort(
    (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
  )
}

/**
 * Update subscriber status (Activate / Deactivate)
 */
export async function updateSubscriberStatus(
  id: string,
  status: 'active' | 'unsubscribed'
): Promise<Subscriber | null> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.subscriber) {
        return data.subscriber
      }
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalSubscribers()
  const target = list.find((s) => s.id === id)
  if (target) {
    target.status = status
    target.updatedAt = new Date().toISOString()
    saveLocalSubscribers(list)
    return target
  }
  return null
}

/**
 * Delete a subscriber
 */
export async function deleteSubscriber(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) {
      return true
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalSubscribers()
  const updated = list.filter((s) => s.id !== id)
  saveLocalSubscribers(updated)
  return true
}

/**
 * Get subscriber stats for Admin Dashboard
 */
export async function getSubscriberStats(): Promise<SubscriberStats> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/stats`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.stats) {
        return data.stats
      }
    }
  } catch (err) {
    // API offline fallback
  }

  const list = getLocalSubscribers()
  const total = list.length
  const active = list.filter((s) => s.status === 'active').length
  const unsubscribed = list.filter((s) => s.status === 'unsubscribed').length
  const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7
  const newThisWeek = list.filter(
    (s) => new Date(s.subscribedAt).getTime() >= sevenDaysAgo
  ).length

  return { total, active, unsubscribed, newThisWeek }
}
