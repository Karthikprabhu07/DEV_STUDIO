import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { User } from '../types';
import { UserAvatar } from '../components/common/UserAvatar';
import { Badge } from '../components/common/Badge';
import { AssignCaptainModal } from '../components/members/AssignCaptainModal';
import { MemberModal } from '../components/members/MemberModal';
import { IDCardPreviewModal } from '../components/idcard/IDCardPreviewModal';
import { Shield, Users, UserPlus, IdCard, Edit2, CheckCircle2, Sparkles } from 'lucide-react';

export const CaptainsPage: React.FC = () => {
  const { role } = useAuth();
  const {
    users,
    getCaptainDevMates,
    getAttendanceStats,
    assignCaptainToMate,
    updateMember,
    addMember,
    getIDCardForUser,
  } = useClubData();

  const [assignCaptain, setAssignCaptain] = useState<User | null>(null);
  const [editingCaptain, setEditingCaptain] = useState<User | null>(null);
  const [captainModalOpen, setCaptainModalOpen] = useState(false);
  const [previewCardUser, setPreviewCardUser] = useState<User | null>(null);

  const captains = users.filter((u) => u.role === 'CAPTAIN');
  const allDevMates = users.filter((u) => u.role === 'DEV_MATE');
  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              DevStudio Captains
            </h2>
            <span className="p-1 rounded-full bg-cyan-500/10 text-cyan-400">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Cohort leadership, track leads, and student mentorship directors.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingCaptain(null);
              setCaptainModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Appoint Captain</span>
          </button>
        )}
      </div>

      {/* Captains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {captains.map((captain) => {
          const assignedMates = getCaptainDevMates(captain.id);
          const stats = getAttendanceStats(captain.id);
          const card = getIDCardForUser(captain.id);

          return (
            <div
              key={captain.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={captain.name} role="CAPTAIN" size="lg" showBadge />
                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-50">
                        {captain.name}
                      </h3>
                      <span className="text-[11px] font-mono text-neutral-400 block -mt-0.5">
                        {captain.memberId} · {captain.usn}
                      </span>
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 block font-medium mt-0.5">
                        {captain.branch} ({captain.semester})
                      </span>
                    </div>
                  </div>
                  <Badge variant="info" size="sm" dot>
                    Active Captain
                  </Badge>
                </div>

                {/* Bio & Skills */}
                {captain.bio && (
                  <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                    {captain.bio}
                  </p>
                )}

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Cohort Size</span>
                    <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                      {assignedMates.length} Mates
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Attendance</span>
                    <span className="text-sm font-black text-emerald-500">
                      {stats.percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Contact</span>
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 truncate block">
                      {captain.phone || 'Club Phone'}
                    </span>
                  </div>
                </div>

                {/* Assigned Dev Mates list chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Mentoring Dev Mates ({assignedMates.length}):
                  </span>
                  {assignedMates.length === 0 ? (
                    <span className="text-xs text-neutral-400 italic">No members assigned yet.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedMates.map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60"
                        >
                          {m.name.split(' ')[0]} ({m.memberId})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => setPreviewCardUser(captain)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <IdCard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Captain ID Card</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssignCaptain(captain)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Mates</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingCaptain(captain);
                        setCaptainModalOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Dev Mates Modal */}
      {assignCaptain && (
        <AssignCaptainModal
          isOpen={!!assignCaptain}
          onClose={() => setAssignCaptain(null)}
          captain={assignCaptain}
          allDevMates={allDevMates}
          onAssignMate={assignCaptainToMate}
        />
      )}

      {/* Edit or Add Captain Modal */}
      <MemberModal
        isOpen={captainModalOpen}
        onClose={() => setCaptainModalOpen(false)}
        onSave={addMember}
        onUpdate={updateMember}
        initialMember={editingCaptain}
        captainsList={[]}
      />

      {/* View Captain ID Card */}
      {previewCardUser && (
        <IDCardPreviewModal
          isOpen={!!previewCardUser}
          onClose={() => setPreviewCardUser(null)}
          user={previewCardUser}
          card={getIDCardForUser(previewCardUser.id)}
        />
      )}
    </div>
  );
};
