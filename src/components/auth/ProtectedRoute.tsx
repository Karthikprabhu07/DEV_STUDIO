import React from 'react'
import { ShieldAlert, Clock, LogIn, Terminal, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TechnicalRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: TechnicalRole[]
  requireActive?: boolean
  onOpenAuth?: () => void
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireActive = false,
  onOpenAuth,
}) => {
  const { profile, user, isLoaded } = useAuth()

  // 1. Initial auth resolution loading state (PREVENTS AUTH FLASH)
  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-bg-surface border border-accent-primary/40 flex items-center justify-center text-accent-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Terminal className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-primary" />
          <span>Loading DevStudio...</span>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated state
  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <Card className="p-8 border-border-default bg-bg-surface rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary mx-auto">
            <LogIn className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary">Sign In Required</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Please sign in with your verified <code className="text-accent-primary font-mono">@mite.ac.in</code> institutional account to access this area.
            </p>
          </div>

          <Button
            onClick={onOpenAuth}
            className="w-full font-sans text-sm font-semibold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[46px] rounded-xl shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            Sign In with MITE Email
          </Button>
        </Card>
      </div>
    )
  }

  // 3. Pending / Inactive membership check
  if (requireActive && profile.membership_status !== 'active') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <Card className="p-8 border-status-pending/30 bg-bg-surface rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-status-pending/15 border border-status-pending/40 flex items-center justify-center text-status-pending mx-auto">
            <Clock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary">Profile Pending Activation</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Your DevStudio account (<strong className="text-text-primary font-mono">{profile.email}</strong>) is currently <span className="uppercase text-status-pending font-bold">{profile.membership_status}</span>.
            </p>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Full access is granted once your application is formally approved by a Dev Director.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // 4. Role Authorization Check
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const roleRequirementLabel = allowedRoles.includes('admin') && allowedRoles.length === 1
      ? 'Dev Directors'
      : allowedRoles.includes('organizer')
      ? 'Dev Captains or Dev Directors'
      : 'Authorized Staff'

    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <Card className="p-8 border-status-destructive/30 bg-bg-surface rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-status-destructive/15 border border-status-destructive/40 flex items-center justify-center text-status-destructive mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary">Access Restricted</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              This area is strictly restricted to platform <strong className="text-accent-primary">{roleRequirementLabel}</strong>.
            </p>
            <p className="text-xs text-text-muted mt-2 font-mono">
              Your current role: <span className="uppercase font-bold text-text-primary">{profile.role}</span>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
