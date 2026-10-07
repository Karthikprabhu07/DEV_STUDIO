import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4">
      <div className="h-6 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-2.5 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="w-16 h-5 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};
