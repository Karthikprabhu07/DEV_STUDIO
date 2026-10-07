import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Terminal,
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FolderGit2,
  Trophy,
  BookOpen,
  CreditCard,
  Users,
  LogOut,
  LogIn,
  X,
  Bell,
  Check,
  MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { UserAvatar } from '@/components/profile/UserAvatar'

interface LeftNavRailProps {
  onOpenAuth: () => void
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({ onOpenAuth }) => {
  const location = useLocation()
  const { user, profile, isAdmin, signOut } = useAuth()
  const { notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead } = useCommunity()
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Challenges', path: '/challenges', icon: Trophy },
    { label: 'Resources', path: '/resources', icon: BookOpen },
    { label: 'Digital ID', path: '/id-card', icon: CreditCard },
    {
      label: 'Director Console',
      path: '/director',
      icon: Users,
      roleGated: true,
      requiresAdmin: true,
    },
  ]

  const userRole = profile?.role === 'admin'
    ? 'Dev Director'
    : profile?.role === 'organizer'
    ? 'Dev Captain'
    : profile?.role === 'member'
    ? 'Dev Mate'
    : 'Guest'

  const userDevStudioId = profile?.devstudio_id || (profile ? 'DS26-PENDING' : '')
  const userDisplayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Guest')

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between select-none bg-bg-surface">
      {/* Top: logo mark + "DEVSTUDIO" wordmark + "MITE" tag */}
      <div className="p-5 border-b border-border-default">
        <Link
          to="/"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-teal/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary group-hover:border-accent-primary/60 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-text-primary">
                DEVSTUDIO
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
                MITE
              </span>
            </div>
            <span className="text-[11px] text-text-muted font-medium tracking-wide">
              Build. Ship. Learn.
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List with icon + label per item */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
          Platform Menu
        </div>

        {navItems
          .filter((item) => !item.requiresAdmin || isAdmin)
          .map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path) || (item.path === '/members' && location.pathname.startsWith('/director'))

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`nav-menu-item flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group border ${
                  isActive
                    ? 'bg-accent-primary/10 text-white font-semibold border-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'text-text-muted hover:text-white hover:bg-slate-800/50 border-transparent hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-accent-primary'
                        : 'text-text-muted group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.roleGated && (
                  <div className="flex items-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary">
                      Director
                    </span>
                  </div>
                )}
              </Link>
            )
          })}

        {/* Notifications Quick Access */}
        <div className="pt-3 mt-3 border-t border-border-default">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="nav-menu-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-muted hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-text-muted" />
              <span>Notifications</span>
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-teal text-on-accent shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom, pinned: profile chip / sign-in */}
      <div className="p-4 border-t border-border-default bg-bg-surface space-y-2">
        {profile ? (
          <>
            <Link
              to="/profile"
              id="desktop-profile-chip"
              aria-label={`View profile for ${userDisplayName}`}
              className="group block p-3 rounded-xl bg-bg-surface border border-border-default hover:border-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white shadow-sm cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    profile={profile}
                    className="w-9 h-9 rounded-lg border border-border-default text-xs font-mono font-bold text-text-primary"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-bg-surface" />
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate tracking-tight group-hover:text-accent-primary transition-colors">
                    {userDisplayName}
                  </div>

                  {/* DevStudio ID in Plex Mono below the name */}
                  <div className="font-plex font-mono text-[11px] text-accent-primary tracking-wider mt-0.5">
                    {userDevStudioId}
                  </div>

                  {/* Role pill */}
                  <div className="mt-1.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-border-default bg-bg-surface text-text-muted">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Sign Out control */}
            <div className="flex items-center justify-between px-1 pt-1">
              <button
                id="rail-signout-btn"
                onClick={signOut}
                className="text-xs text-text-muted font-bold hover:text-status-destructive hover:bg-status-destructive/10 font-sans transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-destructive/50 rounded-lg px-3 py-1.5 cursor-pointer border border-transparent"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            id="rail-signin-btn"
            className="w-full text-left group block p-3 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent font-bold border border-transparent hover:border-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-md shadow-accent-teal/20 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg-page/20 flex items-center justify-center text-bg-page">
                <LogIn className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-bg-page truncate font-sans uppercase tracking-wider">
                  Guest Visitor
                </div>
                <div className="font-sans text-[11px] text-bg-page/90 mt-0.5 font-bold">
                  Sign in / Join →
                </div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Notifications Drawer */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center md:justify-start md:left-64 p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-80 sm:w-96 rounded-2xl bg-bg-surface border border-border-default shadow-2xl overflow-hidden mt-16 animate-in fade-in">
            <div className="p-3.5 bg-bg-surface border-b border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-text-primary">Notifications</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-bg-surface text-accent-primary border border-border-default">
                  {unreadNotificationsCount} unread
                </span>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-mono text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border-default p-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-text-muted">
                  No notifications yet. Notifications are triggered by verified club activity.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      !n.read_at
                        ? 'bg-accent-primary/5 border border-accent-primary/20 text-text-primary'
                        : 'text-text-muted hover:bg-bg-surface/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-text-primary">{n.title}</span>
                      {!n.read_at && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-normal">{n.message}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mt-2">
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => {
                            setIsNotifOpen(false)
                          }}
                          className="text-accent-primary hover:underline"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 border-r border-border-default bg-bg-surface z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-bg-surface/95 border-b border-border-default backdrop-blur-md">
        <Link to="/" onClick={() => setIsMoreSheetOpen(false)} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border-default flex items-center justify-center text-accent-primary">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-text-primary font-mono">DEVSTUDIO</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">MITE</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-lg bg-bg-surface border border-border-default text-text-muted hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/95 backdrop-blur-md border-t border-border-default pb-[max(env(safe-area-inset-bottom),0.5rem)] select-none shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      >
        <div className="grid grid-cols-5 h-14 items-center px-1">
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => setIsMoreSheetOpen(false)}
            id="tab-mobile-home"
            className={`flex flex-col items-center justify-center py-1 gap-1 min-h-[44px] transition-colors ${
              location.pathname === '/' ? 'text-accent-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">Home</span>
          </Link>

          {/* 2. Attendance (Permanent Tab) */}
          <Link
            to="/attendance"
            onClick={() => setIsMoreSheetOpen(false)}
            id="tab-mobile-attendance"
            className={`flex flex-col items-center justify-center py-1 gap-1 min-h-[44px] transition-colors ${
              location.pathname.startsWith('/attendance') ? 'text-accent-teal' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">Attend</span>
          </Link>

          {/* 3. Events */}
          <Link
            to="/events"
            onClick={() => setIsMoreSheetOpen(false)}
            id="tab-mobile-events"
            className={`flex flex-col items-center justify-center py-1 gap-1 min-h-[44px] transition-colors ${
              location.pathname.startsWith('/events') ? 'text-accent-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">Events</span>
          </Link>

          {/* 4. Projects */}
          <Link
            to="/projects"
            onClick={() => setIsMoreSheetOpen(false)}
            id="tab-mobile-projects"
            className={`flex flex-col items-center justify-center py-1 gap-1 min-h-[44px] transition-colors ${
              location.pathname.startsWith('/projects') ? 'text-accent-purple' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">Projects</span>
          </Link>

          {/* 5. More */}
          <button
            type="button"
            id="tab-mobile-more"
            onClick={() => setIsMoreSheetOpen(!isMoreSheetOpen)}
            className={`flex flex-col items-center justify-center py-1 gap-1 min-h-[44px] transition-colors ${
              isMoreSheetOpen ||
              ['/challenges', '/resources', '/id-card', '/members', '/profile'].some((p) =>
                location.pathname.startsWith(p)
              )
                ? 'text-accent-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Full-Height Bottom Sheet for "More" */}
      {isMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMoreSheetOpen(false)}
          />
          <div className="relative w-full max-h-[90vh] bg-bg-surface border-t border-border-default rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pb-[max(env(safe-area-inset-bottom),1.5rem)] animate-in slide-in-from-bottom duration-300">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-border-default rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

            <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
                Platform Navigation & Services
              </span>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Chip Header in Sheet */}
            {profile ? (
              <Link
                to="/profile"
                id="mobile-profile-chip"
                onClick={() => setIsMoreSheetOpen(false)}
                aria-label={`View profile for ${userDisplayName}`}
                className="group mx-4 mt-3 p-3.5 rounded-2xl bg-bg-surface border border-border-default flex items-center gap-3.5 min-h-[44px] hover:bg-bg-surface/80 active:bg-bg-surface/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    profile={profile}
                    className="w-11 h-11 rounded-xl border border-border-default text-sm font-mono font-bold text-text-primary"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-bg-surface" />
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate group-hover:text-accent-primary transition-colors">
                    {userDisplayName}
                  </div>
                  <div className="text-xs font-plex font-mono text-accent-primary mt-0.5">
                    {userDevStudioId}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono border border-border-default bg-bg-surface text-text-muted">
                      {userRole}
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsMoreSheetOpen(false)
                  onOpenAuth()
                }}
                id="mobile-profile-chip-guest"
                className="mx-4 mt-3 p-3.5 rounded-2xl bg-[#3B82F6] hover:bg-blue-600 text-on-accent font-semibold border border-transparent hover:border-white flex items-center gap-3.5 min-h-[44px] text-left transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">
                    Guest Visitor
                  </div>
                  <div className="text-xs text-white/90 mt-0.5 font-medium font-sans">
                    Sign in with MITE Email →
                  </div>
                </div>
              </button>
            )}

            {/* Sheet Nav Links */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 font-sans text-xs">
              <Link
                to="/challenges"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-transparent hover:border-white hover:bg-slate-800/50 text-text-muted hover:text-white min-h-[48px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-accent-purple" />
                  <span className="font-medium">Challenges</span>
                </div>
                <span className="text-text-muted text-[11px]">Active Sprints →</span>
              </Link>

              <Link
                to="/resources"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-transparent hover:border-white hover:bg-slate-800/50 text-text-muted hover:text-white min-h-[48px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-accent-primary" />
                  <span className="font-medium">Resources</span>
                </div>
                <span className="text-text-muted text-[11px]">Guides & Tools →</span>
              </Link>

              <Link
                to="/id-card"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-transparent hover:border-white hover:bg-slate-800/50 text-text-muted hover:text-white min-h-[48px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-accent-primary" />
                  <span className="font-medium">Digital ID</span>
                </div>
                <span className="text-text-muted text-[11px]">Verified Pass →</span>
              </Link>

              {/* Role-Gated Director Console: strictly for admin only */}
              {isAdmin && (
                <Link
                  to="/director"
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-transparent hover:border-white hover:bg-slate-800/50 text-text-muted hover:text-white min-h-[48px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-accent-primary" />
                    <span className="font-medium">Director Console</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary">
                    Director
                  </span>
                </Link>
              )}

              {/* Sign Out / Sign In */}
              <div className="pt-3 border-t border-border-default">
                {profile ? (
                  <button
                    onClick={() => {
                      setIsMoreSheetOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-on-accent font-semibold border border-transparent hover:border-white text-xs min-h-[48px] shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMoreSheetOpen(false)
                      onOpenAuth()
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-on-accent font-semibold border border-transparent hover:border-white text-xs min-h-[48px] shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with MITE Email</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
