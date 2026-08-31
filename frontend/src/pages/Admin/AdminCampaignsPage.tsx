import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'

interface Campaign {
  id: string
  subject: string
  audience: string
  sentCount: number
  status: 'draft' | 'scheduled' | 'sent'
  createdDate: string
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    subject: '🎉 Pohela Boishakh Special 20% Discount Voucher!',
    audience: 'All Active Subscribers (4,250)',
    sentCount: 4250,
    status: 'sent',
    createdDate: '2026-04-10',
  },
  {
    id: 'camp-2',
    subject: '🔥 Flash Sale: Jamdani Saree & Crafted Brassware',
    audience: 'Active Subscribers',
    sentCount: 3900,
    status: 'sent',
    createdDate: '2026-06-18',
  },
  {
    id: 'camp-3',
    subject: '⚡ New Arrival Highlights - Autumn Collection',
    audience: 'Active Subscribers',
    sentCount: 0,
    status: 'draft',
    createdDate: '2026-08-25',
  },
]

export const AdminCampaignsPage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false)
  const [subject, setSubject] = useState<string>('')
  const [audience, setAudience] = useState<string>('active')
  const [content, setContent] = useState<string>('')
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS)

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject) return

    const newCamp: Campaign = {
      id: 'camp-' + Math.random().toString(36).substring(2, 7),
      subject,
      audience: audience === 'active' ? 'All Active Subscribers' : 'Segmented Audience',
      sentCount: 0,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
    }

    setCampaigns([newCamp, ...campaigns])
    setShowModal(false)
    setSubject('')
    setContent('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900">Email Marketing Campaigns</h1>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="font-bold">
          + Create Email Campaign
        </Button>
      </div>

      {/* Campaign History Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Campaign Subject</th>
              <th className="p-3">Target Audience</th>
              <th className="p-3">Recipients</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.map((camp) => (
              <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-bold text-gray-900">{camp.subject}</td>
                <td className="p-3 text-gray-500">{camp.audience}</td>
                <td className="p-3 font-mono font-bold text-gray-700">{camp.sentCount}</td>
                <td className="p-3">
                  <Badge variant={camp.status === 'sent' ? 'default' : 'secondary'}>
                    {camp.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3 text-gray-500">{camp.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Creating Campaign */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create Email Campaign Draft</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <Input
                label="Email Subject *"
                placeholder="e.g. 🔥 Weekend Super Offer - 15% Off Everything!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              <Select
                label="Target Audience *"
                value={audience}
                options={[
                  { value: 'active', label: 'All Active Subscribers' },
                  { value: 'unsubscribed', label: 'Unsubscribed List' },
                ]}
                onChange={(val) => setAudience(val)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email Body Content</label>
                <textarea
                  rows={4}
                  placeholder="Write your email announcement or promotion details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1 font-bold">
                  Save Campaign Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCampaignsPage
