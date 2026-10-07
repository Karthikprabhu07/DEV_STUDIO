import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-border-default bg-bg-surface/40 my-4">
      <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center mb-4 text-accent-primary shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm" variant="default">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} size="sm" variant="outline">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
