import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useClubData } from '../../context/ClubDataContext';
import { useToast } from '../../context/ToastContext';
import { QrCode, CheckCircle2, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface QRAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannerName: string;
}

export const QRAttendanceModal: React.FC<QRAttendanceModalProps> = ({
  isOpen,
  onClose,
  scannerName,
}) => {
  const { getCardByToken, markAttendance, idCards, users } = useClubData();
  const { success, error } = useToast();

  const [inputToken, setInputToken] = useState('');
  const [scannedResult, setScannedResult] = useState<{ user: any; card: any } | null>(null);
  const [sessionName, setSessionName] = useState('Vibe Coding Sprint & Standup');

  const handleVerifyAndMark = (token: string) => {
    const res = getCardByToken(token.trim());
    if (res) {
      setScannedResult(res);
      markAttendance(
        res.user.id,
        'PRESENT',
        sessionName,
        'Verified via Official DevStudio Digital QR Scanner',
        scannerName
      );
      success(`Verified: ${res.user.name} (${res.user.memberId}) marked PRESENT!`);
    } else {
      setScannedResult(null);
      error('Invalid or expired QR verification token.');
    }
  };

  const handleQuickScan = (token: string) => {
    setInputToken(token);
    handleVerifyAndMark(token);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DevStudio QR Attendance Terminal"
      subtitle="Authorized for Captains & Directors only"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Scanner Simulation Viewport */}
        <div className="relative rounded-2xl bg-neutral-950 p-6 border border-indigo-500/30 overflow-hidden text-center text-white">
          {/* Laser scanning line animation */}
          <div className="w-48 h-48 mx-auto relative border-2 border-dashed border-indigo-400/50 rounded-2xl p-4 flex flex-col items-center justify-center bg-indigo-950/20">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg" />
            <QrCode className="w-20 h-20 text-indigo-400 opacity-80" />
            <span className="text-[10px] font-mono text-cyan-400 mt-2 uppercase tracking-widest">
              Live Token Reader
            </span>
          </div>

          <p className="mt-3 text-xs text-neutral-400 max-w-sm mx-auto">
            Scan DevStudio Member ID cards using hardware scanner or camera terminal.
          </p>
        </div>

        {/* Manual Token Entry or Demo Instant Scan */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
            Scan / Enter Opaque Verification Token:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="e.g. 8f72a9c1e4d29b0a76f53e81..."
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono text-neutral-900 dark:text-neutral-100"
            />
            <button
              onClick={() => handleVerifyAndMark(inputToken)}
              disabled={!inputToken.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
            >
              Verify & Mark
            </button>
          </div>
        </div>

        {/* Demo Fast-Scan Sample Tokens for Dev Mates */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
            Quick Test Card Simulators (Click to scan):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {idCards.slice(3, 7).map((card) => {
              const u = users.find((usr) => usr.id === card.userId);
              if (!u) return null;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleQuickScan(card.verificationToken)}
                  className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 bg-white dark:bg-neutral-900 text-left text-xs transition-colors flex items-center justify-between"
                >
                  <div className="truncate">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                      {u.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 block">
                      {u.memberId}
                    </span>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Scanned result card */}
        {scannedResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <UserAvatar name={scannedResult.user.name} role={scannedResult.user.role} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Attendance Verified</span>
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {scannedResult.user.name}
              </h4>
              <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                {scannedResult.user.memberId} · {scannedResult.user.branch} · {scannedResult.user.semester}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </Modal>
  );
};
