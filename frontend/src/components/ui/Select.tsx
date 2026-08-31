import React from 'react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  value?: string | number
  onChange?: (value: string) => void
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  placeholder,
  options,
  disabled,
  value,
  onChange,
  className = '',
  id,
  ...props
}) => {
  const selectClasses = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm w-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id || 'select'} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id || 'select'}
        className={`${selectClasses} ${className}`}
        disabled={disabled}
        value={value !== undefined ? String(value) : ''}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

Select.displayName = 'Select'