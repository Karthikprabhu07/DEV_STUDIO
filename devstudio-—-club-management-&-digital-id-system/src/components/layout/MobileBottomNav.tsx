import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarDays,
  IdCard,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();

  const getBottomLinks = () => {
    if (role === 'ADMIN') {
      return [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'Dev Mates', path: '/members', icon: Users },
        { label: 'Attendance', path: '/attendance', icon: CheckSquare },
        { label: 'Events', path: '/events', icon: CalendarDays },
        { label: 'ID Cards', path: '/id-cards', icon: IdCard },
      ];
    }
    if (role === 'CAPTAIN') {
      return [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'My Mates', path: '/members', icon: Users },
        { label: 'Attendance', path: '/attendance', icon: CheckSquare },
        { label: 'Events', path: '/events', icon: CalendarDays },
        { label: 'ID Cards', path: '/id-cards', icon: IdCard },
      ];
    }
    // DEV_MATE
    return [
      { label: 'Home', path: '/', icon: LayoutDashboard },
      { label: 'Attendance', path: '/attendance', icon: CheckSquare },
      { label: 'Events', path: '/events', icon: CalendarDays },
      { label: 'My ID', path: '/id-cards', icon: IdCard },
      { label: 'Profile', path: '/profile', icon: Users },
    ];
  };

  const links = getBottomLinks();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around h-14 no-print">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
