import React from 'react'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'accent'
  className?: string
}

const badgeVariants = {
  default: 'bg-emerald-100 text-emerald-800 font-medium',
  destructive: 'bg-red-100 text-red-800 font-medium',
  outline: 'border border-gray-300 text-gray-700',
  secondary: 'bg-gray-100 text-gray-800 font-medium',
  accent: 'bg-emerald-600 text-white font-medium',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const classes = badgeVariants[variant] || badgeVariants.default

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${classes} ${className}`}>
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'