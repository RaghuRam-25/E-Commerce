import React, { useState } from 'react'
import { useSocial, RenderSocialIcon } from '@/contexts/SocialContext'
import type { SocialLink, SocialIconName } from '@/contexts/SocialContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const PLATFORM_OPTIONS: { value: SocialIconName; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const PLATFORM_PRESETS: Record<SocialIconName, { name: string; label: string; urlPlaceholder: string; description: string }> = {
  facebook: {
    name: 'Facebook',
    label: 'Follow us on Facebook',
    urlPlaceholder: 'https://facebook.com/bangladeshcommerce',
    description: 'Join our official Facebook community for daily product updates and offers.',
  },
  instagram: {
    name: 'Instagram',
    label: 'Follow us on Instagram',
    urlPlaceholder: 'https://instagram.com/bangladeshcommerce',
    description: 'Check out our story highlights, new arrival photos, and customer reviews.',
  },
  linkedin: {
    name: 'LinkedIn',
    label: 'Connect on LinkedIn',
    urlPlaceholder: 'https://linkedin.com/company/bangladeshcommerce',
    description: 'Follow our corporate announcements, hiring updates, and business news.',
  },
  youtube: {
    name: 'YouTube',
    label: 'Subscribe on YouTube',
    urlPlaceholder: 'https://youtube.com/@bangladeshcommerce',
    description: 'Watch video unboxings, product reviews, and customer showcase videos.',
  },
  twitter: {
    name: 'X / Twitter',
    label: 'Follow on X',
    urlPlaceholder: 'https://x.com/bd_commerce',
    description: 'Get real-time announcements, flash sales, and customer care responses.',
  },
  tiktok: {
    name: 'TikTok',
    label: 'Follow on TikTok',
    urlPlaceholder: 'https://tiktok.com/@bangladeshcommerce',
    description: 'Watch quick product demos, trending reels, and behind-the-scenes content.',
  },
  whatsapp: {
    name: 'WhatsApp',
    label: 'Chat on WhatsApp',
    urlPlaceholder: 'https://wa.me/8801234567890',
    description: 'Message our customer care team directly for instant support.',
  },
}

export const AdminSocialPage: React.FC = () => {
  const { socialLinks, addSocialLink, updateSocialLink, toggleSocialLinkStatus, deleteSocialLink } = useSocial()

  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [formData, setFormData] = useState<{
    platform: string
    url: string
    label: string
    iconName: SocialIconName
    description: string
    isActive: boolean
    order: number
  }>({
    platform: 'Facebook',
    url: 'https://facebook.com/bangladeshcommerce',
    label: 'Follow us on Facebook',
    iconName: 'facebook',
    description: 'Join our official Facebook community for daily product updates and offers.',
    isActive: true,
    order: socialLinks.length + 1,
  })

  const handleOpenAddModal = () => {
    setEditingId(null)
    const preset = PLATFORM_PRESETS['facebook']
    setFormData({
      platform: preset.name,
      url: preset.urlPlaceholder,
      label: preset.label,
      iconName: 'facebook',
      description: preset.description,
      isActive: true,
      order: socialLinks.length + 1,
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (link: SocialLink) => {
    setEditingId(link.id)
    setFormData({
      platform: link.platform,
      url: link.url,
      label: link.label,
      iconName: link.iconName,
      description: link.description || '',
      isActive: link.isActive,
      order: link.order,
    })
    setShowModal(true)
  }

  const handleSaveSocialLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateSocialLink(editingId, formData)
    } else {
      addSocialLink(formData)
    }
    setShowModal(false)
  }

  const handleIconSelectChange = (val: string) => {
    const icon = val as SocialIconName
    const preset = PLATFORM_PRESETS[icon]
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        iconName: icon,
        platform: preset.name,
        label: preset.label,
        description: preset.description,
        url: prev.url && !Object.values(PLATFORM_PRESETS).some((p) => p.urlPlaceholder === prev.url)
          ? prev.url
          : preset.urlPlaceholder,
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h1 className="text-xl font-black text-gray-900">Social Media Control</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage social media profiles displayed on the About Page and Global Footer
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="font-bold">
          + Add Social Platform
        </Button>
      </div>

      {/* Social Links Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Platform</th>
              <th className="p-3">Profile URL</th>
              <th className="p-3">Visibility Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {socialLinks
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-500 font-mono">#{link.order}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                        <RenderSocialIcon iconName={link.iconName} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{link.platform}</p>
                        <p className="text-[10px] text-gray-400">{link.label}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-mono hover:underline truncate max-w-xs block"
                    >
                      {link.url} ↗
                    </a>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleSocialLinkStatus(link.id)}
                      className="cursor-pointer"
                    >
                      <Badge variant={link.isActive ? 'default' : 'secondary'}>
                        {link.isActive ? 'Active (Visible)' : 'Disabled (Hidden)'}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(link)}
                      className="text-xs text-emerald-600 hover:underline font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(link.id)}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">Delete Social Platform</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete this social link? It will be removed from the About page and Global Footer.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteSocialLink(deleteTargetId)
                  setDeleteTargetId(null)
                }}
                className="flex-1"
              >
                Delete Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Social Platform' : 'Add Social Platform'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSocialLink} className="space-y-4">
              <Select
                label="Select Platform Icon *"
                value={formData.iconName}
                options={PLATFORM_OPTIONS}
                onChange={handleIconSelectChange}
              />

              <Input
                label="Display Platform Name *"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                required
              />

              <Input
                label="Profile URL *"
                type="url"
                placeholder={PLATFORM_PRESETS[formData.iconName]?.urlPlaceholder || 'https://...'}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />

              <Input
                label="Link Tooltip Label"
                placeholder="e.g. Follow us on Facebook"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />

              <Input
                label="Short Description (for About Page)"
                placeholder="e.g. Join our Facebook community for daily updates"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Input
                label="Display Order *"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                required
              />

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Active (Visible on Website Footer & About Page)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1 font-bold">
                  {editingId ? 'Save Changes' : 'Add Platform'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSocialPage

