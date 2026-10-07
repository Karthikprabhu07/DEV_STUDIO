import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Modal } from '../common/Modal';
import { useClubData } from '../../context/ClubDataContext';
import { Search, User as UserIcon, Calendar, Bell } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { users, events, announcements } = useClubData();

  // Determine current page title
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/members':
        return 'Dev Mates Directory';
      case '/captains':
        return 'Captains & Track Leads';
      case '/attendance':
        return 'Attendance Management';
      case '/events':
        return 'Club Events & Hackathons';
      case '/announcements':
        return 'Announcements';
      case '/tasks':
        return 'Tasks & Sprints';
      case '/id-cards':
        return 'Digital ID Cards';
      case '/reports':
        return 'Analytics & Reports';
      case '/activity':
        return 'Club Activity Log';
      case '/settings':
        return 'Club Settings';
      case '/profile':
        return 'My Member Profile';
      case '/achievements':
        return 'Achievements & Badges';
      default:
        return 'DevStudio MITE';
    }
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.branch.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredEvents = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredAnnouncements = searchQuery.trim()
    ? announcements.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col antialiased">
      {/* Sidebar for Desktop & Drawer for Mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle(location.pathname)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Quick Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        title="Quick Find"
        subtitle="Search DevStudio members, events, and announcements"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID (e.g. DS-MATE-001), branch, event..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 space-y-1">
            {searchQuery.trim() === '' ? (
              <p className="py-6 text-center text-xs text-neutral-400">
                Type keywords to quickly jump to members or events.
              </p>
            ) : filteredUsers.length === 0 &&
              filteredEvents.length === 0 &&
              filteredAnnouncements.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-400">
                No matching results found.
              </p>
            ) : (
              <>
                {filteredUsers.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 block">
                      Members ({filteredUsers.length})
                    </span>
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          navigate('/members');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {u.name}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-400">
                            {u.memberId}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {u.branch}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredEvents.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 block">
                      Events ({filteredEvents.length})
                    </span>
                    {filteredEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          navigate('/events');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {e.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-400">{e.date}</span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredAnnouncements.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 block">
                      Announcements ({filteredAnnouncements.length})
                    </span>
                    {filteredAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          navigate('/announcements');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {a.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
