import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { User, MemberStatus } from '../types';
import { UserAvatar } from '../components/common/UserAvatar';
import { Badge } from '../components/common/Badge';
import { MemberModal } from '../components/members/MemberModal';
import { IDCardPreviewModal } from '../components/idcard/IDCardPreviewModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Plus,
  Filter,
  IdCard,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Shield,
  Users,
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  const { role, currentUser } = useAuth();
  const {
    users,
    idCards,
    addMember,
    updateMember,
    deleteMember,
    getAttendanceStats,
    getIDCardForUser,
  } = useClubData();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [captainFilter, setCaptainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [previewCardUser, setPreviewCardUser] = useState<User | null>(null);

  const captains = users.filter((u) => u.role === 'CAPTAIN');

  // If captain, by default show their assigned mates or all mates
  const isCaptain = role === 'CAPTAIN';
  const isAdmin = role === 'ADMIN';

  // Base list: only DEV_MATE on this page (Captains have their own dedicated page)
  let list = users.filter((u) => u.role === 'DEV_MATE');

  // If captain, show assigned dev mates prominently, or allow filtering
  if (isCaptain && captainFilter === 'MINE') {
    list = list.filter((u) => u.captainId === currentUser?.id);
  }

  // Filter application
  const filtered = list.filter((m) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Branch
    if (branchFilter !== 'ALL' && m.branch !== branchFilter) {
      return false;
    }

    // Semester
    if (semesterFilter !== 'ALL' && m.semester !== semesterFilter) {
      return false;
    }

    // Captain
    if (captainFilter !== 'ALL' && captainFilter !== 'MINE' && m.captainId !== captainFilter) {
      return false;
    }

    // Status
    if (statusFilter !== 'ALL' && m.status !== statusFilter) {
      return false;
    }

    // Attendance
    if (attendanceFilter !== 'ALL') {
      const stats = getAttendanceStats(m.id);
      if (attendanceFilter === 'GOOD' && stats.percentage < 75) return false;
      if (attendanceFilter === 'LOW' && stats.percentage >= 75) return false;
    }

    return true;
  });

  const handleToggleStatus = (m: User) => {
    const nextStatus: MemberStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateMember(m.id, { status: nextStatus });
    success(`Member status updated to ${nextStatus}.`);
  };

  const handleDelete = (m: User) => {
    if (window.confirm(`Are you sure you want to remove ${m.name} from DevStudio?`)) {
      deleteMember(m.id);
      success(`Removed ${m.name}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Dev Mates
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage and monitor DevStudio student developers.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingMember(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dev Mate</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID (e.g. DS-MATE-001), email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Quick Clear */}
          {(searchQuery ||
            branchFilter !== 'ALL' ||
            semesterFilter !== 'ALL' ||
            captainFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            attendanceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setBranchFilter('ALL');
                setSemesterFilter('ALL');
                setCaptainFilter('ALL');
                setStatusFilter('ALL');
                setAttendanceFilter('ALL');
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="ALL">All Branches</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Science & Engineering">ISE</option>
              <option value="Artificial Intelligence & Data Science">AI & DS</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Mechatronics Engineering">Mechatronics</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Semester
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="ALL">All Semesters</option>
              <option value="3rd Semester">3rd Semester</option>
              <option value="5th Semester">5th Semester</option>
              <option value="7th Semester">7th Semester</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Captain
            </label>
            <select
              value={captainFilter}
              onChange={(e) => setCaptainFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="ALL">All Captains</option>
              {isCaptain && <option value="MINE">★ My Assigned Mates</option>}
              {captains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Attendance
            </label>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="ALL">All Attendance</option>
              <option value="GOOD">Criteria Met (≥ 75%)</option>
              <option value="LOW">Low Attendance (&lt; 75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Dev Mates Content: Desktop Table & Mobile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Dev Mates Match Criteria"
          description="Try broadening your branch, semester, or search filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setBranchFilter('ALL');
            setSemesterFilter('ALL');
            setCaptainFilter('ALL');
            setStatusFilter('ALL');
            setAttendanceFilter('ALL');
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4 font-semibold">Dev Mate</th>
                    <th className="py-3 px-3 font-semibold">Member ID</th>
                    <th className="py-3 px-3 font-semibold">Branch & Sem</th>
                    <th className="py-3 px-3 font-semibold">Assigned Captain</th>
                    <th className="py-3 px-3 font-semibold">Attendance</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {filtered.map((mate) => {
                    const stats = getAttendanceStats(mate.id);
                    const captain = captains.find((c) => c.id === mate.captainId);
                    const card = getIDCardForUser(mate.id);

                    return (
                      <tr
                        key={mate.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        {/* Member avatar & name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={mate.name} role="DEV_MATE" size="sm" />
                            <div>
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                {mate.name}
                              </span>
                              <span className="text-[11px] font-mono text-neutral-400 block -mt-0.5">
                                {mate.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Member ID */}
                        <td className="py-3.5 px-3 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {mate.memberId}
                        </td>

                        {/* Branch & Semester */}
                        <td className="py-3.5 px-3">
                          <span className="text-neutral-900 dark:text-neutral-100 block truncate max-w-[180px]">
                            {mate.branch}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {mate.semester} · USN: {mate.usn}
                          </span>
                        </td>

                        {/* Captain */}
                        <td className="py-3.5 px-3">
                          {captain ? (
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3 h-3 text-cyan-500" />
                              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                {captain.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic">Unassigned</span>
                          )}
                        </td>

                        {/* Attendance */}
                        <td className="py-3.5 px-3 font-mono">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`font-bold ${
                                stats.percentage >= 75
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {stats.percentage}%
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              ({stats.present}/{stats.total})
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <Badge
                            variant={
                              mate.status === 'ACTIVE'
                                ? 'success'
                                : mate.status === 'PENDING'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                            dot
                          >
                            {mate.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View ID Card */}
                            <button
                              onClick={() => setPreviewCardUser(mate)}
                              className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="View Digital ID Card"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>

                            {/* Edit Member */}
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingMember(mate);
                                  setModalOpen(true);
                                }}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Edit Member"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Disable / Enable Member */}
                            {isAdmin && (
                              <button
                                onClick={() => handleToggleStatus(mate)}
                                className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                                  mate.status === 'ACTIVE'
                                    ? 'text-neutral-400 hover:text-amber-600'
                                    : 'text-emerald-500 hover:text-emerald-600'
                                }`}
                                title={mate.status === 'ACTIVE' ? 'Disable Member' : 'Activate Member'}
                              >
                                {mate.status === 'ACTIVE' ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Delete Member */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(mate)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((mate) => {
              const stats = getAttendanceStats(mate.id);
              const captain = captains.find((c) => c.id === mate.captainId);
              const card = getIDCardForUser(mate.id);

              return (
                <div
                  key={mate.id}
                  className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={mate.name} role="DEV_MATE" size="md" />
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                          {mate.name}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                          {mate.memberId} · {mate.usn}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={mate.status === 'ACTIVE' ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {mate.status}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{mate.branch}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>{mate.semester}</span>
                      <span>
                        Captain: <strong className="text-neutral-800 dark:text-neutral-200">{captain?.name || 'None'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span>Attendance:</span>
                      <span className={`font-bold ${stats.percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {stats.percentage}% ({stats.present}/{stats.total})
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewCardUser(mate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                    >
                      <IdCard className="w-3.5 h-3.5" />
                      <span>View ID Card</span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMember(mate);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(mate)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <MemberModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addMember}
        onUpdate={updateMember}
        initialMember={editingMember}
        captainsList={captains}
      />

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
