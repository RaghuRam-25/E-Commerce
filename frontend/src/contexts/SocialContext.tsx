import React, { createContext, useContext, useState, useEffect } from 'react'

export type SocialIconName =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'whatsapp'

export interface SocialLink {
  id: string
  platform: string
  url: string
  label: string
  iconName: SocialIconName
  description?: string
  isActive: boolean
  order: number
}

const INITIAL_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'soc-1',
    platform: 'Facebook',
    url: 'https://facebook.com/bangladeshcommerce',
    label: 'Follow us on Facebook',
    iconName: 'facebook',
    description: 'Join our official Facebook community for daily product updates and offers.',
    isActive: true,
    order: 1,
  },
  {
    id: 'soc-2',
    platform: 'Instagram',
    url: 'https://instagram.com/bangladeshcommerce',
    label: 'Follow us on Instagram',
    iconName: 'instagram',
    description: 'Check out our story highlights, new arrival photos, and customer reviews.',
    isActive: true,
    order: 2,
  },
  {
    id: 'soc-3',
    platform: 'LinkedIn',
    url: 'https://linkedin.com/company/bangladeshcommerce',
    label: 'Connect on LinkedIn',
    iconName: 'linkedin',
    description: 'Follow our corporate announcements, hiring updates, and business news.',
    isActive: true,
    order: 3,
  },
  {
    id: 'soc-4',
    platform: 'YouTube',
    url: 'https://youtube.com/@bangladeshcommerce',
    label: 'Subscribe on YouTube',
    iconName: 'youtube',
    description: 'Watch video unboxings, product reviews, and customer showcase videos.',
    isActive: true,
    order: 4,
  },
  {
    id: 'soc-5',
    platform: 'X / Twitter',
    url: 'https://x.com/bd_commerce',
    label: 'Follow on X',
    iconName: 'twitter',
    description: 'Get real-time announcements, flash sales, and customer care responses.',
    isActive: true,
    order: 5,
  },
  {
    id: 'soc-6',
    platform: 'TikTok',
    url: 'https://tiktok.com/@bangladeshcommerce',
    label: 'Follow on TikTok',
    iconName: 'tiktok',
    description: 'Watch quick product demos, trending reels, and behind-the-scenes content.',
    isActive: true,
    order: 6,
  },
  {
    id: 'soc-7',
    platform: 'WhatsApp',
    url: 'https://wa.me/8801234567890',
    label: 'Chat on WhatsApp',
    iconName: 'whatsapp',
    description: 'Message our customer care team directly for instant support.',
    isActive: true,
    order: 7,
  },
]

export interface SocialContextType {
  socialLinks: SocialLink[]
  activeSocialLinks: SocialLink[]
  addSocialLink: (link: Omit<SocialLink, 'id'>) => void
  updateSocialLink: (id: string, link: Partial<SocialLink>) => void
  toggleSocialLinkStatus: (id: string) => void
  deleteSocialLink: (id: string) => void
}

const SocialContext = createContext<SocialContextType | undefined>(undefined)

export const useSocial = () => {
  const context = useContext(SocialContext)
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider')
  }
  return context
}

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    try {
      const stored = localStorage.getItem('bd_commerce_social_links')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load social links:', e)
    }
    return INITIAL_SOCIAL_LINKS
  })

  useEffect(() => {
    try {
      localStorage.setItem('bd_commerce_social_links', JSON.stringify(socialLinks))
    } catch (e) {
      console.error('Failed to save social links:', e)
    }
  }, [socialLinks])

  const activeSocialLinks = socialLinks
    .filter((l) => l.isActive && l.url.trim() !== '')
    .sort((a, b) => a.order - b.order)

  const addSocialLink = (data: Omit<SocialLink, 'id'>) => {
    const newLink: SocialLink = {
      ...data,
      id: 'soc-' + Math.random().toString(36).substring(2, 9),
    }
    setSocialLinks((prev) => [...prev, newLink])
  }

  const updateSocialLink = (id: string, updated: Partial<SocialLink>) => {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
  }

  const toggleSocialLinkStatus = (id: string) => {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
    )
  }

  const deleteSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <SocialContext.Provider
      value={{
        socialLinks,
        activeSocialLinks,
        addSocialLink,
        updateSocialLink,
        toggleSocialLinkStatus,
        deleteSocialLink,
      }}
    >
      {children}
    </SocialContext.Provider>
  )
}

// Helper SVG Icon component for rendering platform icons
export const RenderSocialIcon: React.FC<{ iconName: SocialIconName; className?: string }> = ({
  iconName,
  className = 'w-5 h-5',
}) => {
  switch (iconName) {
    case 'facebook':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.03c0 1.93-.53 3.82-1.57 5.4-1.04 1.58-2.54 2.76-4.32 3.39-1.78.63-3.71.69-5.52.17-1.81-.52-3.41-1.6-4.54-3.08-1.13-1.48-1.69-3.32-1.6-5.18.09-1.86.82-3.62 2.07-4.99 1.25-1.37 2.94-2.23 4.79-2.45 1.85-.22 3.73.2 5.34 1.19v4.13c-.93-.57-2.02-.85-3.11-.8-1.09.05-2.13.48-2.91 1.22-.78.74-1.25 1.75-1.32 2.85-.07 1.1.26 2.2.93 3.07.67.87 1.66 1.45 2.76 1.63 1.1.18 2.24-.04 3.2-.62.96-.58 1.67-1.49 2.01-2.55.34-1.06.37-2.21.09-3.29V.02z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-2v-6h2v1.1c.37-.62 1.1-1.1 2-1.1 1.66 0 3 1.34 3 3v3z" />
        </svg>
      )
  }
}
