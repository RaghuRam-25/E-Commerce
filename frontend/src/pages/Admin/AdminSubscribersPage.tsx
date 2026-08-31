import React, { useState, useEffect } from 'react'
import {
  getAllSubscribers,
  updateSubscriberStatus,
  deleteSubscriber,
  getSubscriberStats,
} from '@/services/subscriptionService'
import type { Subscriber, SubscriberStats } from '@/services/subscriptionService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export const AdminSubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    unsubscribed: 0,
    newThisWeek: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [subs, st] = await Promise.all([
        getAllSubscribers(search, statusFilter),
        getSubscriberStats(),
      ])
      setSubscribers(subs)
      setStats(st)
    } catch (e) {
      console.error('Failed to load subscriber management data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, statusFilter])

  const handleToggleStatus = async (sub: Subscriber) => {
    const newStatus = sub.status === 'active' ? 'unsubscribed' : 'active'
    const updated = await updateSubscriberStatus(sub.id, newStatus)
    if (updated) {
      loadData()
    }
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    const success = await deleteSubscriber(deleteTargetId)
    if (success) {
      setDeleteTargetId(null)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📧</span>
            <h1 className="text-xl font-black text-gray-900">Marketing & Newsletter Subscribers</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage email subscribers, filter audiences, and track growth metrics.
          </p>
        </div>
      </div>

      {/* Useful Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl text-xl font-bold">
            👥
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Total Subscribers</p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl text-xl font-bold">
            ✅
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Active Subscribers</p>
            <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl text-xl font-bold">
            🚫
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Unsubscribed</p>
            <p className="text-2xl font-black text-amber-600">{stats.unsubscribed}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl text-xl font-bold">
            ✨
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">New (Last 7 Days)</p>
            <p className="text-2xl font-black text-purple-600">{stats.newThisWeek}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-600">Filter Status:</span>
          <div className="w-40">
            <Select
              value={statusFilter}
              options={[
                { value: 'all', label: 'All Subscribers' },
                { value: 'active', label: 'Active Only' },
                { value: 'unsubscribed', label: 'Unsubscribed Only' },
              ]}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Subscriber Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Subscription Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  Loading subscribers...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No subscribers found matching your query.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-semibold text-gray-900 font-mono">
                    {sub.email}
                  </td>
                  <td className="p-3">
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status === 'active' ? 'Active' : 'Unsubscribed'}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(sub.subscribedAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(sub)}
                      className={`text-xs font-bold hover:underline ${
                        sub.status === 'active'
                          ? 'text-amber-600 hover:text-amber-700'
                          : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {sub.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(sub.id)}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">Delete Subscriber</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to permanently delete this subscriber from your database?
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} className="flex-1">
                Delete Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSubscribersPage
