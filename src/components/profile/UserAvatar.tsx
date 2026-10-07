import React, { useState } from 'react'
import { Profile } from '@/types'

interface UserAvatarProps {
  profile: Pick<Profile, 'full_name' | 'avatar_type' | 'avatar_url' | 'pending_photo_url'>
  className?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ profile, className = '' }) => {
  const [imgError, setImgError] = useState(false)
  const initials = (profile.full_name || 'Member')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const url = profile.avatar_type === 'photo' ? (profile.pending_photo_url || profile.avatar_url) : null

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={profile.full_name || 'Avatar'}
        className={`object-cover bg-bg-surface ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={`flex items-center justify-center bg-bg-surface ${className}`}>
      {initials}
    </div>
  )
}
