import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { ShieldAlert, CheckCircle2, ArrowLeft, Lock, ShieldCheck, AlertTriangle, GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { RoleBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDigitalId } from '@/contexts/DigitalIdContext'
import { useAuth } from '@/contexts/AuthContext'
import { DigitalIdRecord } from '@/lib/digitalId'

export const VerifyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { getDigitalIdByToken, isLoading: isDigitalIdLoading } = useDigitalId()
  const { members } = useAuth()

  const [loading, setLoading] = useState(true)
  const [digitalId, setDigitalId] = useState<DigitalIdRecord | null>(null)
  const [memberName, setMemberName] = useState<string>('Verified Member')
  const [memberRole, setMemberRole] = useState<'admin' | 'organizer' | 'member'>('member')
  const [memberStatus, setMemberStatus] = useState<string>('active')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const verify = async () => {
      if (!token) {
        if (isMounted) {
          setError('No verification token provided.')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const record = await getDigitalIdByToken(token)

        if (!isMounted) return

        if (!record) {
          setError('Cryptographic Verification Failed: Token is non-existent, invalid, or expired.')
          setDigitalId(null)
        } else if (record.status === 'revoked') {
          setError(`Credential Revoked: This Digital ID was formally revoked by Dev Director (${record.revocation_reason || 'Administrative action'}).`)
          setDigitalId(record)
        } else if (record.status === 'expired') {
          setError('Credential Expired: This cohort pass is no longer active.')
          setDigitalId(record)
        } else {
          // Token is verified and active!
          setDigitalId(record)

          // Find member to get public display name & role
          const member = members.find(m => m.id === record.user_id)
          if (member) {
            setMemberName(member.full_name)
            setMemberRole(member.role)
            setMemberStatus(member.membership_status || 'active')
          } else {
            setMemberName('DevStudio Member')
            setMemberRole('member')
            setMemberStatus(record.status || 'active')
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Internal verification error: Unable to compute cryptographic token hash.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!isDigitalIdLoading) {
      verify()
    }

    return () => {
      isMounted = false
    }
  }, [token, isDigitalIdLoading, members])

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Verify Digital ID | DevStudio</title>
        <meta name="description" content="Verify a DevStudio member's Digital ID." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/verify" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="w-full max-w-md">
        
        {/* Verification Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A0F1D] border border-border-default text-xs font-mono font-bold uppercase tracking-wider text-accent-teal mb-4 shadow-sm">
            <Lock className="w-4 h-4 text-accent-teal" />
            <span>DevStudio Credential Verification</span>
          </div>
          <h1 className="text-2xl font-black font-sans tracking-tight text-text-primary">Digital ID Authenticity Check</h1>
          <p className="text-xs text-text-muted mt-2 font-mono font-medium">
            Mangalore Institute of Technology & Engineering (MITE)
          </p>
        </div>

        <Card className="border-border-default bg-[#0A0F1D] shadow-2xl relative overflow-hidden rounded-3xl">
          <CardContent className="pt-8 sm:p-10">
            {loading ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-2 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto shadow-sm" />
                <p className="text-sm font-sans font-medium text-text-muted">Verifying SHA-256 token digest with registry...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-status-destructive/10 border border-status-destructive/30 text-status-destructive flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black font-sans text-status-destructive">Verification Rejected</h3>
                  <p className="text-sm text-text-muted max-w-sm mx-auto mt-3 leading-relaxed font-sans font-medium">
                    {error}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-xs font-mono font-medium text-text-muted text-left shadow-sm mt-4">
                  <div className="flex items-center gap-2 text-status-pending mb-2 font-bold uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Venue Security Notice</span>
                  </div>
                  Do not grant access. Report unverified credentials to the Dev Director at devstudio@mite.ac.in.
                </div>
              </div>
            ) : digitalId ? (
              <div className="space-y-8">
                {/* Verified Header Banner */}
                {memberStatus === 'alumni' ? (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-status-pending/10 border border-status-pending/30 shadow-[0_0_25px_rgba(234,179,8,0.1)]">
                    <GraduationCap className="w-8 h-8 text-status-pending flex-shrink-0" />
                    <div>
                      <span className="text-sm font-black text-status-pending uppercase tracking-wider block font-sans">
                        🎓 DevStudio Alumni Verified
                      </span>
                      <span className="text-xs text-status-pending/90 font-mono font-medium mt-1 block">
                        Graduated Scholar & Former Club Leader • MITE
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-status-success/10 border border-status-success/30 shadow-[0_0_25px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="w-8 h-8 text-status-success flex-shrink-0" />
                    <div>
                      <span className="text-sm font-black text-status-success uppercase tracking-wider block font-sans">
                        Authentic Credential Verified
                      </span>
                      <span className="text-xs text-status-success/90 font-mono font-medium mt-1 block">
                        Issued by DevStudio MITE
                      </span>
                    </div>
                  </div>
                )}

                {/* Public Member Data (Zero PII - No email, phone, or private USN) */}
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Cardholder Name</span>
                    <span className="font-sans font-black text-text-primary text-base sm:text-right">{memberName}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">DevStudio ID</span>
                    <span className="font-black text-accent-teal sm:text-right tracking-wider">{digitalId.devstudio_id}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Institutional Role</span>
                    <div className="sm:text-right">
                      <RoleBadge role={memberRole} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Membership Status</span>
                    <div className="sm:text-right">
                      {memberStatus === 'alumni' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-status-pending/10 text-status-pending border border-status-pending/30 inline-flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>DevStudio Alumni</span>
                        </span>
                      ) : (
                        <span className="text-status-success font-black uppercase tracking-wider font-mono">{digitalId.status} MEMBER</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Active Cohort</span>
                    <span className="font-sans font-bold text-text-primary sm:text-right">
                      {new Date(digitalId.issued_at).getFullYear()} - {new Date(digitalId.expires_at).getFullYear()}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-default/50 gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Issuing Institution</span>
                    <span className="font-sans font-bold text-text-primary sm:text-right">MITE, Moodabidri</span>
                  </div>

                  {/* Public Token Digest */}
                  <div className="pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">SHA-256 Public Token Digest</span>
                    <div className="text-[11px] text-text-muted bg-bg-page p-3 rounded-xl border border-border-default break-all shadow-inner font-medium">
                      {digitalId.token_hash}
                    </div>
                  </div>
                </div>

                {/* Privacy Guarantee Statement */}
                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-xs text-text-muted font-sans font-medium flex items-start gap-3 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-accent-teal flex-shrink-0" />
                  <div className="leading-relaxed">
                    <strong className="text-text-primary font-bold">Zero-PII Privacy Guarantee:</strong> Public scans only confirm validity and club role. Private student contact details and records are never exposed.
                  </div>
                </div>
              </div>
            ) : null}

            {/* Back link */}
            <div className="mt-8 pt-6 border-t border-border-default/50 text-center">
              <Link to="/">
                <Button variant="ghost" className="gap-2 text-xs font-sans font-bold text-text-muted hover:text-text-primary hover:bg-bg-page min-h-[44px] px-6 rounded-xl transition-all cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to DevStudio Platform</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
