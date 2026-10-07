import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { CreateAnnouncementModal } from '../components/announcements/CreateAnnouncementModal';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { Bell, Plus, Pin, Trash2, Calendar, UserCheck } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser, isAdmin, isCaptain } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useClubData();
  const { success } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  if (!currentUser) return null;

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete announcement "${title}"?`)) {
      deleteAnnouncement(id);
      success('Announcement removed.');
    }
  };

  const filtered = priorityFilter === 'ALL'
    ? announcements
    : announcements.filter((a) => a.priority === priorityFilter);

  // Pinned first, then sorted by date
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              DevStudio Announcements
            </h2>
            <span className="p-1 rounded-full bg-amber-500/10 text-amber-500">
              <Bell className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Official club notices, hackathon alerts, and developer updates from Directors and Captains.
          </p>
        </div>

        {(isAdmin || isCaptain) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['ALL', 'URGENT', 'IMPORTANT', 'NORMAL'].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              priorityFilter === p
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            {p === 'ALL' ? 'All Broadcasts' : p}
          </button>
        ))}
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {sorted.map((ann) => {
          const priorityBadges = {
            URGENT: 'danger',
            IMPORTANT: 'warning',
            NORMAL: 'info',
          } as const;

          return (
            <div
              key={ann.id}
              className={`p-5 rounded-2xl bg-white dark:bg-neutral-900 border transition-all ${
                ann.isPinned
                  ? 'border-indigo-500/50 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
                        <Pin className="w-3 h-3 rotate-45" /> Pinned
                      </span>
                    )}
                    <Badge variant={priorityBadges[ann.priority] || 'default'} size="sm">
                      {ann.priority}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                    {ann.title}
                  </h3>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {ann.description}
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-400 font-mono gap-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    Posted by <strong className="text-neutral-800 dark:text-neutral-200">{ann.authorName}</strong> ({ann.authorRole.replace('_', ' ')})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateAnnouncementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={addAnnouncement}
        authorName={currentUser.name}
        authorRole={currentUser.role}
        authorId={currentUser.id}
      />
    </div>
  );
};
