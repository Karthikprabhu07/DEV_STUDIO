import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Shield } from 'lucide-react';

interface AssignCaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  captain: User | null;
  allDevMates: User[];
  onAssignMate: (mateId: string, captainId: string) => void;
}

export const AssignCaptainModal: React.FC<AssignCaptainModalProps> = ({
  isOpen,
  onClose,
  captain,
  allDevMates,
  onAssignMate,
}) => {
  const { success } = useToast();
  const [selectedMateId, setSelectedMateId] = useState('');

  if (!captain) return null;

  const assignedMates = allDevMates.filter((m) => m.captainId === captain.id);
  const unassignedMates = allDevMates.filter((m) => m.captainId !== captain.id);

  const handleAssign = () => {
    if (!selectedMateId) return;
    onAssignMate(selectedMateId, captain.id);
    const mate = allDevMates.find((m) => m.id === selectedMateId);
    success(`Assigned ${mate?.name} to Captain ${captain.name}.`);
    setSelectedMateId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Dev Mates to Captain ${captain.name}`}
      subtitle={`${captain.memberId} · ${captain.branch}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Assign new mate control */}
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
            Add Dev Mate under this Captain
          </label>
          <div className="flex gap-2">
            <select
              value={selectedMateId}
              onChange={(e) => setSelectedMateId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="">Select a Dev Mate...</option>
              {unassignedMates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberId} · {m.branch})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedMateId}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
            >
              Assign
            </button>
          </div>
        </div>

        {/* Currently assigned list */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            Currently Assigned Dev Mates ({assignedMates.length})
          </h4>

          {assignedMates.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center bg-neutral-50 dark:bg-neutral-950/50 rounded-xl">
              No Dev Mates currently assigned to this captain.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {assignedMates.map((mate) => (
                <div
                  key={mate.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                >
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                      {mate.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {mate.memberId} · {mate.branch} ({mate.semester})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
