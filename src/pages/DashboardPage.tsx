import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Calendar,
  FolderGit2,
  Bell,
  Users,
  Activity,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Cpu,
  Plus,
  Pin,
  X,
  Terminal,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/contexts/EventsContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/ui/badge'
import { AnnouncementCategory, AnnouncementPriority } from '@/types'

interface DashboardPageProps {
  onOpenAuth: () => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAuth }) => {
  const { profile, isStaff, isAdmin, members, canCreateEvents, isLoaded } = useAuth()
  const { events, attendanceRecords, isLoading: isLoadingEvents } = useEvents()
  const { projects, announcements, createAnnouncement, deleteAnnouncement, isLoading: isLoadingCommunity } = useCommunity()
  const isLoading = isLoadingEvents || isLoadingCommunity

  // New Announcement Modal state
  const [isNewAnnounceOpen, setIsNewAnnounceOpen] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annCategory, setAnnCategory] = useState<AnnouncementCategory>('general')
  const [annPriority, setAnnPriority] = useState<AnnouncementPriority>('normal')
  const [annPinned, setAnnPinned] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [announceError, setAnnounceError] = useState<string | null>(null)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // STRICT ZERO-SEED DATA RULE:
  // Actual database counts start at zero and dynamically compute from real records (Dev Mates only)
  const activeMembersCount = members.filter(
    (m) => m.membership_status === 'active' && m.role === 'member'
  ).length
  const activeProjects = projects.filter((p) => p.status === 'active')
  const activeProjectsCount = activeProjects.length
  const upcomingEvents = events.filter(
    (e) => e.status === 'published' || e.status === 'registration_open'
  )
  const upcomingEventsCount = upcomingEvents.length

  const totalAttendanceRecords = attendanceRecords.length
  const totalPresentRecords = attendanceRecords.filter((r) => r.status === 'present').length
  const attendanceRate =
    totalAttendanceRecords > 0
      ? `${Math.round((totalPresentRecords / totalAttendanceRecords) * 100)}%`
      : '0%'

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) {
      setAnnounceError('Title and content are required.')
      return
    }

    setIsBroadcasting(true)
    setAnnounceError(null)

    const res = await createAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      category: annCategory,
      priority: annPriority,
      is_pinned: annPinned,
    })

    setIsBroadcasting(false)
    if (res.success) {
      setIsNewAnnounceOpen(false)
      setAnnTitle('')
      setAnnContent('')
      setAnnPinned(false)
    } else {
      setAnnounceError(res.error || 'Failed to broadcast announcement.')
    }
  }

  // Sorted announcements: pinned first, then newest
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  const handleDeleteBroadcast = async (id: string) => {
    setIsDeleting(true)
    setAnnounceError(null)
    const res = await deleteAnnouncement(id)
    setIsDeleting(false)
    if (res.success) {
      setDeleteConfirmId(null)
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
    } else {
      setAnnounceError(res.error || 'Failed to delete broadcast.')
    }
  }

  return (
    <div className="space-y-8 pb-16">
      <Helmet>
        <title>Dashboard | DevStudio</title>
        <meta name="description" content="Welcome to DevStudio, the official technology club platform of MITE." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/" />
      </Helmet>

      {/* Top Header Bar with Role Cluster */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-default">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-text-primary font-sans">Platform Dashboard</h2>
          <p className="text-sm text-text-muted mt-1 font-sans">
            Live MITE engineering metrics, active cohorts, and community software repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Top-right role cluster */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-surface border border-border-default min-w-[280px] justify-between shadow-sm">
            <span className="text-sm font-bold text-text-primary tracking-tight truncate max-w-[130px] font-sans">
              {profile ? profile.full_name : 'Guest Visitor'}
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                profile?.role === 'admin'
                  ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30'
                  : profile?.role === 'organizer'
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                  : profile?.role === 'member'
                  ? 'bg-[#1A2333] text-slate-300 border border-slate-700'
                  : 'bg-[#1A2333]/80 text-slate-400 border border-slate-700/80'
              }`}>
                {profile?.role === 'admin'
                  ? 'DEV DIRECTOR'
                  : profile?.role === 'organizer'
                  ? 'DEV CAPTAIN'
                  : profile?.role === 'member'
                  ? 'DEV MATE'
                  : 'GUEST'}
              </span>
              <span className={`text-[10px] font-bold tracking-wider font-mono uppercase flex items-center gap-1.5 ${
                profile?.membership_status === 'active'
                  ? 'text-status-success'
                  : profile
                  ? 'text-status-pending'
                  : 'text-text-muted'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  profile?.membership_status === 'active'
                    ? 'bg-status-success animate-pulse'
                    : profile
                    ? 'bg-status-pending'
                    : 'bg-slate-500'
                }`} />
                {profile?.membership_status === 'active'
                  ? 'ACTIVE'
                  : profile
                  ? 'PENDING'
                  : 'UNAUTH'}
              </span>
            </div>
          </div>

          {/* Open Profile Button */}
          {profile && (
            <Link to="/profile">
              <Button
                id="header-open-profile-btn"
                className="font-sans text-xs font-bold bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[44px] px-4 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
              >
                Open Profile
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border-default bg-[#0A0F1D] p-8 md:p-12 shadow-2xl mt-4">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-bg-surface border border-border-default text-xs font-sans mb-6 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
            <span className="font-bold text-text-primary">MITE Student Technology Club</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-muted font-mono uppercase tracking-wider text-[10px]">Mangalore</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4 font-sans leading-tight">
            Build. Ship. <span className="text-accent-teal">Learn.</span>
          </h1>

          <p className="text-sm sm:text-base text-text-muted mb-8 leading-relaxed font-sans max-w-2xl font-medium">
            DevStudio is the premier engineering club at Mangalore Institute of Technology & Engineering, dedicated to full-stack software development, production-grade cloud systems, and modern AI-accelerated developer workflows.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-xs text-text-primary flex items-center gap-2 font-sans font-bold">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="uppercase tracking-wider text-[10px]">Human Creativity + AI Assistance + Engineering Judgment</span>
            </div>

            {!profile && (
              <Button
                id="hero-apply-btn"
                onClick={onOpenAuth}
                className="font-sans text-xs font-bold bg-accent-teal hover:bg-accent-teal/90 w-full sm:w-auto text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white gap-2"
              >
                <span>Apply to join DevStudio</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Account Status Notice if Pending */}
      {profile && profile.membership_status === 'pending' && (
        <div id="pending-status-banner" className="rounded-xl border border-status-pending/30 bg-status-pending/10 p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-status-pending flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-status-pending font-sans uppercase tracking-wider">Membership Application Status: PENDING REVIEW</h3>
              <RoleBadge role={profile.role} />
            </div>
            <p className="text-xs text-text-muted mt-2 leading-relaxed font-sans font-medium">
              Your institutional email (<code className="font-mono text-text-primary bg-bg-surface px-1.5 py-0.5 rounded">{profile.email}</code>) is verified. DevStudio membership requires approval by a Dev Director or Dev Captain before full access is granted.
            </p>
          </div>
        </div>
      )}

      {/* Live System Metrics (Zero Seed Data) */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-[#0A0F1D] border-border-default shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-3 w-16 bg-border-default rounded animate-pulse" />
                   <div className="w-10 h-10 rounded-xl bg-border-default animate-pulse" />
                </div>
                <div className="h-10 w-12 bg-border-default rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-border-default rounded mt-3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0A0F1D] border-border-default shadow-xl rounded-3xl overflow-hidden hover:border-accent-primary/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-text-muted mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Dev Mates</span>
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-sans">
              {activeMembersCount}
            </div>
            <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">
              {activeMembersCount > 0 ? 'Verified Members' : 'No Active Members'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0F1D] border-border-default shadow-xl rounded-3xl overflow-hidden hover:border-accent-teal/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-text-muted mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Active Projects</span>
              <div className="w-10 h-10 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal group-hover:bg-accent-teal/20 transition-colors">
                <FolderGit2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-sans">
              {activeProjectsCount}
            </div>
            <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">
              {activeProjectsCount > 0 ? 'Community Repos' : 'No Projects Launched'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0F1D] border-border-default shadow-xl rounded-3xl overflow-hidden hover:border-accent-purple/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-text-muted mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Upcoming Events</span>
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple group-hover:bg-accent-purple/20 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-sans">
              {upcomingEventsCount}
            </div>
            <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">
              {upcomingEventsCount > 0 ? 'Workshops & Meets' : 'No Events Scheduled'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0F1D] border-border-default shadow-xl rounded-3xl overflow-hidden hover:border-status-success/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-text-muted mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Attendance Avg</span>
              <div className="w-10 h-10 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success group-hover:bg-status-success/20 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-sans">
              {attendanceRate}
            </div>
            <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">
              {totalAttendanceRecords > 0 ? 'Verified Cohort Avg' : 'No Sessions Yet'}
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Events & Projects Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <Card className="bg-[#0A0F1D] border-border-default shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-5 border-b border-border-default bg-bg-surface/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <Calendar className="w-5 h-5 text-accent-purple" />
                 </div>
                 <div>
                   <CardTitle className="text-lg font-black text-text-primary font-sans">
                     Upcoming Club Events
                   </CardTitle>
                   <p className="text-xs text-text-muted mt-0.5 font-sans">Physical meetups, workshops, and build sprints</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                {isLoaded && canCreateEvents && (
                  <Link to="/events">
                    <Button
                      id="dashboard-create-event-btn"
                      className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-4 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create</span>
                    </Button>
                  </Link>
                )}
                <Link to="/events">
                  <Button variant="outline" className="font-sans text-xs font-bold min-h-[44px] px-4 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingEvents ? (
                <div className="divide-y divide-border-default">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-6 flex justify-between gap-4">
                      <div className="space-y-3 w-full max-w-sm">
                        <div className="h-5 w-3/4 bg-border-default rounded animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-6 w-24 bg-border-default rounded animate-pulse" />
                          <div className="h-6 w-24 bg-border-default rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-11 w-24 bg-border-default rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={Calendar}
                    title="No Events Scheduled"
                    description="Upcoming technical sessions, hackathons, and demo days will appear here once scheduled by Dev Captains."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border-default">
                  {upcomingEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg-page/50 transition-colors">
                      <div>
                        <h4 className="font-sans text-base font-black text-text-primary">{ev.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono mt-2 text-text-muted uppercase tracking-wider">
                          <span className="px-2 py-1 rounded-md bg-[#1A2333] border border-border-default text-text-primary font-bold">
                            {new Date(ev.start_time).toISOString().slice(0, 10)}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-[#1A2333] border border-border-default text-text-primary font-bold">
                            {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                          <span className="text-border-default">/</span>
                          <span className="font-bold">{ev.location}</span>
                        </div>
                      </div>
                      <Link to="/events">
                        <Button variant="outline" className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer w-full sm:w-auto">
                          Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="bg-[#0A0F1D] border-border-default shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-5 border-b border-border-default bg-bg-surface/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent-teal/10 rounded-lg">
                   <FolderGit2 className="w-5 h-5 text-accent-teal" />
                 </div>
                 <div>
                   <CardTitle className="text-lg font-black text-text-primary font-sans">
                     Active Club Projects
                   </CardTitle>
                   <p className="text-xs text-text-muted mt-0.5 font-sans">Open-source software engineered by Dev Mates</p>
                 </div>
              </div>
              <Link to="/projects">
                <Button variant="outline" className="font-sans text-xs font-bold min-h-[44px] px-4 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer">
                  All Projects
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingCommunity ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-5 rounded-2xl bg-bg-surface border border-border-default h-[160px] flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="h-4 w-3/4 bg-border-default rounded animate-pulse" />
                        <div className="h-3 w-full bg-border-default rounded animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-border-default rounded animate-pulse" />
                        <div className="h-5 w-16 bg-border-default rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeProjects.length === 0 ? (
                <EmptyState
                  icon={FolderGit2}
                  title="No Active Projects Found"
                  description="DevStudio projects will be listed here as teams initialize repositories and start shipping software."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeProjects.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-bg-surface border border-border-default hover:border-accent-teal/50 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <h4 className="font-sans text-sm font-black text-text-primary group-hover:text-accent-teal transition-colors">{p.title}</h4>
                        <p className="text-xs text-text-muted line-clamp-2 mt-2 font-sans leading-relaxed font-medium">{p.description}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {p.tech_stack.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-1 rounded bg-[#1A2333] border border-border-default text-[10px] font-mono uppercase tracking-wider text-accent-teal font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-border-default flex items-center justify-end">
                        <Link to="/projects">
                          <Button variant="ghost" className="font-sans text-xs font-bold min-h-[36px] px-4 rounded-lg text-accent-teal hover:bg-accent-teal/10 hover:text-accent-teal cursor-pointer">
                            Workspace →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements & Notice Board */}
        <div className="space-y-6">
          <Card className="bg-[#0A0F1D] border-border-default shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-5 border-b border-border-default bg-bg-surface/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <Bell className="w-5 h-5 text-accent-primary" />
                 </div>
                 <div>
                   <CardTitle className="text-lg font-black text-text-primary font-sans">
                     Notice Board
                   </CardTitle>
                   <p className="text-xs text-text-muted mt-0.5 font-sans">Official broadcasts from Dev Directors</p>
                 </div>
              </div>
              {isStaff && (
                <Button
                  onClick={() => setIsNewAnnounceOpen(true)}
                  className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-4 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Broadcast</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCommunity ? (
                <div className="divide-y divide-border-default">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-6">
                      <div className="flex justify-between mb-3">
                        <div className="h-5 w-1/2 bg-border-default rounded animate-pulse" />
                        <div className="h-5 w-16 bg-border-default rounded animate-pulse" />
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-3 w-full bg-border-default rounded animate-pulse" />
                        <div className="h-3 w-5/6 bg-border-default rounded animate-pulse" />
                      </div>
                      <div className="flex justify-between border-t border-border-default pt-4">
                        <div className="h-3 w-20 bg-border-default rounded animate-pulse" />
                        <div className="h-3 w-20 bg-border-default rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedAnnouncements.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={Bell}
                    title="Notice Board Clear"
                    description="No announcements have been published yet. Check back for official club updates."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border-default">
                  {sortedAnnouncements.slice(0, 5).map((ann) => (
                    <div
                      key={ann.id}
                      className={`p-6 transition-all ${
                        ann.priority === 'urgent'
                          ? 'bg-status-destructive/10 text-status-destructive'
                          : ann.is_pinned
                          ? 'bg-accent-primary/5 text-text-primary'
                          : 'bg-transparent text-text-muted hover:bg-bg-page/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {ann.is_pinned && <Pin className="w-4 h-4 text-accent-primary" />}
                          <span className="font-sans font-black text-sm text-text-primary">
                            {ann.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider font-mono ${
                              ann.priority === 'urgent'
                                ? 'bg-status-destructive/20 text-status-destructive border border-status-destructive/30'
                                : ann.priority === 'high'
                                ? 'bg-accent-amber/20 text-amber-400 border border-amber-500/30'
                                : 'bg-bg-surface text-text-muted border border-border-default'
                            }`}
                          >
                            {ann.priority}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmId(ann.id)
                                setAnnounceError(null)
                              }}
                              className="text-text-muted hover:text-status-destructive p-1 rounded-md hover:bg-status-destructive/10 transition-colors"
                              title="Delete broadcast"
                              aria-label="Delete broadcast"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs line-clamp-3 leading-relaxed font-sans font-medium ${
                         ann.priority === 'urgent' ? 'text-status-destructive/80' : 'text-text-muted'
                      }`}>
                        {ann.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mt-4 pt-4 border-t border-border-default uppercase tracking-wider">
                        <span className="font-bold">{ann.category}</span>
                        <span className="font-bold">{new Date(ann.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Institutional Compliance Card */}
          <Card className="border-border-default bg-bg-surface rounded-3xl shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-primary" />
                <span>Security & Policy Standard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-muted space-y-3 font-mono">
              <div className="flex items-center justify-between py-2 border-b border-border-default">
                <span className="uppercase tracking-wider">Domain Filter</span>
                <span className="text-status-success font-bold">@mite.ac.in ENFORCED</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-default">
                <span className="uppercase tracking-wider">Role Access</span>
                <span className="text-accent-primary font-bold">RLS & WEBHOOKS</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="uppercase tracking-wider">Identity</span>
                <span className="text-text-primary font-bold bg-[#1A2333] px-2 py-1 rounded">DS26-XXXX</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      
      {/* Secondary CTA */}
      {!profile && (
        <div className="mt-12 p-8 md:p-12 rounded-3xl border border-border-default bg-[#0A0F1D] shadow-xl text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal shadow-inner mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black font-sans text-white">Ready to start building?</h2>
          <p className="text-sm text-text-muted max-w-md font-sans font-medium leading-relaxed">
            Join DevStudio to access exclusive resources, participate in real-world projects, and accelerate your engineering career.
          </p>
          <Button
            onClick={onOpenAuth}
            className="mt-4 font-sans text-sm font-bold bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[48px] px-8 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white gap-2"
          >
            <span>Apply to join DevStudio</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {isNewAnnounceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <Bell className="w-5 h-5 text-accent-primary" />
                 </div>
                <span>Broadcast Official Notice</span>
              </h3>
              <button
                onClick={() => setIsNewAnnounceOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {announceError && (
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/30 text-xs text-status-destructive font-sans font-bold">
                {announceError}
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Sprint Briefing in Lab 304"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as AnnouncementCategory)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  >
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as AnnouncementPriority)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Broadcast Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Official statement or operational instructions..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-surface border border-border-default cursor-pointer hover:border-accent-primary/50 transition-colors" onClick={() => setAnnPinned(!annPinned)}>
                <input
                  type="checkbox"
                  id="pin-ann-checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="rounded border-border-default bg-bg-page text-accent-primary focus:ring-0 w-4 h-4 pointer-events-none"
                />
                <label htmlFor="pin-ann-checkbox" className="text-xs text-text-primary font-bold pointer-events-none">
                  Pin to top of notice board
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  onClick={() => setIsNewAnnounceOpen(false)}
                  variant="outline"
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBroadcasting}
                  className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  {isBroadcasting ? 'Publishing...' : 'Broadcast Notice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Broadcast Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-black font-sans text-text-primary">Delete this broadcast?</h3>
            <p className="text-sm font-sans text-text-muted">
              This will remove it for all members and cannot be undone.
            </p>
            {announceError && (
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/30 text-xs text-status-destructive font-sans font-bold">
                {announceError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteConfirmId(null)
                  setAnnounceError(null)
                }}
                disabled={isDeleting}
                className="font-sans text-xs font-bold text-text-muted hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteBroadcast(deleteConfirmId)}
                disabled={isDeleting}
                className="font-sans text-xs font-bold bg-status-destructive hover:bg-status-destructive/90 text-white shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-status-success text-black px-6 py-3 rounded-full text-sm font-bold font-sans shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span>Broadcast deleted</span>
        </div>
      )}
    </div>
  )
}
