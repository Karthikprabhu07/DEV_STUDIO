import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Clock, X, UserX, WifiOff } from 'lucide-react'
import { ScanResult } from '@/lib/attendanceService'

interface ScanFeedbackCardProps {
  result: ScanResult | null
  onDismiss: () => void
}

export const ScanFeedbackCard: React.FC<ScanFeedbackCardProps> = ({ result, onDismiss }) => {
  if (!result) return null

  const isSuccess = result.code === 'PRESENT'
  const isDuplicate = result.code === 'ALREADY_PRESENT'
  const isPending = result.code === 'MEMBER_PENDING'
  const isScanError = result.code === 'SCAN_ERROR' || result.code === 'ERROR'
  const isInvalid = result.code === 'INVALID_QR'
  const isIneligible = result.code === 'MEMBER_NOT_ELIGIBLE'

  const formattedTime = result.recorded_at
    ? new Date(result.recorded_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="w-full animate-in zoom-in-95 duration-200">
      {/* 1. SUCCESS: PRESENT */}
      {isSuccess && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-status-success/60 shadow-[0_0_25px_rgba(34,197,94,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar / Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-status-success/80 bg-bg-page flex items-center justify-center">
                {result.avatar_url ? (
                  <img src={result.avatar_url} alt={result.member_name || 'Member'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black font-mono text-status-success">
                    {result.member_name ? result.member_name.slice(0, 2).toUpperCase() : 'DM'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-status-success text-black flex items-center justify-center shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Member Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase text-status-success tracking-wider">
                  ✓ PRESENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
                  DEV MATE
                </span>
              </div>

              <h4 className="text-base font-bold text-text-primary truncate mt-0.5">
                {result.member_name || 'Verified Member'}
              </h4>

              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-text-muted">
                {result.devstudio_id && (
                  <span className="text-accent-teal font-bold">{result.devstudio_id}</span>
                )}
                <span>•</span>
                <div className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Clock className="w-3 h-3 text-status-success" />
                  <span>{formattedTime}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. DUPLICATE: ALREADY PRESENT */}
      {isDuplicate && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-status-pending/60 shadow-[0_0_25px_rgba(234,179,8,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-status-pending/20 border border-status-pending/40 flex items-center justify-center text-status-pending flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase text-status-pending tracking-wider block">
                ALREADY PRESENT
              </span>
              <p className="text-xs text-text-primary font-medium mt-0.5">
                This member has already been marked present for this session.
              </p>
              {result.member_name && (
                <div className="text-xs font-mono text-text-muted mt-1 flex items-center gap-2">
                  <span className="font-bold text-text-primary">{result.member_name}</span>
                  {result.devstudio_id && <span className="text-accent-teal">({result.devstudio_id})</span>}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 3. PENDING: MEMBER NOT YET APPROVED */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase text-amber-400 tracking-wider block">
                MEMBER NOT YET APPROVED
              </span>
              <p className="text-xs text-text-primary font-medium mt-0.5">
                Member Not Yet Approved — This member's application is pending review. Approve them in the Director Console first.
              </p>
              {result.member_name && (
                <div className="text-xs font-mono text-text-muted mt-1 flex items-center gap-2">
                  <span className="font-bold text-text-primary">{result.member_name}</span>
                  {result.devstudio_id && <span className="text-accent-teal">({result.devstudio_id})</span>}
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    PENDING
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 4. SCAN ERROR: NETWORK OR DB ERROR */}
      {isScanError && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-sky-500/60 shadow-[0_0_25px_rgba(14,165,233,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
              <WifiOff className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase text-sky-400 tracking-wider block">
                COULDN'T VERIFY
              </span>
              <p className="text-xs text-text-primary font-medium mt-0.5">
                Couldn't Verify — Network or database error. Try again.
              </p>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">
                The scanner could not verify this QR code against Supabase. Check your connection or verify manually.
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 5. INVALID: INVALID DEVSTUDIO QR */}
      {isInvalid && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-status-destructive/60 shadow-[0_0_25px_rgba(239,68,68,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-status-destructive/20 border border-status-destructive/40 flex items-center justify-center text-status-destructive flex-shrink-0 mt-0.5">
              <XCircle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase text-status-destructive tracking-wider block">
                INVALID DEVSTUDIO QR
              </span>
              <p className="text-xs text-text-primary font-medium mt-0.5">
                This QR code is not associated with a valid DevStudio member.
              </p>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">
                Ensure member presents official DevStudio Digital ID card.
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 6. INELIGIBLE: MEMBER NOT ELIGIBLE */}
      {isIneligible && (
        <div className="p-4 rounded-2xl bg-bg-surface border-2 border-status-destructive/60 shadow-[0_0_25px_rgba(239,68,68,0.2)] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-status-destructive/20 border border-status-destructive/40 flex items-center justify-center text-status-destructive flex-shrink-0 mt-0.5">
              <UserX className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase text-status-destructive tracking-wider block">
                MEMBER NOT ELIGIBLE
              </span>
              <p className="text-xs text-text-primary font-medium mt-0.5">
                This DevStudio account cannot be marked present.
              </p>
              {result.member_name && (
                <div className="text-xs font-mono text-text-muted mt-1">
                  Member: <strong className="text-text-primary">{result.member_name}</strong> (Inactive/Suspended)
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-page flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
