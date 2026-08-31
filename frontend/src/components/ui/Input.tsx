import React from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  variant?: 'default' | 'outlined' | 'filled'
  prefixNode?: React.ReactNode
  suffixNode?: React.ReactNode
  className?: string
}

export const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  label,
  error,
  variant = 'default',
  prefixNode,
  suffixNode,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm w-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400'

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefixNode && <div className="absolute left-3 text-gray-400">{prefixNode}</div>}
        <input
          id={id}
          type={type}
          className={`${baseClasses} ${prefixNode ? 'pl-9' : ''} ${suffixNode ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {suffixNode && <div className="absolute right-3 text-gray-400">{suffixNode}</div>}
      </div>
      {error && (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  )
}

Input.displayName = 'Input'