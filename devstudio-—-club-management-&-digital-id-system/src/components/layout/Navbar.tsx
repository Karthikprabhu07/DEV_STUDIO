import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useClubData } from '../../context/ClubDataContext';
import { DevStudioLogo } from '../common/DevStudioLogo';
import { UserAvatar } from '../common/UserAvatar';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  IdCard,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, pageTitle, onOpenSearch }) => {
  const { currentUser, role, quickLogin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useClubData();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      {/* Zone 1: Mobile toggle & Page Title / Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {pageTitle || 'DevStudio'}
          </h1>
          <p className="text-[11px] text-neutral-400 font-mono -mt-0.5">
            MITE Technical Club Portal
          </p>
        </div>

        <div className="sm:hidden">
          <DevStudioLogo size="sm" showSubtitle={false} />
        </div>
      </div>

      {/* Zone 2: Contextual Search / Quick Switch Pills */}
      <div className="hidden md:flex items-center gap-2">
        <div
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/50 text-neutral-400 text-xs cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors w-56"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Search members, events...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
            ⌘K
          </kbd>
        </div>

        {/* Quick Demo Switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-[11px] font-semibold">
          <button
            onClick={() => quickLogin('ADMIN')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              role === 'ADMIN'
                ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickLogin('CAPTAIN')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              role === 'CAPTAIN'
                ? 'bg-white dark:bg-neutral-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Captain
          </button>
          <button
            onClick={() => quickLogin('DEV_MATE')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              role === 'DEV_MATE'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Dev Mate
          </button>
        </div>
      </div>

      {/* Zone 3: Actions (Theme, Notifications, Profile) */}
      <div className="flex items-center gap-2">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle color theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-neutral-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setNotifOpen(false);
                        }
                      }}
                      className={`py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                        n.read
                          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 opacity-75'
                          : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {n.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        {currentUser && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <UserAvatar name={currentUser.name} role={currentUser.role} size="sm" />
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5 uppercase tracking-wide">
                  {currentUser.memberId}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400 truncate">
                    {currentUser.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {role === 'ADMIN' && <Sparkles className="w-3 h-3 text-amber-500" />}
                    {role === 'CAPTAIN' && <Shield className="w-3 h-3 text-cyan-500" />}
                    <span>{currentUser.role.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/id-cards"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <IdCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Digital ID Card</span>
                  </Link>

                  {role === 'ADMIN' && (
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Club Settings</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 mt-2 pt-2">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
