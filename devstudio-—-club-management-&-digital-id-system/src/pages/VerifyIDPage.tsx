import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClubData } from '../context/ClubDataContext';
import { DevStudioLogo } from '../components/common/DevStudioLogo';
import { UserAvatar } from '../components/common/UserAvatar';
import { ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

export const VerifyIDPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { getCardByToken } = useClubData();

  const verified = token ? getCardByToken(token) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-xl w-full mx-auto">
        <DevStudioLogo size="md" className="[&_span]:text-white" />
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>DevStudio Portal</span>
        </Link>
      </header>

      {/* Center Verification Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl text-center">
          {verified ? (
            /* VALID VERIFIED MEMBER CARD */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Verification Status Banner */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified DevStudio Member</span>
              </div>

              {/* Portrait & Role Ring */}
              <div className="flex justify-center pt-2">
                <UserAvatar
                  name={verified.user.name}
                  role={verified.user.role}
                  size="2xl"
                  showBadge
                />
              </div>

              {/* Member Details */}
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {verified.user.name}
                </h1>
                <p className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mt-1">
                  {verified.user.role.replace('_', ' ')}
                </p>
              </div>

              {/* Credentials Box */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5 text-left text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Member ID:</span>
                  <span className="font-bold text-white tracking-wider">{verified.card.memberId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Department:</span>
                  <span className="font-semibold text-neutral-200 text-right truncate max-w-[200px]">
                    {verified.user.branch}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Academic Term:</span>
                  <span className="text-neutral-300">{verified.user.semester}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Institution:</span>
                  <span className="text-neutral-300">MITE Mangalore</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                  <span className="text-neutral-500">Credential Status:</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active & Valid
                  </span>
                </div>
              </div>

              {/* Security Footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-500">
                <Lock className="w-3 h-3 text-neutral-400" />
                <span>Cryptographically verified via DevStudio MITE</span>
              </div>
            </div>
          ) : (
            /* INVALID OR EXPIRED CARD */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
                <AlertCircle className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                Invalid or Expired ID
              </h2>

              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                The verification token provided does not match any active student credential in the DevStudio MITE database.
              </p>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-400 truncate">
                Token: {token || 'None provided'}
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
                >
                  Return to DevStudio
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-neutral-500 font-mono py-2">
        <p>Mangalore Institute of Technology & Engineering · DevStudio Vibe Coding</p>
      </footer>
    </div>
  );
};
