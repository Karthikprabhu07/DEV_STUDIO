import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Terminal,
  Calendar,
  CheckSquare,
  FolderGit2,
  Trophy,
  BookOpen,
  CreditCard,
  LogIn,
  UserCheck,
  Shield,
  User,
  Bell,
  Check,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { RoleBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMembershipStatus } from '@/lib/utils'

interface NavbarProps {
  onOpenAuth: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { profile, isAdmin, signOut } = useAuth()
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCommunity()
  const location = useLocation()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const effectiveIsAdmin = isAdmin

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: Terminal },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Attendance', path: '/attendance', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Challenges', path: '/challenges', icon: Trophy },
    { label: 'Resources', path: '/resources', icon: BookOpen },
    { label: 'Digital ID', path: '/id-card', icon: CreditCard },
    { label: 'Profile', path: '/profile', icon: User },
    ...(effectiveIsAdmin ? [{ label: 'Director Console', path: '/director', icon: Shield }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-default bg-bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default flex items-center justify-center text-accent-teal group-hover:border-accent-teal/50 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-wider text-text-primary font-mono">DEVSTUDIO</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-teal/10 text-accent-teal border border-accent-teal/30">MITE</span>
                </div>
                <span className="text-[10px] text-text-muted font-mono tracking-wider">BUILD. SHIP. LEARN.</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-bg-surface text-accent-teal border border-accent-teal/30'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Auth Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            {profile && (
              <div className="relative" ref={notifRef}>
                <button
                  id="notifications-bell-btn"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-lg bg-bg-surface border border-border-default hover:border-border-default text-text-muted hover:text-text-primary transition-all"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-teal text-[10px] font-mono font-bold text-on-accent flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-bg-surface border border-border-default shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3.5 bg-bg-surface border-b border-border-default flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-text-primary">Notifications</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-bg-surface text-accent-teal border border-border-default">
                          {unreadNotificationsCount} unread
                        </span>
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[10px] font-mono text-text-muted hover:text-accent-teal transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
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
                                ? 'bg-accent-teal/5 border border-accent-teal/20 text-text-primary'
                                : 'text-text-muted hover:bg-bg-surface/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-text-primary">
                                {n.title}
                              </span>
                              {!n.read_at && (
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 leading-normal">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mt-2">
                              <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={() => setIsNotifOpen(false)}
                                  className="text-accent-teal hover:underline"
                                >
                                  View Details →
                                </Link>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Role Pill */}
                <RoleBadge role={effectiveIsAdmin ? 'admin' : (profile?.role || 'member')} />

                {/* Status Indicator */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-text-primary">
                    {profile?.full_name || profile?.email}
                  </span>
                  <span className={`text-[10px] font-mono ${
                    effectiveIsAdmin || profile?.membership_status === 'active'
                      ? 'text-status-success'
                      : 'text-status-pending'
                  }`}>
                    {effectiveIsAdmin ? 'Dev Director (Active)' : formatMembershipStatus(profile?.membership_status || 'pending')}
                  </span>
                </div>

                <Link
                  to="/profile"
                  id="nav-profile-btn"
                  className="w-8 h-8 rounded-lg border border-border-default bg-bg-surface flex items-center justify-center text-xs font-mono text-accent-teal hover:border-accent-teal transition-colors"
                  title="View Profile"
                >
                  <User className="w-4 h-4" />
                </Link>

                <Button
                  id="nav-signout-btn"
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-xs font-mono text-text-muted hover:text-status-destructive"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  id="nav-signin-btn"
                  variant="outline"
                  size="sm"
                  onClick={onOpenAuth}
                  className="gap-2 text-xs font-mono"
                >
                  <LogIn className="w-3.5 h-3.5 text-accent-teal" />
                  <span>Sign In</span>
                </Button>

                <Button
                  id="nav-join-btn"
                  variant="default"
                  size="sm"
                  onClick={onOpenAuth}
                  className="gap-2 text-xs font-mono bg-accent-teal hover:bg-accent-teal/90 text-on-accent font-bold"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Join Club</span>
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
