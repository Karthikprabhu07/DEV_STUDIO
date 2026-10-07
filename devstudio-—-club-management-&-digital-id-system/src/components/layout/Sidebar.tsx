import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DevStudioLogo } from '../common/DevStudioLogo';
import {
  LayoutDashboard,
  Users,
  Award,
  CalendarDays,
  Bell,
  CheckSquare,
  IdCard,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav links tailored to current role
  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'All Dev Mates', path: '/members', icon: Users },
        { label: 'Captains', path: '/captains', icon: Shield },
        { label: 'Attendance', path: '/attendance', icon: CheckSquare },
        { label: 'Events & Meetups', path: '/events', icon: CalendarDays },
        { label: 'Announcements', path: '/announcements', icon: Bell },
        { label: 'Tasks & Projects', path: '/tasks', icon: Award },
        { label: 'Digital ID Cards', path: '/id-cards', icon: IdCard },
        { label: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
        { label: 'Activity Feed', path: '/activity', icon: Activity },
        { label: 'Club Settings', path: '/settings', icon: Settings },
      ];
    }

    if (role === 'CAPTAIN') {
      return [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'My Dev Mates', path: '/members', icon: Users },
        { label: 'Attendance', path: '/attendance', icon: CheckSquare },
        { label: 'Events', path: '/events', icon: CalendarDays },
        { label: 'Announcements', path: '/announcements', icon: Bell },
        { label: 'Tasks & Sprints', path: '/tasks', icon: Award },
        { label: 'Digital ID Cards', path: '/id-cards', icon: IdCard },
      ];
    }

    // DEV_MATE
    return [
      { label: 'My Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'My Attendance', path: '/attendance', icon: CheckSquare },
      { label: 'Club Events', path: '/events', icon: CalendarDays },
      { label: 'Announcements', path: '/announcements', icon: Bell },
      { label: 'My Tasks', path: '/tasks', icon: Award },
      { label: 'Achievements', path: '/achievements', icon: BarChart3 },
      { label: 'Digital ID Card', path: '/id-cards', icon: IdCard },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Surface */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Close button on mobile */}
        <div>
          <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-200/80 dark:border-neutral-800">
            <DevStudioLogo size="md" />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              {role === 'ADMIN' ? 'Administration' : role === 'CAPTAIN' ? 'Captain Portal' : 'Member Workspace'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User identity & Logout */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20">
          {currentUser && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 flex items-center justify-between">
              <div className="truncate">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5">
                  {currentUser.memberId}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                {currentUser.role === 'DEV_MATE' ? 'MATE' : currentUser.role}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
