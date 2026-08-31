import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'link' | 'ghost'
export type ButtonSize = 'default' | 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
  link: 'text-emerald-600 hover:underline p-0 bg-transparent',
  ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2 px-4 text-sm',
  default: 'py-2.5 px-5 text-sm',
  lg: 'py-3 px-6 text-base',
  icon: 'p-2',
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const variantClass = buttonVariants[variant] || buttonVariants.primary
  const sizeClass = buttonSizes[size] || buttonSizes.default

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-lg 
        font-semibold transition-all focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-emerald-500 
        disabled:opacity-50 disabled:pointer-events-none cursor-pointer
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

Button.displayName = 'Button'