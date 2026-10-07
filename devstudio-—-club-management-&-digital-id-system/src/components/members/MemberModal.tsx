import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User, UserRole, MemberStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<User, 'id' | 'memberId' | 'joinedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<User>) => void;
  initialMember?: User | null;
  captainsList: User[];
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialMember,
  captainsList,
}) => {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DEV_MATE');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('5th Semester');
  const [usn, setUsn] = useState('4MT23CS');
  const [captainId, setCaptainId] = useState('');
  const [status, setStatus] = useState<MemberStatus>('ACTIVE');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setEmail(initialMember.email);
      setRole(initialMember.role);
      setBranch(initialMember.branch);
      setSemester(initialMember.semester);
      setUsn(initialMember.usn);
      setCaptainId(initialMember.captainId || '');
      setStatus(initialMember.status);
      setPhone(initialMember.phone || '');
      setBio(initialMember.bio || '');
    } else {
      setName('');
      setEmail('');
      setRole('DEV_MATE');
      setBranch('Computer Science & Engineering');
      setSemester('5th Semester');
      setUsn('4MT23CS');
      setCaptainId(captainsList[0]?.id || '');
      setStatus('ACTIVE');
      setPhone('');
      setBio('');
    }
  }, [initialMember, captainsList, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error('Please fill in member name and email address.');
      return;
    }

    if (initialMember && onUpdate) {
      onUpdate(initialMember.id, {
        name,
        email,
        role,
        branch,
        semester,
        usn,
        captainId: role === 'DEV_MATE' ? captainId : undefined,
        status,
        phone,
        bio,
      });
      success(`Updated details for ${name}.`);
    } else {
      onSave({
        name,
        email,
        role,
        branch,
        semester,
        usn,
        captainId: role === 'DEV_MATE' ? captainId : undefined,
        status,
        phone,
        bio,
        skills: ['Vibe Coding', 'DevStudio Member'],
      });
      success(`Added ${name} as a new ${role.replace('_', ' ')}.`);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMember ? `Edit Member: ${initialMember.name}` : 'Add DevStudio Member'}
      subtitle={initialMember ? initialMember.memberId : 'Register a new student developer or captain'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karthik Sudhir Prabhu"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              College Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. karthik@devstudio.mite.ac.in"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Club Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="DEV_MATE">Dev Mate</option>
              <option value="CAPTAIN">Captain</option>
              <option value="ADMIN">Admin / Director</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="3rd Semester">3rd Semester</option>
              <option value="5th Semester">5th Semester</option>
              <option value="7th Semester">7th Semester</option>
              <option value="Alumni / Faculty">Faculty / Lead</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              USN (MITE ID)
            </label>
            <input
              type="text"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              placeholder="e.g. 4MT23CS064"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Branch / Department
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Science & Engineering">Information Science & Engineering</option>
              <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Mechatronics Engineering">Mechatronics</option>
            </select>
          </div>

          {role === 'DEV_MATE' && (
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Assigned Captain
              </label>
              <select
                value={captainId}
                onChange={(e) => setCaptainId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {captainsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.memberId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {role !== 'DEV_MATE' && (
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Member Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending Review</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
            Short Bio / Focus Track
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Web developer focusing on Next.js, APIs, and UI animations."
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            {initialMember ? 'Save Changes' : 'Create Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
