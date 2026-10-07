import React from 'react'
import { AlertCircle, CheckCircle2, UserX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EndAttendanceModalProps {
  isOpen: boolean
  sessionTitle: string
  presentCount: number
  notScannedCount: number
  totalEligible: number
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const EndAttendanceModal: React.FC<EndAttendanceModalProps> = ({
  isOpen,
  sessionTitle,
  presentCount,
  notScannedCount,
  totalEligible,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border-default bg-bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-status-pending">
            <AlertCircle className="w-5 h-5 text-status-pending" />
            <h3 className="text-lg font-black font-mono tracking-tight text-text-primary">
              END ATTENDANCE?
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs text-text-muted leading-relaxed">
          You are concluding the active attendance session for{' '}
          <strong className="text-text-primary font-bold">{sessionTitle}</strong>.
          <p className="mt-2 text-status-pending font-medium">
            "Members who have not been scanned will be marked absent."
          </p>
        </div>

        {/* Breakdown Box */}
        <div className="p-4 rounded-xl bg-bg-page border border-border-default space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Total Cohort:</span>
            <span className="font-bold text-text-primary">{totalEligible}</span>
          </div>
          <div className="flex items-center justify-between text-status-success">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Present (Scanned):</span>
            </span>
            <span className="font-bold text-base">{presentCount}</span>
          </div>
          <div className="flex items-center justify-between text-status-destructive">
            <span className="flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5" />
              <span>Not Scanned (Will Be Absent):</span>
            </span>
            <span className="font-bold text-base">{notScannedCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={onCancel}
            disabled={isSubmitting}
            variant="outline"
            className="w-full sm:w-1/2 font-mono text-xs border-border-default text-text-muted hover:text-text-primary min-h-[44px]"
          >
            CANCEL
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-1/2 font-mono text-xs font-bold bg-accent-primary hover:bg-accent-primary/90 text-text-primary min-h-[44px] shadow-lg shadow-accent-primary/25"
          >
            {isSubmitting ? 'FINALIZING...' : 'END & FINALIZE'}
          </Button>
        </div>
      </div>
    </div>
  )
}
