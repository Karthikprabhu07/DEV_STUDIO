import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { UserAvatar } from '../components/common/UserAvatar';
import { MarkAttendanceModal } from '../components/attendance/MarkAttendanceModal';
import { QRAttendanceModal } from '../components/attendance/QRAttendanceModal';
import { EmptyState } from '../components/common/EmptyState';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Plus,
  QrCode,
  Shield,
  Search,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { currentUser, role, isAdmin, isCaptain, isDevMate } = useAuth();
  const {
    attendance,
    users,
    events,
    getCaptainDevMates,
    batchMarkAttendance,
  } = useClubData();

  const [dateFilter, setDateFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchMember, setSearchMember] = useState('');

  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (!currentUser) return null;

  const devMates = users.filter((u) => u.role === 'DEV_MATE');
  const assignedMates = isCaptain ? getCaptainDevMates(currentUser.id) : devMates;

  // Filter base by role:
  // Dev Mates only see their own attendance
  // Captains see their assigned Dev Mates (or all if filter chosen)
  // Admin sees all
  let baseList = attendance;
  if (isDevMate) {
    baseList = attendance.filter((a) => a.userId === currentUser.id);
  } else if (isCaptain) {
    baseList = attendance.filter((a) => assignedMates.some((m) => m.id === a.userId));
  }

  // Live filtering
  const filtered = baseList.filter((rec) => {
    // Search member name
    if (searchMember.trim()) {
      const u = users.find((usr) => usr.id === rec.userId);
      const q = searchMember.toLowerCase();
      if (!u || (!u.name.toLowerCase().includes(q) && !u.memberId.toLowerCase().includes(q))) {
        return false;
      }
    }

    // Date
    if (dateFilter !== 'ALL' && rec.date !== dateFilter) {
      return false;
    }

    // Event
    if (eventFilter !== 'ALL' && rec.eventTitle !== eventFilter) {
      return false;
    }

    // Status
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Calculate statistics for filtered set
  const totalRecords = filtered.length;
  const presentRecords = filtered.filter((r) => r.status === 'PRESENT').length;
  const absentRecords = totalRecords - presentRecords;
  const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 100;

  // Unique dates for dropdown
  const uniqueDates = Array.from(new Set(attendance.map((a) => a.date))).sort().reverse();
  const uniqueEvents = Array.from(new Set(attendance.map((a) => a.eventTitle).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            {isDevMate ? 'My Attendance Record' : 'Club Attendance Management'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isDevMate
              ? 'Review your attendance history and minimum 75% qualification criteria.'
              : 'Record, audit, and verify member attendance across club sessions.'}
          </p>
        </div>

        {/* Action Controls for Admin/Captain */}
        {!isDevMate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMarkModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mark Session Attendance</span>
            </button>
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
              title="Launch QR Attendance Terminal"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-500" />
              <span>QR Terminal</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          subtext={attendanceRate >= 75 ? 'Meets 75% Club Threshold' : 'Attention: Below 75%'}
          icon={CheckCircle2}
          accentColor={attendanceRate >= 75 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Present Sessions"
          value={presentRecords}
          subtext="Confirmed member participation"
          icon={CheckCircle2}
          accentColor="indigo"
        />
        <StatCard
          label="Absent Sessions"
          value={absentRecords}
          subtext="Excused & unexcused leaves"
          icon={XCircle}
          accentColor="purple"
        />
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {!isDevMate && (
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Search member name or ID..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 flex-1">
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="ALL">All Dates</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="ALL">All Sessions</option>
                {uniqueEvents.map((ev) => (
                  <option key={ev as string} value={ev as string}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Attendance Logs Found"
          description="Try changing the date or session filter, or record a new session."
        />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Session / Event</th>
                  <th className="py-3 px-3 font-semibold">Member</th>
                  <th className="py-3 px-3 font-semibold">Marked By</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {filtered.map((record) => {
                  const member = users.find((u) => u.id === record.userId);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {record.date}
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                          {record.eventTitle || 'DevStudio General Assembly'}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-3">
                        {member ? (
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={member.name} role={member.role} size="xs" />
                            <div>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                                {member.name}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5">
                                {member.memberId}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-mono">{record.userId}</span>
                        )}
                      </td>

                      {/* Marked By */}
                      <td className="py-3.5 px-3 text-neutral-600 dark:text-neutral-400 text-[11px]">
                        {record.markedBy}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={record.status === 'PRESENT' ? 'success' : 'danger'}
                          size="sm"
                          dot
                        >
                          {record.status}
                        </Badge>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-right text-[11px] text-neutral-400 italic">
                        {record.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {!isDevMate && (
        <>
          <MarkAttendanceModal
            isOpen={markModalOpen}
            onClose={() => setMarkModalOpen(false)}
            members={assignedMates}
            events={events}
            markerName={currentUser.name}
            onBatchSubmit={batchMarkAttendance}
          />
          <QRAttendanceModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            scannerName={currentUser.name}
          />
        </>
      )}
    </div>
  );
};
