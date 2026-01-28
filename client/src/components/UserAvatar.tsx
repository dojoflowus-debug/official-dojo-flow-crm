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
  // Debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[UserAvatar] photoUrl:', photoUrl, 'name:', name)
  }

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

  const containerStyle = {
    ...sizeStyle,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    position: 'relative' as const,
    ...style,
  }

  return (
    <div
      style={containerStyle}
      className={className}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name || 'User avatar'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          onError={(e) => {
            // Fallback to initials if image fails to load
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : null}
      {!photoUrl && <span>{initials}</span>}
    </div>
  )
}
