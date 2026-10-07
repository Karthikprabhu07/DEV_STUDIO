import React, { useState } from 'react'
import { X, Smartphone, Apple, Check, Download, ExternalLink, ShieldCheck, Copy } from 'lucide-react'
import { Profile } from '@/types'
import { DigitalIdRecord, downloadAppleWalletPass, downloadGoogleWalletPass, buildAppleWalletPassJson } from '@/lib/digitalId'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { QrCodeView } from '@/components/common/QrCodeView'

interface WalletPassModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  digitalId: DigitalIdRecord
  initialPlatform?: 'apple' | 'google'
}

export const WalletPassModal: React.FC<WalletPassModalProps> = ({
  isOpen,
  onClose,
  profile,
  digitalId,
  initialPlatform = 'apple',
}) => {
  const [platform, setPlatform] = useState<'apple' | 'google'>(initialPlatform)
  const [copiedLink, setCopiedLink] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(digitalId.qr_payload_url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleDownloadPass = () => {
    if (platform === 'apple') {
      downloadAppleWalletPass(profile, digitalId)
      setDownloadSuccess('Apple Wallet Pass bundle (.json / .pkpass) downloaded!')
    } else {
      downloadGoogleWalletPass(profile, digitalId)
      setDownloadSuccess('Google Wallet Pass payload downloaded!')
    }
    setTimeout(() => setDownloadSuccess(null), 3000)
  }

  const applePass = buildAppleWalletPassJson(profile, digitalId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-lg border-border-default bg-bg-surface shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface/80 transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-accent-primary">
              Mobile Wallet Provisioning
            </span>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-accent-primary" />
            <span>Official Mobile Wallet Pass</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Platform Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-page/80 border border-border-default">
            <button
              id="wallet-tab-apple"
              onClick={() => setPlatform('apple')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                platform === 'apple'
                  ? 'bg-accent-primary text-text-primary shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>Apple Wallet</span>
            </button>
            <button
              id="wallet-tab-google"
              onClick={() => setPlatform('google')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                platform === 'google'
                  ? 'bg-accent-primary text-text-primary shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Smartphone className="w-4 h-4 text-status-success" />
              <span>Google Wallet</span>
            </button>
          </div>

          {/* Realistic Pass Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-bg-surface to-bg-page border border-border-default shadow-inner space-y-4">
            {/* Pass Header */}
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div>
                <span className="text-[10px] font-mono text-accent-primary tracking-wider block">DEVSTUDIO MITE</span>
                <h3 className="text-sm font-bold text-text-primary tracking-wide">STUDENT CREDENTIAL</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-text-muted block">ID NUMBER</span>
                <code className="text-xs font-mono font-bold text-accent-primary">{digitalId.devstudio_id}</code>
              </div>
            </div>

            {/* Pass Body Info */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <span className="text-[9px] text-text-muted block">MEMBER</span>
                <span className="font-bold text-text-primary text-sm">{profile.full_name}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted block">ROLE</span>
                <span className="font-bold text-accent-primary">
                  {profile.role === 'admin' ? 'Dev Director' : profile.role === 'organizer' ? 'Dev Captain' : 'Dev Mate'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted block">VALID COHORT</span>
                <span className="text-text-primary">2026 - 2027</span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted block">STATUS</span>
                <span className="text-status-success font-bold">ACTIVE MEMBER</span>
              </div>
            </div>

            {/* Pass QR Barcode */}
            <div className="pt-3 border-t border-border-default flex flex-col items-center justify-center">
              <QrCodeView value={digitalId.qr_payload_url} size={110} includeBrandIcon={false} />
              <div className="text-[10px] font-mono text-text-muted mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                <span>Format: PKBarcodeFormatQR • Opaque Token</span>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-status-success/15 border border-status-success/40 text-xs font-mono text-status-success flex items-center gap-2">
              <Check className="w-4 h-4 text-status-success flex-shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            <Button
              id="download-wallet-pass-btn"
              onClick={handleDownloadPass}
              variant="default"
              className="w-full font-mono gap-2 py-2.5"
            >
              <Download className="w-4 h-4" />
              <span>
                {platform === 'apple' ? 'Download Apple Wallet Pass (.pkpass)' : 'Export Google Wallet Payload (.json)'}
              </span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyVerificationUrl}
                className="font-mono text-xs gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied URL!' : 'Copy Verify URL'}</span>
              </Button>

              <a
                href={`/verify/${digitalId.token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default hover:bg-bg-surface/80 text-xs font-mono text-accent-primary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Verify Route</span>
              </a>
            </div>
          </div>

          {/* PassKit Raw Spec Inspector */}
          <div className="pt-2 border-t border-border-default text-[10px] font-mono text-text-muted flex items-center justify-between">
            <span>Pass Type: pass.ac.mite.devstudio</span>
            <span>Serial: {applePass.serialNumber.slice(0, 16)}...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
