import React from 'react';

interface DevStudioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const DevStudioLogo: React.FC<DevStudioLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* DevStudio Icon Mark */}
      <div
        className={`${iconSizeClasses[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-400/30`}
      >
        {/* Geometric brackets & pulse icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/6 h-5/6 p-0.5 text-white"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="10" y1="17" x2="14" y2="7" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-neutral-900"></span>
        </span>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 ${titleSizeClasses[size]}`}>
            Dev<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>Vibe Coding</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="text-indigo-600/90 dark:text-indigo-400/90">MITE</span>
          </div>
        )}
      </div>
    </div>
  );
};
