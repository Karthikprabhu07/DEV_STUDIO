import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  CreditCard,
  ShieldCheck,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  Download,
  AlertCircle,
  Clock,
  QrCode,
  Check,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDigitalId } from '@/contexts/DigitalIdContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoleBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DigitalIdCard3D } from '@/components/id/DigitalIdCard3D'
import { WalletPassModal } from '@/components/id/WalletPassModal'
import { downloadIdCardPng } from '@/lib/generateIdCardPng'

interface IdCardPageProps {
  onOpenAuth: () => void
}

export const IdCardPage: React.FC<IdCardPageProps> = ({ onOpenAuth }) => {
  const { profile } = useAuth()
  const { activeDigitalId, isLoading } = useDigitalId()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  const handleDownloadPng = async () => {
    if (!profile || !activeDigitalId) return
    setIsDownloading(true)
    setErrorMessage(null)

    const res = await downloadIdCardPng(profile, activeDigitalId)
    setIsDownloading(false)

    if (res.success) {
      if (res.shared) {
        setToastMessage('DevStudio Digital ID shared via mobile share sheet.')
      } else {
        setToastMessage(`DEVSTUDIO-ID-${activeDigitalId.devstudio_id}.png downloaded successfully.`)
      }
      setTimeout(() => setToastMessage(null), 4000)
    } else {
      setErrorMessage(res.error || 'Failed to render PNG.')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 md:pb-8">
      <Helmet>
        <title>Digital ID | DevStudio</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/30 tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Credential
            </span>
          </div>
          <h1 className="text-2xl font-black font-sans text-text-primary">Digital Identity Credential</h1>
          <p className="text-xs sm:text-sm font-sans font-medium text-text-muted mt-2">
            Official cryptographic student membership credential with dynamic 3D card and instant public verification.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs font-mono text-status-success flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-status-destructive/10 border border-status-destructive/30 text-xs font-mono text-status-destructive flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-status-destructive flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Auth State Handling */}
      {!profile ? (
        <Card className="border-border-default bg-[#0A0F1D] p-12 text-center rounded-3xl shadow-xl">
          <CreditCard className="w-16 h-16 text-accent-teal mx-auto mb-6 opacity-80" />
          <h3 className="text-xl font-black font-sans text-text-primary mb-3">Sign In to View Your Digital ID</h3>
          <p className="text-sm font-sans font-medium text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
            Sign in with your verified <code className="text-accent-teal font-mono bg-accent-teal/10 px-1.5 py-0.5 rounded">@mite.ac.in</code> account to access your official DevStudio ID.
          </p>
          <Button onClick={onOpenAuth} className="font-sans font-bold bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[48px] rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] px-8 border border-transparent hover:border-white cursor-pointer transition-all">
            Sign In with MITE Email
          </Button>
        </Card>
      ) : profile.membership_status === 'pending' ? (
        <div className="space-y-6">
          <Card className="border-status-pending/30 bg-status-pending/5 p-8 rounded-3xl shadow-xl">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-status-pending/10 rounded-xl mt-1">
                <Clock className="w-8 h-8 text-status-pending flex-shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-black font-sans text-status-pending">Digital ID Issuance Pending Review</h3>
                  <RoleBadge role={profile.role} />
                </div>
                <p className="text-sm font-sans font-medium text-text-muted leading-relaxed">
                  Your registration for <strong className="text-text-primary font-mono">{profile.email}</strong> is recorded with status <strong className="text-status-pending uppercase tracking-wider font-mono text-xs">Pending Review</strong>.
                </p>
                <p className="text-sm font-sans font-medium text-text-muted mt-4 leading-relaxed">
                  Once your application is reviewed and approved by a Dev Director, an atomic sequential ID (<code className="text-accent-teal font-mono bg-accent-teal/10 px-1.5 py-0.5 rounded">DS26-XXXX</code>) and an opaque QR verification token will be provisioned automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : isLoading || !activeDigitalId ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-text-muted">Provisioning Cryptographic Digital ID...</p>
        </div>
      ) : (
        /* Active Member View with 3D Flip Card and Diagnostics */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3D Holographic Flip ID Card */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <DigitalIdCard3D profile={profile} digitalId={activeDigitalId} />

            {/* Quick Action Bar under Card */}
            <div className="flex flex-col gap-3 mt-8 w-full max-w-[420px]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* PRIMARY ACTION: Download ID (PNG) with accent primary */}
                <Button
                  id="download-id-png-btn"
                  onClick={handleDownloadPng}
                  disabled={isDownloading}
                  className="flex-1 font-bold font-sans text-xs gap-2 py-2.5 transition-all min-h-[46px] bg-accent-teal hover:bg-accent-teal/90 text-on-accent rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] border border-transparent hover:border-white cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{isDownloading ? 'Rendering Card PNG...' : 'Download ID (PNG)'}</span>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    id="flip-card-btn"
                    onClick={() => {
                      const card = document.getElementById('digital-id-card-container')
                      if (card) card.click()
                    }}
                    className="font-sans font-bold text-xs gap-2 min-h-[46px] px-5 bg-bg-surface hover:bg-bg-page text-text-primary rounded-xl shadow-sm border border-border-default transition-all cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Flip ↺</span>
                  </Button>

                  <a
                    id="verify-token-link-btn"
                    href={`/verify/${activeDigitalId.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-bg-surface hover:bg-bg-page text-text-primary font-sans font-bold text-xs transition-all min-h-[46px] border border-border-default shadow-sm cursor-pointer"
                    title="Open Public Verification Route"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Verify</span>
                  </a>
                </div>
              </div>

              {/* Mobile Wallet Pass Trigger */}
              <Button
                id="open-wallet-pass-modal-btn"
                onClick={() => setIsWalletModalOpen(true)}
                className="w-full font-sans font-bold text-xs gap-2 min-h-[46px] bg-bg-surface hover:bg-bg-page text-text-primary rounded-xl shadow-sm border border-border-default transition-all cursor-pointer mt-1"
              >
                <Smartphone className="w-4 h-4" />
                <span>Apple Wallet & Google Wallet Passes</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Cryptographic Architecture & Diagnostics */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="pb-4 bg-bg-surface/50 border-b border-border-default pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-status-success/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-status-success" />
                  </div>
                  <CardTitle className="text-lg font-black font-sans text-text-primary">
                    Cryptographic Credential Specs
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 font-mono text-sm pt-6">
                <div className="flex items-center justify-between py-3 border-b border-border-default/50">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-xs">DevStudio ID</span>
                  <span className="font-plex font-bold text-accent-teal text-base">
                    {activeDigitalId.devstudio_id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border-default/50">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-xs">Membership Status</span>
                  <span className="text-status-success font-bold uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Check className="w-4 h-4" />
                    <span>{activeDigitalId.status}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border-default/50">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-xs">Issuance Date</span>
                  <span className="text-text-primary font-medium">
                    {new Date(activeDigitalId.issued_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border-default/50">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-xs">Expiration Date</span>
                  <span className="text-text-primary font-medium">
                    {new Date(activeDigitalId.expires_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="py-3 border-b border-border-default/50">
                  <div className="text-text-muted mb-2 flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-xs">Public Verification Endpoint</span>
                    <span className="text-[10px] text-accent-purple font-bold tracking-wider uppercase border border-accent-purple/30 px-2 py-0.5 rounded bg-accent-purple/10">SHA-256 Mapped</span>
                  </div>
                  <div className="text-xs font-plex text-accent-teal break-all bg-bg-surface p-3.5 rounded-xl border border-border-default select-all shadow-inner">
                    {activeDigitalId.qr_payload_url}
                  </div>
                </div>

                <div className="py-3">
                  <div className="text-text-muted mb-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <span>SHA-256 Hash Digest</span>
                    <span className="text-[10px] bg-bg-surface px-2 py-0.5 rounded border border-border-default">Zero PII</span>
                  </div>
                  <div className="text-xs font-plex text-text-muted break-all bg-bg-surface p-3.5 rounded-xl border border-border-default shadow-inner">
                    {activeDigitalId.token_hash}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-bg-page border border-border-default space-y-2 shadow-sm">
                <div className="text-sm font-black font-sans text-text-primary flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-accent-teal" />
                  <span>Offline Verification</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-sans font-medium">
                  Vector QR contains an opaque cryptographic token. Works without internet at venue entrances.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-bg-page border border-border-default space-y-2 shadow-sm">
                <div className="text-sm font-black font-sans text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-status-success" />
                  <span>Atomic Sequence</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-sans font-medium">
                  Guaranteed collision-free via Postgres sequence. Permanent identifier through graduation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && activeDigitalId && (
        <WalletPassModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          profile={profile}
          digitalId={activeDigitalId}
        />
      )}
    </div>
  )
}
