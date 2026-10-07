import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { UserAvatar } from '../components/common/UserAvatar';
import { DigitalIDCard } from '../components/idcard/DigitalIDCard';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Shield,
  Github,
  Linkedin,
  IdCard,
  Edit2,
  Save,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { currentUser, isDevMate } = useAuth();
  const { users, updateMember, getIDCardForUser, getAttendanceStats } = useClubData();
  const { success } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [github, setGithub] = useState(currentUser?.github || '');

  if (!currentUser) return null;

  const card = getIDCardForUser(currentUser.id);
  const stats = getAttendanceStats(currentUser.id);
  const captain = users.find((u) => u.id === currentUser.captainId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(currentUser.id, { phone, bio, github });
    setIsEditing(false);
    success('Profile updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          Member Profile
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Official DevStudio student membership profile at MITE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card & Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-xs">
            {/* Top banner info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800 text-center sm:text-left">
              <UserAvatar name={currentUser.name} role={currentUser.role} size="2xl" showBadge />
              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {currentUser.name}
                  </h3>
                  <Badge variant="success" size="sm" dot>
                    {currentUser.status} Member
                  </Badge>
                </div>
                <p className="text-xs font-mono text-neutral-400">
                  {currentUser.memberId} · USN: {currentUser.usn}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-mono uppercase tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Editable or View Details Form */}
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    GitHub Handle
                  </label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. username"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Bio / Focus
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-neutral-400 block uppercase">College Email</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase">Phone Number</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {currentUser.phone || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-neutral-400 block uppercase">Branch & Semester</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                        {currentUser.branch} ({currentUser.semester})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase">Member Since</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {currentUser.joinedAt}
                      </span>
                    </div>
                  </div>
                </div>

                {captain && (
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3 text-xs">
                    <Shield className="w-4 h-4 text-cyan-500" />
                    <div>
                      <span className="text-[10px] uppercase font-mono text-cyan-600 dark:text-cyan-400 block font-bold">
                        Assigned Mentor / Captain
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        Captain {captain.name} ({captain.memberId} · {captain.branch})
                      </span>
                    </div>
                  </div>
                )}

                {currentUser.bio && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                      Bio & Goals:
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-950/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      {currentUser.bio}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Digital ID Card Preview Column */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-indigo-500" />
              My Official Digital ID
            </h3>
            <Link
              to="/id-cards"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Registry →
            </Link>
          </div>

          {card ? (
            <DigitalIDCard user={currentUser} card={card} compact={true} />
          ) : (
            <p className="text-xs text-neutral-400 py-12">No digital ID card found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
