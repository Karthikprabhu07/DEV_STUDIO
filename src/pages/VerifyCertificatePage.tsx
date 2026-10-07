import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  CheckCircle2,
  Terminal,
  Hash,
  Share2,
  Printer,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCertificates } from '@/contexts/CertificatesContext'
import { ClubCertificate } from '@/types'

export const VerifyCertificatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { verifyCertificateByToken } = useCertificates()

  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [status, setStatus] = useState<'valid' | 'revoked' | 'invalid'>('invalid')
  const [certificate, setCertificate] = useState<ClubCertificate | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setIsLoading(false)
        setStatus('invalid')
        return
      }

      setIsLoading(true)
      // Slight artificial delay to prevent enumeration/timing attacks
      await new Promise((r) => setTimeout(r, 450))

      const result = await verifyCertificateByToken(token)
      setIsVerified(result.verified)
      setStatus(result.status || 'invalid')
      setCertificate(result.certificate || null)
      setIsLoading(false)
    }

    runVerification()
  }, [token])

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const getCategoryColor = (type?: string) => {
    switch (type) {
      case 'winner':
      case 'merit':
        return 'text-accent-amber bg-accent-amber/10 border-accent-amber/30'
      case 'completion':
        return 'text-accent-primary bg-accent-primary/10 border-accent-primary/30'
      default:
        return 'text-accent-amber bg-accent-amber/10 border-accent-amber/30'
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <Helmet>
        <title>Verify Certificate | DevStudio</title>
        <meta name="description" content="Verify a DevStudio Certificate." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/verify-certificate" />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Brand Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
        <Link to="/" className="hover:text-accent-primary transition-colors flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-accent-primary" />
          <span>DEVSTUDIO</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-text-primary">Public Credential Verification</span>
      </div>

      {isLoading ? (
        <Card className="p-16 text-center border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl border-2 border-accent-teal border-t-transparent animate-spin mx-auto mb-6 shadow-sm" />
          <h3 className="font-sans text-lg font-black text-text-primary mb-2">
            Verifying Cryptographic Certificate...
          </h3>
          <p className="text-xs font-mono font-medium text-text-muted">
            Computing SHA-256 digest against institutional registry
          </p>
        </Card>
      ) : isVerified && certificate ? (
        <div className="space-y-6">
          {/* Status Header */}
          <div className="rounded-3xl border border-status-success/30 bg-status-success/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-status-success/10 border border-status-success/30 flex items-center justify-center text-status-success flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 text-status-success text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authentic Certificate Verified</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-sans font-black text-text-primary">
                  Official MITE DevStudio Credential
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="text-xs font-sans font-bold gap-2 min-h-[44px] px-5 rounded-xl border-border-default bg-bg-surface hover:bg-bg-page text-text-primary transition-all shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied Link' : 'Share'}</span>
              </Button>
              <Button
                onClick={handlePrint}
                className="text-xs font-sans font-bold gap-2 min-h-[44px] px-5 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF</span>
              </Button>
            </div>
          </div>

          {/* Certificate Presentation Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border-default bg-[#0A0F1D] p-10 sm:p-14 shadow-2xl space-y-10 group">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-accent-teal/5 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-teal/10 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-purple/10 transition-colors duration-1000" />

            {/* Certificate Header */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-border-default/50 pb-8 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center text-accent-teal shadow-sm">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-sans font-black text-lg tracking-wider text-text-primary uppercase">
                    DEVSTUDIO
                  </h2>
                  <p className="text-[11px] font-sans font-medium text-text-muted mt-0.5">
                    Mangalore Institute of Technology & Engineering
                  </p>
                </div>
              </div>

              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border shadow-sm ${getCategoryColor(
                  certificate.certificate_type
                )}`}
              >
                {certificate.certificate_type.replace('_', ' ')} Award
              </span>
            </div>

            {/* Certificate Core Statement */}
            <div className="relative z-10 text-center space-y-6 py-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                This is to certify that
              </span>

              <div className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight font-sans">
                {certificate.profile?.full_name || 'MITE Developer'}
              </div>

              {certificate.profile?.devstudio_id && (
                <div className="inline-flex px-4 py-1.5 rounded-lg bg-bg-page border border-border-default text-[11px] font-bold font-mono text-accent-teal tracking-wider shadow-inner">
                  DevStudio ID: {certificate.profile.devstudio_id}
                </div>
              )}

              <p className="text-sm font-sans font-medium text-text-muted max-w-xl mx-auto leading-relaxed pt-2">
                has successfully distinguished themselves and met the engineering standards for:
              </p>

              <div className="p-6 rounded-2xl bg-bg-page border border-border-default max-w-xl mx-auto shadow-sm">
                <h3 className="text-xl font-sans font-black text-text-primary">
                  {certificate.title}
                </h3>
                <p className="text-xs font-sans font-medium text-text-muted mt-3 leading-relaxed">
                  {certificate.description}
                </p>
              </div>
            </div>

            {/* Certificate Footer Signatures & Metadata */}
            <div className="relative z-10 pt-8 border-t border-border-default/50 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono text-text-muted">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Issue Date</span>
                <div className="text-text-primary flex items-center justify-center sm:justify-start gap-2 text-sm font-bold">
                  <Calendar className="w-4 h-4 text-accent-teal" />
                  <span>{new Date(certificate.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-center sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Authority</span>
                <div className="text-text-primary flex items-center justify-center sm:justify-end gap-2 text-sm font-bold">
                  <Award className="w-4 h-4 text-accent-amber" />
                  <span>DevStudio Technical Director</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof Block */}
            <div className="relative z-10 p-5 rounded-2xl bg-bg-page border border-border-default text-xs font-mono space-y-2 shadow-inner mt-4">
              <div className="flex items-center justify-between text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <span className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-accent-teal" />
                  <span>SHA-256 Public Credential Digest:</span>
                </span>
                <span className="text-status-success bg-status-success/10 border border-status-success/20 px-2 py-0.5 rounded">Registry Verified</span>
              </div>
              <div className="text-[11px] text-text-muted break-all select-all font-mono font-medium">
                {certificate.token_hash}
              </div>
            </div>
          </div>
        </div>
      ) : status === 'revoked' ? (
        <Card className="p-12 border border-status-destructive/20 bg-[#0A0F1D] rounded-3xl shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-status-destructive/10 border border-status-destructive/20 flex items-center justify-center text-status-destructive mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-sans font-black text-status-destructive">
            Certificate Has Been Revoked
          </h2>
          <p className="text-sm font-sans font-medium text-status-destructive/80 max-w-md mx-auto leading-relaxed">
            This certificate was marked as revoked by DevStudio management.
            {certificate?.revocation_reason && ` Reason: ${certificate.revocation_reason}`}
          </p>
        </Card>
      ) : (
        <Card className="p-12 border border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-bg-page border border-border-default flex items-center justify-center text-text-muted mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-sans font-black text-text-primary">
            Invalid or Unrecognized Certificate Token
          </h2>
          <p className="text-sm font-sans font-medium text-text-muted max-w-md mx-auto leading-relaxed">
            The cryptographic verification token provided does not match any official credential record in the MITE DevStudio registry.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-page text-text-primary transition-colors cursor-pointer shadow-sm">
                Return to DevStudio Home
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
