import React, { useState } from 'react';
import { useClubData } from '../context/ClubDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings, Save, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useClubData();
  const { isAdmin } = useAuth();
  const { success } = useToast();

  const [clubName, setClubName] = useState(settings.clubName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [institution, setInstitution] = useState(settings.institution);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [minAttendancePercent, setMinAttendancePercent] = useState(settings.minAttendancePercent);
  const [qrAttendanceEnabled, setQrAttendanceEnabled] = useState(settings.qrAttendanceEnabled);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          Admin Clearance Required
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Only DevStudio Directors have authorization to modify club parameters.
        </p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clubName,
      tagline,
      institution,
      contactEmail,
      minAttendancePercent: Number(minAttendancePercent),
      qrAttendanceEnabled,
      academicYear,
    });
    success('DevStudio club settings updated successfully.');
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all demo data back to default MITE DevStudio state? (This will clear local edits).'
      )
    ) {
      resetAllData();
      success('Demo data restored to initial factory state.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Club Settings & Governance
          </h2>
          <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
            <Settings className="w-4 h-4" />
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Configure branding, attendance policies, and cryptographic verification parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Club Information */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            DevStudio Identity & Institution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Club Name
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Tagline / Motto
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Affiliated Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Official Club Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {/* Attendance & Verification Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            Attendance Policy & QR Verification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Minimum Required Attendance (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={minAttendancePercent}
                onChange={(e) => setMinAttendancePercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                Members below this rate receive warning flags on their dashboard.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                Enable High-Precision QR Attendance Terminal
              </span>
              <p className="text-[11px] text-neutral-400">
                Allows Captains and Directors to scan student ID cards using cryptographic tokens.
              </p>
            </div>
            <input
              type="checkbox"
              checked={qrAttendanceEnabled}
              onChange={(e) => setQrAttendanceEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Factory State</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
