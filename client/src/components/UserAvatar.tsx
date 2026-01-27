import React from 'react'

interface UserAvatarProps {
  photoUrl?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function UserAvatar({ 
  photoUrl, 
  name, 
  size = 'md',
  className,
  style 
}: UserAvatarProps) {
  const sizeMap = {
    sm: { width: '28px', height: '28px', fontSize: '12px' },
    md: { width: '40px', height: '40px', fontSize: '16px' },
    lg: { width: '64px', height: '64px', fontSize: '24px' },
  }

  const sizeStyle = sizeMap[size]
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div
      style={{
        ...sizeStyle,
        borderRadius: '50%',
        backgroundColor: photoUrl ? 'transparent' : 'rgba(239, 68, 68, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        overflow: 'hidden',
        backgroundImage: photoUrl ? `url('${photoUrl}')` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0,
        ...style,
      }}
      className={className}
    >
      {!photoUrl && initials}
    </div>
  )
}
