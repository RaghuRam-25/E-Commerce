import React, { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Customer } from '@/types'
import { INITIAL_CUSTOMERS } from '@/services/mockData'

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'active' && !c.isActive) return false
    if (statusFilter === 'inactive' && c.isActive) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = c.name.toLowerCase().includes(q)
      const matchEmail = c.email.toLowerCase().includes(q)
      const matchPhone = c.phone.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchPhone) return false
    }
    return true
  })

  const toggleCustomerStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    )
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Account Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">View customer order histories and account status</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Search customer by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select
          value={statusFilter}
          options={[
            { value: 'all', label: 'All Customer Accounts' },
            { value: 'active', label: 'Active Only' },
            { value: 'inactive', label: 'Inactive / Suspended' },
          ]}
          onChange={(val) => setStatusFilter(val)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Customer Name</th>
              <th className="p-3">Email & Phone</th>
              <th className="p-3">City</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total Spent</th>
              <th className="p-3">Account Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{customer.name}</td>
                <td className="p-3">
                  <p className="text-gray-800 font-medium">{customer.email}</p>
                  <p className="text-[10px] text-gray-400">{customer.phone}</p>
                </td>
                <td className="p-3">{customer.city}</td>
                <td className="p-3 font-bold text-gray-900">{customer.totalOrders}</td>
                <td className="p-3 font-bold text-emerald-600">৳{customer.totalSpent.toLocaleString()}</td>
                <td className="p-3">
                  <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                    {customer.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="text-xs text-emerald-600 hover:underline font-bold"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Customer Profile: {selectedCustomer.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p><strong>Email Address:</strong> {selectedCustomer.email}</p>
              <p><strong>Phone Number:</strong> {selectedCustomer.phone}</p>
              <p><strong>Shipping Address:</strong> {selectedCustomer.address}, {selectedCustomer.city} ({selectedCustomer.postalCode})</p>
              <p><strong>Total Orders Placed:</strong> {selectedCustomer.totalOrders}</p>
              <p><strong>Lifetime Spent Amount:</strong> ৳{selectedCustomer.totalSpent.toLocaleString()}</p>
              <p>
                <strong>Account Status: </strong>
                <span className={selectedCustomer.isActive ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {selectedCustomer.isActive ? 'Active Account' : 'Deactivated Account'}
                </span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant={selectedCustomer.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => toggleCustomerStatus(selectedCustomer.id)}
                className="flex-1 font-bold"
              >
                {selectedCustomer.isActive ? 'Deactivate Account' : 'Activate Account'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCustomer(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCustomersPage