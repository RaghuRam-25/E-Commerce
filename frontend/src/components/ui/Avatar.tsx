import React from 'react'

interface AvatarProps {
  src: string
  alt: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  className,
  size = 'md',
}) => {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }

  return (
    <img
      src={src}
      alt={alt}
      className={`
        rounded-full
        ${sizeMap[size]}
        object-cover
        ${className}
      `}
    />
  )
}

Avatar.displayName = 'Avatar'