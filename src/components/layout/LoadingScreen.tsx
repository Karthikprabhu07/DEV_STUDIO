import React, { useState, useEffect } from 'react'
import { Terminal, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const LoadingScreen: React.FC<{ hasError?: boolean; errorMsg?: string }> = ({ hasError, errorMsg }) => {
  const [statusIndex, setStatusIndex] = useState(0)
  const [showRetry, setShowRetry] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const statusMessages = [
    '> initializing workspace...',
    '> checking session...',
    '> loading your dashboard...',
    '> optimizing build...',
  ]

  // Anti-flicker: Only show after 150ms
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150)
    return () => clearTimeout(timer)
  }, [])

  // Cycle messages
  useEffect(() => {
    if (hasError || showRetry) return
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [hasError, showRetry, statusMessages.length])

  // 10-second timeout
  useEffect(() => {
    if (hasError) return
    const timer = setTimeout(() => setShowRetry(true), 10000)
    return () => clearTimeout(timer)
  }, [hasError])

  if (!isVisible && !hasError) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-bg-page flex flex-col items-center justify-center font-sans animate-in fade-in duration-300">
      <div className="relative w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br from-accent-primary/20 to-accent-teal/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
        <div className="absolute inset-[-20px] bg-accent-primary/20 blur-[20px] rounded-full -z-10 animate-pulse motion-reduce:hidden" />
        <Terminal className="w-8 h-8" />
      </div>
      
      <div className="flex items-center gap-2 text-white font-bold text-2xl tracking-tight">
        DEVSTUDIO
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
          MITE
        </span>
      </div>
      <div className="text-[13px] text-text-muted mt-1 font-medium tracking-wide">
        Build. Ship. Learn.
      </div>

      {!hasError && !showRetry ? (
        <>
          <div className="w-[200px] h-[2px] bg-border-default mt-8 overflow-hidden rounded-sm relative">
            <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-accent-primary rounded-sm animate-[ds-indeterminate_1.5s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:w-full" />
          </div>
          <div className="mt-4 text-xs font-mono text-accent-teal flex items-center gap-1" role="status" aria-live="polite">
            <span className="sr-only">Loading DevStudio</span>
            <span aria-hidden="true">{statusMessages[statusIndex]}</span>
            <span className="w-1.5 h-3 bg-accent-teal animate-pulse" aria-hidden="true"></span>
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-status-destructive font-mono text-xs p-3 rounded-lg bg-status-destructive/10 border border-status-destructive/20" role="alert">
            <AlertCircle className="w-4 h-4" />
            <span>{hasError ? errorMsg || 'Authentication service error.' : '> Taking longer than usual...'}</span>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all"
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  )
}
