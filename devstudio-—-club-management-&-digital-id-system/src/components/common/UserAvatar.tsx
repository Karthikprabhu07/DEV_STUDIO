import React from 'react';
import { UserRole } from '../../types';
import { Shield, Sparkles, Terminal } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role = 'DEV_MATE',
  size = 'md',
  showBadge = false,
  className = '',
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl font-bold',
    '2xl': 'w-24 h-24 text-2xl font-black',
  };

  const roleGradients = {
    ADMIN: 'from-amber-500 via-rose-500 to-indigo-600 border-amber-300/40 text-white',
    CAPTAIN: 'from-blue-600 via-indigo-600 to-cyan-500 border-cyan-400/40 text-white',
    DEV_MATE: 'from-emerald-600 via-teal-600 to-cyan-700 border-emerald-400/40 text-white',
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${roleGradients[role]} flex items-center justify-center font-bold shadow-sm border select-none tracking-tight`}
      >
        <span>{getInitials(name)}</span>
      </div>

      {showBadge && (
        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-white shadow-sm">
          {role === 'ADMIN' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
          {role === 'CAPTAIN' && <Shield className="w-2.5 h-2.5 text-cyan-400" />}
          {role === 'DEV_MATE' && <Terminal className="w-2.5 h-2.5 text-emerald-400" />}
        </span>
      )}
    </div>
  );
};
