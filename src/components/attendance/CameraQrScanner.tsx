import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  QrCode,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void
  isProcessing?: boolean
  disabled?: boolean
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  isProcessing = false,
  disabled = false,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [manualToken, setManualToken] = useState('')
  const [isManualInputOpen, setIsManualInputOpen] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const lastScannedTextRef = useRef<string>('')
  const lastScanTimestampRef = useRef<number>(0)
  const containerId = 'devstudio-qr-reader'

  // Callback wrapper to handle scanned results with cooldown
  const handleDecoded = useCallback(
    (decodedText: string) => {
      const now = Date.now()
      // 1.8s debounce cooldown for identical scans, 800ms for different
      const isSameToken = decodedText === lastScannedTextRef.current
      const cooldown = isSameToken ? 2000 : 800

      if (now - lastScanTimestampRef.current < cooldown || isProcessing || disabled) {
        return
      }

      lastScanTimestampRef.current = now
      lastScannedTextRef.current = decodedText

      // Trigger success callback
      onScanSuccess(decodedText)
    },
    [onScanSuccess, isProcessing, disabled]
  )

  // Start Camera with Html5Qrcode
  const startScanning = useCallback(
    async (cameraId?: string) => {
      setCameraError(null)
      setIsPermissionDenied(false)

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(containerId)
        }

        // Check available video devices
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Default to back/environment camera if available
          const targetId =
            cameraId ||
            devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))?.id ||
            devices[0].id
          setSelectedCameraId(targetId)

          if (isScanningRef.current) {
            await scannerRef.current.stop()
            isScanningRef.current = false
          }

          const qrBoxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            return {
              width: Math.floor(minEdge * 0.75),
              height: Math.floor(minEdge * 0.75),
            }
          }

          await scannerRef.current.start(
            targetId,
            {
              fps: 15,
              qrbox: qrBoxSize,
              aspectRatio: 1.0,
            },
            (decodedText) => {
              handleDecoded(decodedText)
            },
            () => {
              // Ignore standard frame miss errors
            }
          )

          isScanningRef.current = true
          setIsCameraActive(true)
        } else {
          setCameraError('No video cameras found on this device.')
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err)
        const errMsg = err?.message || String(err)
        if (
          errMsg.toLowerCase().includes('permission') ||
          errMsg.toLowerCase().includes('notallowed') ||
          errMsg.toLowerCase().includes('denied')
        ) {
          setIsPermissionDenied(true)
          setCameraError(
            'Camera permission was denied. Please allow camera access in your browser settings to scan DevStudio ID cards.'
          )
        } else {
          setCameraError('Unable to start camera feed. Please check device permissions.')
        }
        setIsCameraActive(false)
        isScanningRef.current = false
      }
    },
    [handleDecoded]
  )



  // Mount effect: start camera with delay to ensure DOM container is ready
  useEffect(() => {
    // Small delay ensures the #devstudio-qr-reader div is rendered in the DOM
    const timer = setTimeout(() => {
      const containerEl = document.getElementById(containerId)
      if (containerEl) {
        startScanning()
      } else {
        console.warn('QR scanner container not found in DOM, retrying...')
        // Retry after another short delay
        const retryTimer = setTimeout(() => startScanning(), 500)
        return () => clearTimeout(retryTimer)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      // Stop scanning and clear the container to prevent stale video elements
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isScanningRef.current = false
            setIsCameraActive(false)
            // Clear any leftover video/canvas elements from the container
            const el = document.getElementById(containerId)
            if (el) el.innerHTML = ''
          })
          .catch(() => {
            isScanningRef.current = false
            setIsCameraActive(false)
          })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch camera handler
  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId)
    startScanning(newCameraId)
  }

  // Handle manual token submission fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    onScanSuccess(manualToken.trim())
    setManualToken('')
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Viewport Box */}
      <div className="w-full max-w-lg relative rounded-2xl overflow-hidden bg-bg-surface border-2 border-border-default shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        {/* Technical drafting marks at corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent-primary z-20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent-primary z-20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent-primary z-20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent-primary z-20 pointer-events-none" />

        {/* Viewfinder Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 px-4 py-2.5 bg-bg-page/85 backdrop-blur-md border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isCameraActive ? 'bg-status-success' : 'bg-status-destructive'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isCameraActive ? 'bg-status-success' : 'bg-status-destructive'
                }`}
              />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-text-primary uppercase">
              {isCameraActive ? 'LIVE ID SCANNER' : 'SCANNER OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
            <span className="text-[10px] font-mono text-text-muted">256-BIT CRYPTO</span>
          </div>
        </div>

        {/* Camera HTML5 Video Target */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Animated Viewfinder Overlay when Camera is Active */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Central Target Square */}
              <div className="relative w-[70%] h-[70%] border-2 border-accent-primary/60 rounded-xl shadow-[0_0_25px_rgba(59,107,251,0.25)] flex items-center justify-center">
                {/* Laser Scanning Line */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent shadow-[0_0_12px_var(--accent-teal)] animate-laser-scan pointer-events-none" />

                {/* Sub-reticle center dot */}
                <div className="w-2 h-2 rounded-full bg-accent-primary/60" />
              </div>

              {/* Status cue below target */}
              <div className="mt-4 px-3 py-1 rounded-full bg-bg-page/80 backdrop-blur-md border border-border-default text-[11px] font-mono text-text-muted flex items-center gap-1.5 shadow">
                <Sparkles className="w-3 h-3 text-accent-primary" />
                <span>Align DevStudio Digital ID QR within box</span>
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 animate-in fade-in">
              <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
              <span className="text-xs font-mono font-bold text-text-primary tracking-wider uppercase">
                Verifying Member QR...
              </span>
            </div>
          )}

          {/* Camera Error / Permission Denied UI */}
          {cameraError && !isCameraActive && (
            <div className="absolute inset-0 p-6 bg-bg-surface flex flex-col items-center justify-center text-center z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-status-destructive/15 border border-status-destructive/40 flex items-center justify-center text-status-destructive">
                {isPermissionDenied ? <CameraOff className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>

              <div>
                <h4 className="text-sm font-bold text-text-primary">
                  {isPermissionDenied ? 'Camera Access Blocked' : 'Camera Unavailable'}
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xs">{cameraError}</p>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button
                  onClick={() => startScanning()}
                  variant="default"
                  className="font-mono text-xs bg-accent-primary hover:bg-accent-primary/90 text-text-primary"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Camera Again
                </Button>
                <Button
                  onClick={() => setIsManualInputOpen(true)}
                  variant="outline"
                  className="font-mono text-xs border-border-default text-text-muted"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5 text-accent-teal" />
                  Manual ID / Token Input
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Viewfinder Controls Footer */}
        <div className="p-3 bg-bg-surface border-t border-border-default flex items-center justify-between gap-2">
          {/* Camera Selection Dropdown */}
          {cameras.length > 1 ? (
            <div className="flex items-center gap-2 flex-1">
              <Camera className="w-4 h-4 text-text-muted flex-shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="w-full h-8 rounded-lg bg-bg-page border border-border-default px-2 text-[11px] font-mono text-text-primary focus:ring-1 focus:ring-accent-primary"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
              <Camera className="w-3.5 h-3.5 text-accent-primary" />
              <span>Camera active (High Precision)</span>
            </div>
          )}

          {/* Toggle Manual Input */}
          <Button
            onClick={() => setIsManualInputOpen(!isManualInputOpen)}
            variant="ghost"
            size="sm"
            className="text-[11px] font-mono text-accent-teal hover:text-accent-teal/80 flex items-center gap-1 h-8"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Manual Input</span>
          </Button>
        </div>
      </div>

      {/* Manual Input Fallback Drawer */}
      {isManualInputOpen && (
        <form
          onSubmit={handleManualSubmit}
          className="w-full max-w-lg mt-3 p-3.5 rounded-xl bg-bg-surface border border-border-default flex items-center gap-2 animate-in fade-in"
        >
          <input
            type="text"
            placeholder="Paste raw QR token, verify URL, or DS26-XXXX..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 h-9 rounded-lg bg-bg-page border border-border-default px-3 text-xs font-mono text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
          <Button
            type="submit"
            disabled={!manualToken.trim() || isProcessing}
            size="sm"
            className="font-mono text-xs bg-accent-primary text-text-primary font-bold h-9 px-3"
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  )
}
