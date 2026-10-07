import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { User, AttendanceStatus, ClubEvent } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Check, X, Calendar } from 'lucide-react';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: User[];
  events: ClubEvent[];
  markerName: string;
  onBatchSubmit: (
    records: { userId: string; status: AttendanceStatus }[],
    eventTitle: string,
    markerName: string
  ) => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  members,
  events,
  markerName,
  onBatchSubmit,
}) => {
  const { success } = useToast();
  const [eventTitle, setEventTitle] = useState(events[0]?.title || 'DevStudio Weekly Sync');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Map of userId -> AttendanceStatus
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    members.forEach((m) => {
      initial[m.id] = 'PRESENT';
    });
    return initial;
  });

  const toggleStatus = (userId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [userId]: prev[userId] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    members.forEach((m) => {
      updated[m.id] = status;
    });
    setStatuses(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const records = members.map((m) => ({
      userId: m.id,
      status: statuses[m.id] || 'PRESENT',
    }));

    onBatchSubmit(records, eventTitle, markerName);
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    success(`Attendance recorded for ${records.length} members (${presentCount} Present).`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Club Attendance"
      subtitle={`Session tracking · Marked by ${markerName}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Session details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Select Event / Activity *
            </label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              list="event-suggestions"
              placeholder="e.g. Vibe Coding Workshop"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
            />
            <datalist id="event-suggestions">
              {events.map((ev) => (
                <option key={ev.id} value={ev.title} />
              ))}
              <option value="Weekly Project Standup" />
              <option value="General Club Assembly" />
              <option value="Hackathon Prep Session" />
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Session Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {/* Quick Batch Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Members to Record ({members.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll('PRESENT')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('ABSENT')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Members Attendance List */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => {
            const isPresent = (statuses[m.id] || 'PRESENT') === 'PRESENT';
            return (
              <div
                key={m.id}
                onClick={() => toggleStatus(m.id)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors pt-2.5"
              >
                <div>
                  <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block">
                    {m.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {m.memberId} · {m.branch}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatuses((prev) => ({ ...prev, [m.id]: 'PRESENT' }));
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatuses((prev) => ({ ...prev, [m.id]: 'ABSENT' }));
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !isPresent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            Save Attendance
          </button>
        </div>
      </form>
    </Modal>
  );
};
