import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "director"
    | "captain"
    | "mate"
    | "status"
    | "outline"
    | "success"
    | "warning"
    | "pending"
    | "danger"
    | "destructive"
    | "certificate"
    | "project"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-bg-surface text-text-primary border-border-default",
    director: "bg-accent-purple/15 border-accent-purple/40 text-accent-purple font-mono tracking-wide",
    captain: "bg-accent-primary/15 border-accent-primary/40 text-accent-primary font-mono tracking-wide",
    mate: "bg-accent-teal/15 border-accent-teal/40 text-accent-teal font-mono tracking-wide",
    status: "bg-status-success/15 border-status-success/40 text-status-success",
    success: "bg-status-success/15 border-status-success/40 text-status-success",
    warning: "bg-status-pending/15 border-status-pending/40 text-status-pending",
    pending: "bg-status-pending/15 border-status-pending/40 text-status-pending",
    danger: "bg-status-destructive/15 border-status-destructive/40 text-status-destructive",
    destructive: "bg-status-destructive/15 border-status-destructive/40 text-status-destructive",
    certificate: "bg-accent-amber/15 border-accent-amber/40 text-accent-amber",
    project: "bg-accent-purple/15 border-accent-purple/40 text-accent-purple",
    outline: "text-text-primary border-border-default",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export function RoleBadge({ role, className }: { role: 'admin' | 'organizer' | 'member' | string; className?: string }) {
  if (role === 'admin') {
    return <Badge variant="director" className={className}>Dev Director</Badge>
  }
  if (role === 'organizer') {
    return <Badge variant="captain" className={className}>Dev Captain</Badge>
  }
  return <Badge variant="mate" className={className}>Dev Mate</Badge>
}

export { Badge }
