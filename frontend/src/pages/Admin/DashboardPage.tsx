import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { apiClient } from '@/services/apiClient'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  approvedOrders: number
  processingOrders: number
  shippedOrders: number
  completedOrders: number
  cancelledOrders: number
  rejectedOrders: number
  totalCustomers: number
  totalProducts: number
  totalRevenue: number
}

interface OrderSummary {
  _id: string
  orderNumber?: string
  customerName: string
  total: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderDate?: string
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'secondary',
  confirmed: 'secondary',
  approved: 'accent',
  processing: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
  rejected: 'destructive',
  returned: 'outline',
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard/stats')
        setStats(res.stats)
        setRecentOrders(res.recentOrders || [])
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Executive Overview</h1>
          <p className="text-gray-500 text-xs mt-1">Loading dashboard...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-5 border border-gray-200 bg-gray-50 animate-pulse h-24" />
          ))}
        </div>
      </div>
    )
  }

  const orderCards = [
    {
      title: 'Pending Approval',
      value: stats?.pendingOrders || 0,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: '⏳',
      filter: 'pending',
    },
    {
      title: 'Processing',
      value: stats?.processingOrders || 0,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '⚙️',
      filter: 'processing',
    },
    {
      title: 'Shipped',
      value: stats?.shippedOrders || 0,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: '🚚',
      filter: 'shipped',
    },
    {
      title: 'Delivered',
      value: stats?.completedOrders || 0,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: '✓',
      filter: 'delivered',
    },
  ]

  const overviewCards = [
    {
      title: 'Total Revenue',
      value: `৳${(stats?.totalRevenue || 0).toLocaleString()}`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: '৳',
    },
    {
      title: 'Total Orders',
      value: (stats?.totalOrders || 0).toString(),
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '🛒',
    },
    {
      title: 'Active Products',
      value: (stats?.totalProducts || 0).toString(),
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: '📦',
    },
    {
      title: 'Customers',
      value: (stats?.totalCustomers || 0).toString(),
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '👥',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Executive Overview</h1>
          <p className="text-gray-500 text-xs mt-1">Real-time stats and metrics</p>
        </div>
        {stats && stats.pendingOrders > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-amber-800">
              {stats.pendingOrders} order{stats.pendingOrders !== 1 ? 's' : ''} awaiting approval
            </span>
          </div>
        )}
      </div>

      {/* Order Status Cards */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Order Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {orderCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(`/admin/orders?status=${card.filter}`)}
              className={`rounded-xl p-4 border shadow-sm ${card.color} space-y-1 text-left hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-80">
                <span>{card.title}</span>
                <span className="text-base">{card.icon}</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{card.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {overviewCards.map((stat) => (
          <div key={stat.title} className={`rounded-xl p-4 border shadow-sm ${stat.color} space-y-1`}>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-80">
              <span>{stat.title}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className="text-xl font-black text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-emerald-600 font-bold hover:underline">
            Manage All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/orders')}>
                  <td className="p-3 font-mono font-bold text-gray-900">{order.orderNumber || order._id.slice(-8)}</td>
                  <td className="p-3 font-medium text-gray-900">{order.customerName}</td>
                  <td className="p-3">{order.orderDate || new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-emerald-600">৳{order.total.toLocaleString()}</td>
                  <td className="p-3 capitalize">{order.paymentMethod}</td>
                  <td className="p-3">
                    <Badge variant={(ORDER_STATUS_COLORS[order.status] as any) || 'secondary'}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">No recent orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
