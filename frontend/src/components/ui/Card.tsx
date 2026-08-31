import React from 'react'

interface CardProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
}) => {
  const baseClasses = 'rounded-lg border overflow-hidden'

  const variantClasses = {
    default: 'border-border',
    outlined: 'border border-border',
    elevated: 'shadow-sm',
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}

Card.displayName = 'Card'