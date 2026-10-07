import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { ClubEvent } from '../types';
import { CreateEventModal } from '../components/events/CreateEventModal';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { currentUser, isAdmin, isCaptain } = useAuth();
  const { events, addEvent, rsvpEvent, deleteEvent } = useClubData();
  const { success } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [rsvpdEvents, setRsvpdEvents] = useState<string[]>([]);

  if (!currentUser) return null;

  const handleRSVP = (eventId: string, title: string) => {
    if (rsvpdEvents.includes(eventId)) {
      success(`You are already registered for ${title}.`);
      return;
    }
    rsvpEvent(eventId);
    setRsvpdEvents((prev) => [...prev, eventId]);
    success(`Registered for "${title}"! See you at MITE Innovation Hub.`);
  };

  const handleDelete = (eventId: string, title: string) => {
    if (window.confirm(`Delete event "${title}"?`)) {
      deleteEvent(eventId);
      success('Event removed.');
    }
  };

  const filtered = filterCategory === 'ALL'
    ? events
    : events.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              Events & Sprints
            </h2>
            <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Workshops, hackathons, guest tech talks, and the DevStudio Mini Website Challenge.
          </p>
        </div>

        {(isAdmin || isCaptain) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'WORKSHOP', 'HACKATHON', 'CHALLENGE', 'TECH_TALK', 'MEETUP'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
            }`}
          >
            {cat === 'ALL' ? 'All Events' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((evt) => {
          const isRegistered = rsvpdEvents.includes(evt.id);
          const isFull = evt.maxParticipants ? evt.participantsCount >= evt.maxParticipants : false;

          return (
            <div
              key={evt.id}
              className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {evt.category.replace('_', ' ')}
                  </span>
                  <Badge variant={evt.status === 'UPCOMING' ? 'success' : 'default'} size="sm">
                    {evt.status}
                  </Badge>
                </div>

                <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug">
                  {evt.title}
                </h3>
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3">
                  {evt.description}
                </p>

                {/* Details List */}
                <div className="mt-4 space-y-2 text-xs font-mono text-neutral-600 dark:text-neutral-300 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-neutral-900 dark:text-neutral-100 font-bold">
                      {evt.participantsCount}
                    </strong>
                    {evt.maxParticipants ? ` / ${evt.maxParticipants}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(evt.id, evt.title)}
                      className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {evt.status === 'UPCOMING' && (
                    <button
                      onClick={() => handleRSVP(evt.id, evt.title)}
                      disabled={isRegistered || isFull}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isRegistered
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isRegistered ? 'Registered ✓' : isFull ? 'Event Full' : 'RSVP Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={addEvent}
        creatorId={currentUser.id}
      />
    </div>
  );
};
