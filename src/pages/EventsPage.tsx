import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, CheckCircle2, Clock, CheckSquare, X, Trash2, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/contexts/EventsContext'
import { ClubEvent } from '@/types'

export const EventsPage: React.FC = () => {
  const { isStaff, profile, canCreateEvents, isLoaded } = useAuth()
  const { events, registrations, createEvent, deleteEvent, registerForEvent, cancelRegistration, isLoading } = useEvents()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<ClubEvent | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('MITE Main Auditorium')
  const [startTime, setStartTime] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16))
  const [endTime, setEndTime] = useState(new Date(Date.now() + 97200000).toISOString().slice(0, 16))
  const [capacity, setCapacity] = useState('60')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsCreating(true)

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const res = await createEvent({
      title,
      slug: slug || 'event-' + Date.now(),
      description,
      location,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      status: 'registration_open',
      capacity: parseInt(capacity) || null,
      team_size_min: 1,
      team_size_max: 1,
    })

    if (res.success) {
      setIsModalOpen(false)
      setTitle('')
      setDescription('')
      setFeedback('Event created successfully!')
    } else {
      if (res.error?.includes('403')) {
        setIsModalOpen(false)
        setFeedback('You don\'t have permission to create events.')
      } else {
        setFeedback(res.error || 'Failed to create event.')
      }
    }
    setIsCreating(false)
  }

  const handleRegisterToggle = async (event: ClubEvent) => {
    if (!profile) return
    const isReg = registrations.some(r => r.event_id === event.id && r.user_id === profile.id)
    if (isReg) {
      await cancelRegistration(event.id)
    } else {
      await registerForEvent(event.id)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    const res = await deleteEvent(eventToDelete.id)
    setIsDeleting(false)
    if (res.success) {
      setFeedback(`Event "${eventToDelete.title}" has been deleted.`)
      setEventToDelete(null)
    } else {
      setFeedback(res.error || 'Failed to delete event.')
    }
  }

  return (
    <div className="space-y-8 pb-16">
      <Helmet>
        <title>Events | DevStudio</title>
        <meta name="description" content="Upcoming events, hackathons, and workshops at DevStudio." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/events" />
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-purple" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent-purple font-bold">
              Physical & Virtual
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary font-sans">Club Events & Workshops</h1>
          <p className="text-sm text-text-muted mt-1 font-sans">
            Physical sessions, tech bootcamps, and build sprints hosted on campus at MITE.
          </p>
        </div>
        {isLoaded && canCreateEvents && (
          <Button
            id="create-event-btn"
            onClick={() => setIsModalOpen(true)}
            className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        )}
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl border font-mono flex items-center gap-2 text-xs ${
          feedback.includes('permission') || feedback.includes('Failed')
            ? 'bg-status-destructive/15 border-status-destructive/40 text-status-destructive'
            : 'bg-status-success/15 border-status-success/40 text-status-success'
        }`}>
          {feedback.includes('permission') || feedback.includes('Failed') ? (
            <AlertTriangle className="w-4 h-4 text-status-destructive" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-3xl border border-border-default bg-[#0A0F1D] overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                   <div className="h-6 w-24 rounded bg-border-default animate-pulse" />
                   <div className="h-6 w-16 rounded bg-border-default animate-pulse" />
                </div>
                <div className="h-8 w-3/4 rounded bg-border-default animate-pulse" />
                <div className="h-4 w-full rounded bg-border-default animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-border-default animate-pulse" />
                <div className="pt-4 border-t border-border-default flex gap-3 mt-4">
                   <div className="h-10 w-32 rounded-xl bg-border-default animate-pulse" />
                   <div className="h-10 w-24 rounded-xl bg-border-default animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-2xl">
          <CardContent className="pt-12 pb-12">
            <EmptyState
              icon={Calendar}
              title={canCreateEvents ? "No Events Found" : "No Events Found"}
              description={canCreateEvents 
                ? "There are currently no events published. Once Dev Captains schedule physical sessions, registrations will open here."
                : "No events are scheduled right now. Check back soon, new sessions will appear here."}
              actionLabel={canCreateEvents ? "Create First Event" : undefined}
              onAction={canCreateEvents ? () => setIsModalOpen(true) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isUserRegistered = profile && registrations.some(r => r.event_id === event.id && r.user_id === profile.id)
            const eventRegsCount = registrations.filter(r => r.event_id === event.id).length

            return (
              <Card key={event.id} className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl flex flex-col justify-between hover:border-accent-purple/50 transition-all group overflow-hidden">
                <CardHeader className="pb-4 bg-bg-surface/30 border-b border-border-default">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30 uppercase font-bold tracking-wider">
                        {event.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 bg-[#1A2333] px-2 py-1 rounded border border-border-default">
                        <Users className="w-3.5 h-3.5 text-text-muted" />
                        <span>{eventRegsCount} / {event.capacity || '∞'}</span>
                      </span>
                    </div>

                    {isStaff && (
                      <Button
                        id={`delete-event-btn-${event.id}`}
                        onClick={() => setEventToDelete(event)}
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-lg text-status-destructive hover:text-white hover:bg-status-destructive transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-xl text-text-primary font-black font-sans group-hover:text-accent-purple transition-colors">{event.title}</CardTitle>
                  <p className="text-xs text-text-muted line-clamp-2 mt-2 leading-relaxed font-sans font-medium">
                    {event.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-5 space-y-5">
                  <div className="space-y-2.5 text-xs text-text-primary font-mono bg-bg-surface p-4 rounded-xl border border-border-default">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-accent-purple/10 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-accent-purple" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 uppercase tracking-wider font-bold text-[10px]">
                        <span>{new Date(event.start_time).toISOString().slice(0, 10)}</span>
                        <span className="text-border-default">/</span>
                        <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-accent-teal/10 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-accent-teal" />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {isStaff && (
                      <Button
                        id={`open-attendance-${event.id}`}
                        onClick={() => navigate(`/attendance?eventId=${event.id}`)}
                        variant="outline"
                        className="font-sans text-xs font-bold min-h-[44px] w-full rounded-xl border-border-default hover:bg-bg-page hover:text-accent-primary transition-colors cursor-pointer gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Take Roll Call</span>
                      </Button>
                    )}

                    <Button
                      id={`register-btn-${event.id}`}
                      onClick={() => handleRegisterToggle(event)}
                      variant={isUserRegistered ? "outline" : "default"}
                      className={`font-sans text-xs font-bold min-h-[44px] w-full rounded-xl cursor-pointer ${
                        isUserRegistered
                          ? 'border-border-default hover:bg-status-destructive hover:border-status-destructive hover:text-white transition-colors'
                          : 'bg-[#3B82F6] hover:bg-blue-600 text-on-accent shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all border border-transparent hover:border-white'
                      }`}
                    >
                      {isUserRegistered ? 'Cancel Registration' : 'Register for Event'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Event Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <Calendar className="w-5 h-5 text-accent-purple" />
                 </div>
                <span>Create New Club Event</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Event Title *</label>
                <Input
                  id="event-title-input"
                  required
                  placeholder="e.g. Full-Stack AI & Vibe-Coding Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Description *</label>
                <textarea
                  id="event-desc-input"
                  required
                  rows={3}
                  placeholder="Hands-on session covering agentic engineering..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Location / Room *</label>
                  <Input
                    id="event-loc-input"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Attendee Capacity</label>
                  <Input
                    id="event-cap-input"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Start Date & Time</label>
                  <Input
                    id="event-start-input"
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all font-mono text-xs uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">End Date & Time</label>
                  <Input
                    id="event-end-input"
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  variant="outline"
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  id="submit-create-event-btn"
                  type="submit"
                  disabled={isCreating}
                  className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Publish Event</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Event Deletion Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-status-destructive/40 rounded-3xl w-full max-w-md p-8 shadow-2xl shadow-status-destructive/20 space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-status-destructive/10 rounded-lg">
                   <AlertTriangle className="w-5 h-5 text-status-destructive" />
                 </div>
                <span>Delete Club Event?</span>
              </h3>
              <button
                onClick={() => setEventToDelete(null)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm font-sans font-medium text-text-muted">
              <p className="leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-text-primary">"{eventToDelete.title}"</strong>?
              </p>
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/20 space-y-2">
                <p className="text-status-destructive font-bold font-mono text-[10px] uppercase tracking-wider">This action cannot be undone:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-status-destructive/80 font-medium">
                  <li>The event schedule and details will be deleted</li>
                  <li>All member registrations and RSVPs will be removed</li>
                  <li>All attendance records for this event will be cleared</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
              <Button
                variant="outline"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-event-btn"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="font-sans text-xs font-bold gap-2 min-h-[44px] px-6 rounded-xl bg-status-destructive hover:bg-status-destructive/90 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
