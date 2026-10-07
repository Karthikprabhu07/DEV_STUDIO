import React, { useState } from 'react'
import { Terminal, Shield, Wifi, RotateCw, Copy, Check, Lock, Sparkles } from 'lucide-react'
import { Profile } from '@/types'
import { DigitalIdRecord } from '@/lib/digitalId'
import { RoleBadge } from '@/components/ui/badge'
import { QrCodeView } from '@/components/common/QrCodeView'
import { UserAvatar } from '@/components/profile/UserAvatar'

interface DigitalIdCard3DProps {
  profile: Profile
  digitalId: DigitalIdRecord
}

export const DigitalIdCard3D: React.FC<DigitalIdCard3DProps> = ({ profile, digitalId }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(digitalId.devstudio_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleName = profile.role === 'admin' 
    ? 'Dev Director' 
    : profile.role === 'organizer' 
      ? 'Dev Captain' 
      : 'Dev Mate'

  return (
    <div className="flex flex-col items-center select-none">
      {/* 3D Container with Perspective */}
      <div
        className="w-full max-w-[420px] h-[580px] cursor-pointer [perspective:1200px]"
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseMove={handleMouseMove}
        id="digital-id-card-container"
      >
        <div
          className={`relative w-full h-full duration-700 [transform-style:preserve-3d] transition-transform ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ================= CARD FRONT ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-border-default [backface-visibility:hidden] flex flex-col justify-between p-6 bg-bg-surface"
            style={{
              backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(var(--accent-primary-rgb), 0.08), transparent 45%), linear-gradient(135deg, var(--bg-page) 0%, var(--bg-surface) 50%, var(--bg-page) 100%)`,
            }}
          >
            {/* Corner Registration Marks (Technical Drafting Marks) */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-border-default pointer-events-none z-20" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-border-default pointer-events-none z-20" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-border-default pointer-events-none z-20" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-border-default pointer-events-none z-20" />

            {/* Holographic Security Overlay Sheen */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
              style={{
                background: `linear-gradient(${mousePos.x * 2}deg, rgba(var(--accent-primary-rgb),0.2) 0%, rgba(var(--accent-teal-rgb),0.3) 50%, rgba(var(--status-success-rgb),0.2) 100%)`,
              }}
            />

            {/* Subtle Grid Watermark */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(var(--accent-primary) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            />

            {/* Card Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-bg-surface border border-accent-primary/40 flex items-center justify-center text-accent-primary shadow-[0_0_12px_rgba(59,107,251,0.2)]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm tracking-wider text-text-primary font-mono">DEVSTUDIO</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
                        MITE
                      </span>
                    </div>
                    <span className="text-[9px] text-text-muted font-mono tracking-widest block">
                      BUILD. SHIP. LEARN.
                    </span>
                  </div>
                </div>

                {/* NFC Symbol */}
                <div className="flex items-center gap-2 text-text-muted">
                  <Wifi className="w-4 h-4 rotate-90 text-accent-teal" />
                  <span className="text-[9px] font-mono tracking-widest text-text-muted">MEMBER ID</span>
                </div>
              </div>

              {/* EMV Holographic Smart Chip */}
              <div className="mt-4 flex items-center justify-between">
                <div className="w-11 h-9 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300/80 shadow-md relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-700/50" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-700/50" />
                  <div className="w-4 h-4 rounded border border-amber-700/40" />
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bg-surface/80 border border-border-default text-[10px] font-mono text-accent-teal">
                  <Sparkles className="w-3 h-3 text-accent-primary" />
                  <span>SECURE CREDENTIAL</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Member Photo/Avatar + Details */}
            <div className="relative z-10 flex gap-4 items-center my-auto">
              {/* Photo / Avatar with Glowing Frame */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-border-default shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-bg-surface flex items-center justify-center">
                  <UserAvatar profile={profile} className="w-full h-full text-2xl" />
                </div>
                {/* Active Verified Pip */}
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-status-success border-2 border-bg-surface flex items-center justify-center text-[10px] text-on-accent shadow-sm font-bold">
                  ✓
                </div>
              </div>

              {/* Name & Identifiers */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <RoleBadge role={profile.role} />
                </div>

                <h2 className="text-lg font-bold text-text-primary tracking-tight leading-tight pt-1">
                  {profile.full_name}
                </h2>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <code className="text-xs font-plex font-mono font-bold text-accent-teal tracking-wider">
                    {digitalId.devstudio_id}
                  </code>
                  <button
                    onClick={copyId}
                    title="Copy DevStudio ID"
                    className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="text-[11px] text-text-muted font-mono pt-1 space-y-0.5">
                  {profile.usn && (
                    <div>USN: <span className="text-text-primary">{profile.usn}</span></div>
                  )}
                  <div>DEPT: <span className="text-text-primary truncate">{profile.branch || (profile.role === 'admin' ? 'Engineering Lead' : 'Computer Science')}</span></div>
                </div>
              </div>
            </div>

            {/* Bottom Section: QR Code & Verification Tag */}
            <div className="relative z-10 pt-3 border-t border-border-default flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase font-mono tracking-wider text-text-muted">
                  SCAN TO VERIFY
                </div>
                <div className="text-[11px] font-mono font-semibold text-status-success flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-status-success" />
                  <span>ACTIVE COHORT</span>
                </div>
                <div className="text-[9px] font-mono text-text-muted mt-0.5">
                  EXP: {new Date(digitalId.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="mt-2 text-[9px] font-mono text-accent-primary flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>TAP CARD TO FLIP</span>
                </div>
              </div>

              {/* High-Clarity Standards-Compliant Scannable QR Code */}
              <div className="flex-shrink-0">
                <QrCodeView value={digitalId.qr_payload_url} size={96} includeBrandIcon={false} />
              </div>
            </div>
          </div>

          {/* ================= CARD BACK ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-border-default [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between bg-bg-page p-6 text-text-primary"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--bg-page) 0%, var(--bg-surface) 50%, var(--bg-page) 100%)`,
            }}
          >
            {/* Corner Registration Marks (Technical Drafting Marks) */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-border-default pointer-events-none z-20" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-border-default pointer-events-none z-20" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-border-default pointer-events-none z-20" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-border-default pointer-events-none z-20" />

            {/* Magnetic Strip */}
            <div className="-mx-6 -mt-6 h-12 bg-black border-b border-border-default flex items-center px-6">
              <div className="w-full h-8 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-y border-neutral-700/50 flex items-center justify-end px-3">
                <span className="text-[8px] font-mono tracking-widest text-neutral-500">MAGSTRIPE TRACK 1 & 2</span>
              </div>
            </div>

            {/* Cryptographic Signature Strip */}
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                <span>AUTHORIZED SIGNATURE</span>
                <span>SHA-256 TOKEN</span>
              </div>
              <div className="h-10 rounded bg-bg-surface/90 border border-border-default flex items-center justify-between px-3">
                <span className="font-serif italic text-sm text-text-primary font-bold tracking-wider">
                  DevStudio Platform Director
                </span>
                <span className="text-[10px] font-plex font-mono font-bold text-accent-primary">
                  {digitalId.raw_token_preview}
                </span>
              </div>
            </div>

            {/* Club Manifesto & Terms */}
            <div className="my-auto space-y-2 text-[10px] text-text-muted leading-relaxed font-mono">
              <div className="p-2.5 rounded-lg bg-bg-surface/60 border border-border-default space-y-1.5">
                <div className="text-text-primary font-bold text-[11px] flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-accent-primary" />
                  <span>TERMS & CODE OF CONDUCT</span>
                </div>
                <p>
                  1. This digital credential remains the property of DevStudio, Mangalore Institute of Technology & Engineering.
                </p>
                <p>
                  2. Grants cardholder physical access to DevStudio labs, AI workstations, and priority workshop registration.
                </p>
                <p>
                  3. Fraudulent use or unauthorized transfer results in immediate credential revocation.
                </p>
              </div>

              {/* Token Hash Fingerprint */}
              <div>
                <div className="text-[8px] uppercase tracking-wider text-text-muted">
                  SHA-256 Public Verification Hash:
                </div>
                <div className="text-[9px] text-accent-teal break-all font-plex font-mono bg-bg-surface/70 p-1.5 rounded border border-border-default">
                  {digitalId.token_hash}
                </div>
              </div>
            </div>

            {/* Back Card Footer: Institutional Info & Flip Cue */}
            <div className="pt-3 border-t border-border-default flex items-center justify-between text-[9px] font-mono text-text-muted">
              <div>
                <div className="font-bold text-text-primary">MITE DEVSTUDIO</div>
                <div>Moodabidri, Karnataka 574225</div>
              </div>

              <div className="text-right">
                <div className="text-accent-primary font-bold">FLIP TO FRONT ↺</div>
                <div>Role: {roleName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Interaction Text */}
      <div className="mt-3 text-xs text-text-muted font-mono flex items-center gap-1.5">
        <RotateCw className="w-3.5 h-3.5 text-accent-primary" />
        <span>Click or tap card to rotate between Front and Back</span>
      </div>
    </div>
  )
}
