import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { User, UserRole } from '@/types'

export const AdminManagementPage: React.FC = () => {
  const { user: currentUser, users, promoteToAdmin, demoteToCustomer, toggleUserStatus } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = u.name.toLowerCase().includes(q)
      const matchEmail = u.email.toLowerCase().includes(q)
      const matchPhone = u.phone?.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchPhone) return false
    }
    return true
  })

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'accent'
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-xl font-black text-gray-900">Admin Privileges & User Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Super Admin Portal — Promote customers to Admins, revoke privileges, and toggle account statuses
          </p>
        </div>
        <div className="bg-purple-100 text-purple-900 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1">
          <span>👑 Logged in as Super Admin</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select
          value={roleFilter}
          options={[
            { value: 'all', label: 'All Roles (Customers, Admins, Super Admin)' },
            { value: 'customer', label: 'Customers Only' },
            { value: 'admin', label: 'Admins Only' },
            { value: 'super_admin', label: 'Super Admin Only' },
          ]}
          onChange={(val) => setRoleFilter(val)}
        />
      </div>

      {/* Users Directory Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Email & Phone</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Creation Date</th>
              <th className="p-3 text-right">Privilege Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredUsers.map((u) => {
              const isSuperAdminUser = u.role === 'super_admin'
              const isSelf = currentUser?.id === u.id

              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="font-medium text-gray-900">{u.email}</p>
                    <p className="text-[10px] text-gray-400">{u.phone || 'N/A'}</p>
                  </td>

                  <td className="p-3">
                    <Badge variant={getRoleBadgeVariant(u.role)} className="uppercase text-[10px]">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>

                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 font-bold ${u.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      {u.status}
                    </span>
                  </td>

                  <td className="p-3 text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-right space-x-2">
                    {/* View details */}
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="text-xs text-gray-600 hover:text-gray-900 font-semibold underline"
                    >
                      Details
                    </button>

                    {/* Promote to Admin or Demote */}
                    {!isSuperAdminUser && u.role === 'customer' && (
                      <button
                        onClick={() => promoteToAdmin(u.id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors"
                      >
                        + Make Admin
                      </button>
                    )}

                    {!isSuperAdminUser && u.role === 'admin' && (
                      <button
                        onClick={() => demoteToCustomer(u.id)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Demote to Customer
                      </button>
                    )}

                    {/* Activate / Deactivate Toggle */}
                    {!isSuperAdminUser && !isSelf && (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">User Audit Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p><strong>User ID:</strong> <span className="font-mono text-gray-900">{selectedUser.id}</span></p>
              <p><strong>Full Name:</strong> {selectedUser.name}</p>
              <p><strong>Email Address:</strong> {selectedUser.email}</p>
              <p><strong>Phone Number:</strong> {selectedUser.phone || 'N/A'}</p>
              <p><strong>Assigned Role:</strong> <span className="uppercase font-bold text-emerald-700">{selectedUser.role}</span></p>
              <p><strong>Account Status:</strong> <span className="capitalize font-bold">{selectedUser.status}</span></p>
              <p><strong>Registration Date:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagementPage
