import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, DigitalIDCard as IDCardType } from '../../types';
import { DevStudioLogo } from '../common/DevStudioLogo';
import { UserAvatar } from '../common/UserAvatar';
import { useToast } from '../../context/ToastContext';
import {
  RotateCw,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DigitalIDCardProps {
  user: User;
  card: IDCardType;
  showActions?: boolean;
  compact?: boolean;
}

export const DigitalIDCard: React.FC<DigitalIDCardProps> = ({
  user,
  card,
  showActions = true,
  compact = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { success } = useToast();

  const verifyUrl = `${window.location.origin}/verify/${card.verificationToken}`;

  const copyVerifyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    success('Verification link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  const roleThemes = {
    ADMIN: {
      gradient: 'from-neutral-900 via-indigo-950 to-neutral-900',
      border: 'border-amber-500/50 shadow-amber-500/10',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      accentText: 'text-amber-400',
      subText: 'text-neutral-400',
      roleLabel: 'DIRECTOR / FACULTY ADVISOR',
      chipColor: 'from-amber-300 to-amber-600',
      hologram: 'from-amber-400/20 via-rose-400/15 to-indigo-400/20',
    },
    CAPTAIN: {
      gradient: 'from-neutral-950 via-slate-900 to-cyan-950',
      border: 'border-cyan-500/40 shadow-cyan-500/10',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      accentText: 'text-cyan-400',
      subText: 'text-neutral-400',
      roleLabel: 'CLUB CAPTAIN',
      chipColor: 'from-cyan-300 to-blue-600',
      hologram: 'from-cyan-400/20 via-indigo-400/15 to-teal-400/20',
    },
    DEV_MATE: {
      gradient: 'from-neutral-950 via-zinc-900 to-emerald-950',
      border: 'border-emerald-500/40 shadow-emerald-500/10',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      accentText: 'text-emerald-400',
      subText: 'text-neutral-400',
      roleLabel: 'DEV MATE',
      chipColor: 'from-emerald-300 to-teal-600',
      hologram: 'from-emerald-400/20 via-teal-400/15 to-indigo-400/20',
    },
  };

  const theme = roleThemes[user.role] || roleThemes.DEV_MATE;

  return (
    <div className="flex flex-col items-center">
      {/* 3D Card Container */}
      <div
        className={`perspective-1000 relative select-none transition-all duration-300 ${
          compact ? 'w-[320px] h-[480px]' : 'w-[340px] sm:w-[380px] h-[520px] sm:h-[560px]'
        }`}
      >
        <div
          className={`w-full h-full duration-500 transform-style-preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ================= FRONT OF CARD ================= */}
          <div
            className={`absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl border ${theme.border} bg-gradient-to-b ${theme.gradient} text-white`}
          >
            {/* Holographic Watermark Pattern */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br ${theme.hologram} blur-3xl pointer-events-none opacity-60`} />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

            {/* Top Bar: DevStudio & MITE Institution */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <DevStudioLogo size="sm" showSubtitle={false} className="[&_span]:text-white" />
              <div className="text-right">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/50 block">Institution</span>
                <span className="text-xs font-bold tracking-tight text-white/90">MITE</span>
              </div>
            </div>

            {/* Middle Section: Smart Chip, RFID, & Avatar */}
            <div className="relative z-10 my-auto flex flex-col items-center text-center">
              {/* Electronic Smart Chip Simulation */}
              <div className="w-full flex items-center justify-between px-2 mb-4">
                <div className={`w-11 h-8 rounded-md bg-gradient-to-br ${theme.chipColor} p-1 shadow-inner flex flex-col justify-between border border-white/30 opacity-90`}>
                  <div className="h-1 w-full border-b border-black/20" />
                  <div className="h-1 w-3/4 border-b border-black/20" />
                  <div className="h-1 w-full border-b border-black/20" />
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <Wifi className="w-4 h-4 rotate-90" />
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Portrait & Role Ring */}
              <div className="relative mb-3">
                <UserAvatar name={user.name} role={user.role} size="2xl" showBadge />
              </div>

              {/* Member Name */}
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white capitalize leading-tight">
                {user.name}
              </h2>

              {/* Role Title */}
              <div className="mt-1.5">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${theme.badgeBg}`}>
                  {theme.roleLabel}
                </span>
              </div>

              {/* Department & Academic Semester */}
              <div className="mt-3.5 space-y-0.5 text-xs text-neutral-300">
                <p className="font-semibold text-white/90">{user.branch}</p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <span>{user.semester}</span>
                  <span>·</span>
                  <span>USN: {user.usn}</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: ID & Active Status */}
            <div className="relative z-10 border-t border-white/10 pt-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 block">
                  Member ID
                </span>
                <span className="text-sm font-mono font-bold tracking-wider text-white">
                  {user.memberId}
                </span>
              </div>

              <div className="text-right flex items-center gap-2">
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 block">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BACK OF CARD ================= */}
          <div
            className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl border ${theme.border} bg-gradient-to-b ${theme.gradient} text-white`}
          >
            {/* Magnetic Stripe Graphic */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-neutral-950/90 border-b border-white/10" />

            <div className="relative z-10 mt-8 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-white">DevStudio</span>
                <p className="text-[10px] text-neutral-400 font-mono">MITE Developer Community</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-neutral-400">Card Ref:</span>
                <span className="block text-xs font-mono font-bold text-white/90">{card.id}</span>
              </div>
            </div>

            {/* QR Code Verification Section */}
            <div className="relative z-10 my-auto flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-white/20">
                <QRCodeSVG
                  value={verifyUrl}
                  size={compact ? 130 : 155}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Scan to verify this DevStudio ID</span>
              </div>

              <p className="text-[10px] text-neutral-400 max-w-[240px] mt-1 font-mono">
                Cryptographically signed token. Personal details remain protected.
              </p>
            </div>

            {/* Validity & Emergency Contact Info */}
            <div className="relative z-10 border-t border-white/10 pt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-left font-mono text-[11px]">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Issued</span>
                  <span className="text-white/90">{card.issuedAt}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Valid Thru</span>
                  <span className="text-white/90">{card.expiresAt}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Blood Group</span>
                  <span className="text-white/90">{card.bloodGroup || 'O+ve'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Contact</span>
                  <span className="text-white/90 truncate block">{card.emergencyContact || '+91 98450 12345'}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-neutral-500 font-mono pt-1">
                Property of DevStudio MITE · If found return to CS Innovation Hub
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Controls */}
      {showActions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-sm w-full no-print">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
          </button>

          <button
            onClick={copyVerifyLink}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
            title="Copy Verification Link"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
            title="Print Official ID"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <Link
            to={`/verify/${card.verificationToken}`}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
            title="Open Public Verification Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verify</span>
          </Link>
        </div>
      )}
    </div>
  );
};
