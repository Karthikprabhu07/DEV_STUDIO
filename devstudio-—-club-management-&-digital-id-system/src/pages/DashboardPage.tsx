import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { StatCard } from '../components/common/StatCard';
import { UserAvatar } from '../components/common/UserAvatar';
import { Badge } from '../components/common/Badge';
import { DigitalIDCard } from '../components/idcard/DigitalIDCard';
import { MemberModal } from '../components/members/MemberModal';
import { CreateEventModal } from '../components/events/CreateEventModal';
import { CreateAnnouncementModal } from '../components/announcements/CreateAnnouncementModal';
import { MarkAttendanceModal } from '../components/attendance/MarkAttendanceModal';
import { QRAttendanceModal } from '../components/attendance/QRAttendanceModal';
import {
  Users,
  Shield,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowUpRight,
  Sparkles,
  QrCode,
  Bell,
  Clock,
  IdCard,
  MapPin,
  TrendingUp,
  Activity,
  Flame,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const {
    users,
    events,
    announcements,
    tasks,
    attendance,
    activityLogs,
    achievements,
    getIDCardForUser,
    getAttendanceStats,
    getCaptainDevMates,
    addMember,
    addEvent,
    addAnnouncement,
    batchMarkAttendance,
  } = useClubData();

  const navigate = useNavigate();

  // Modals state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (!currentUser) return null;

  // Filtered dataset for statistics
  const devMates = users.filter((u) => u.role === 'DEV_MATE');
  const captains = users.filter((u) => u.role === 'CAPTAIN');
  const upcomingEvents = events.filter((e) => e.status === 'UPCOMING');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentTodayCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;

  const overallStats = getAttendanceStats();

  // ----------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // ----------------------------------------------------
  if (role === 'ADMIN') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                Good morning, Director
              </h2>
              <span className="p-1 rounded-full bg-amber-500/10 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Here's what's happening across DevStudio at MITE today.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMemberModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => setEventModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
            <button
              onClick={() => setAnnouncementModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Announcement</span>
            </button>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <StatCard
            label="Total Dev Mates"
            value={devMates.length}
            subtext={`${devMates.filter((m) => m.status === 'ACTIVE').length} Active in MITE`}
            icon={Users}
            accentColor="emerald"
            onClick={() => navigate('/members')}
          />
          <StatCard
            label="Total Captains"
            value={captains.length}
            subtext="Track & Cohort Leads"
            icon={Shield}
            accentColor="cyan"
            onClick={() => navigate('/captains')}
          />
          <StatCard
            label="Present Today"
            value={presentTodayCount}
            subtext={`${todayAttendance.length} records logged today`}
            icon={CheckCircle2}
            accentColor="indigo"
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            label="Upcoming Events"
            value={upcomingEvents.length}
            subtext="Hackathons & Workshops"
            icon={Calendar}
            accentColor="amber"
            onClick={() => navigate('/events')}
          />
        </div>

        {/* Mid Row: Attendance Overview & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Overview Card */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  Attendance Overview
                </h3>
                <Link
                  to="/attendance"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  View Details <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-neutral-900 dark:text-neutral-50">
                    {overallStats.percentage}%
                  </span>
                  <span className="text-xs text-neutral-400 block mt-0.5">Average Club Participation</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-500 font-bold block">{overallStats.present} Present</span>
                  <span className="text-rose-500 font-bold block">{overallStats.absent} Absent</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${overallStats.percentage}%` }}
                />
                <div
                  className="h-full bg-rose-500/60 transition-all duration-500"
                  style={{ width: `${100 - overallStats.percentage}%` }}
                />
              </div>

              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                DevStudio mandates a minimum 75% attendance criteria for club hackathons and certificate issuance.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => setAttendanceModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Mark Session Attendance
              </button>
              <button
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-indigo-500"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>QR Scanner</span>
              </button>
            </div>
          </div>

          {/* Upcoming Events Carousel/Cards */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  Upcoming DevStudio Events
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                  {upcomingEvents.length} Active
                </span>
              </div>
              <Link
                to="/events"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                All Events <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:border-indigo-500/40 bg-neutral-50/50 dark:bg-neutral-950/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {event.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {event.title}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {event.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-xs font-mono text-neutral-400">
                      <strong className="text-neutral-900 dark:text-neutral-100">{event.participantsCount}</strong> registered
                    </span>
                    <Link
                      to="/events"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Activity & Quick Actions Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" />
                Live Club Activity
              </h3>
              <Link
                to="/activity"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                View Log <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {log.title}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Directory Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
                Club Captains Leadership
              </h3>
              <div className="space-y-3">
                {captains.map((cap) => {
                  const assigned = getCaptainDevMates(cap.id);
                  return (
                    <div key={cap.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={cap.name} role="CAPTAIN" size="sm" />
                        <div>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                            {cap.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {cap.branch.split(' ')[0]} · {assigned.length} Mates
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/captains"
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Inspect
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                to="/id-cards"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <IdCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>DevStudio Digital ID Registry</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Modals */}
        <MemberModal
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          onSave={addMember}
          captainsList={captains}
        />
        <CreateEventModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          onSave={addEvent}
          creatorId={currentUser.id}
        />
        <CreateAnnouncementModal
          isOpen={announcementModalOpen}
          onClose={() => setAnnouncementModalOpen(false)}
          onSave={addAnnouncement}
          authorName={currentUser.name}
          authorRole={currentUser.role}
          authorId={currentUser.id}
        />
        <MarkAttendanceModal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          members={devMates}
          events={events}
          markerName={currentUser.name}
          onBatchSubmit={batchMarkAttendance}
        />
        <QRAttendanceModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          scannerName={currentUser.name}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // CAPTAIN DASHBOARD VIEW
  // ----------------------------------------------------
  if (role === 'CAPTAIN') {
    const assignedMates = getCaptainDevMates(currentUser.id);
    const assignedAttendance = attendance.filter((a) =>
      assignedMates.some((m) => m.id === a.userId)
    );
    const assignedPresent = assignedAttendance.filter((a) => a.status === 'PRESENT').length;
    const assignedRate =
      assignedAttendance.length > 0
        ? Math.round((assignedPresent / assignedAttendance.length) * 100)
        : 100;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                Captain Dashboard
              </h2>
              <span className="p-1 rounded-full bg-cyan-500/10 text-cyan-400">
                <Shield className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Manage your assigned Dev Mates and track club activities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-500" />
              <span>QR Terminal</span>
            </button>
          </div>
        </div>

        {/* 4 Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <StatCard
            label="Assigned Dev Mates"
            value={assignedMates.length}
            subtext="In your cohort"
            icon={Users}
            accentColor="cyan"
          />
          <StatCard
            label="Present Today"
            value={assignedAttendance.filter((a) => a.date === todayStr && a.status === 'PRESENT').length}
            subtext="From your assigned group"
            icon={CheckCircle2}
            accentColor="emerald"
          />
          <StatCard
            label="Cohort Attendance"
            value={`${assignedRate}%`}
            subtext="All-time average"
            icon={TrendingUp}
            accentColor="indigo"
          />
          <StatCard
            label="Club Events"
            value={upcomingEvents.length}
            subtext="Upcoming scheduled"
            icon={Calendar}
            accentColor="amber"
          />
        </div>

        {/* My Dev Mates Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                My Assigned Dev Mates ({assignedMates.length})
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Students mentored by Captain {currentUser.name}
              </p>
            </div>
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Take Group Attendance →
            </button>
          </div>

          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="pb-2.5 font-semibold">Dev Mate</th>
                  <th className="pb-2.5 font-semibold">Member ID</th>
                  <th className="pb-2.5 font-semibold">Branch & Semester</th>
                  <th className="pb-2.5 font-semibold">Attendance</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold text-right">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {assignedMates.map((mate) => {
                  const mateStats = getAttendanceStats(mate.id);
                  const card = getIDCardForUser(mate.id);
                  return (
                    <tr key={mate.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={mate.name} role="DEV_MATE" size="sm" />
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {mate.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        {mate.memberId}
                      </td>
                      <td className="py-3 text-neutral-600 dark:text-neutral-400">
                        {mate.branch} ({mate.semester})
                      </td>
                      <td className="py-3 font-mono font-bold">
                        <span
                          className={
                            mateStats.percentage >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {mateStats.percentage}%
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-1 font-normal">
                          ({mateStats.present}/{mateStats.total})
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant="success" size="sm" dot>
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {card && (
                          <Link
                            to={`/verify/${card.verificationToken}`}
                            className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Verify ID
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Club Announcements & Active Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3 flex items-center justify-between">
              <span>Club Announcements</span>
              <button
                onClick={() => setAnnouncementModalOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Post Update
              </button>
            </h3>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {a.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-indigo-500 font-bold">
                      {a.priority}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {a.description}
                  </p>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-2">
                    By {a.authorName} ({a.authorRole})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Cohort Sprints & Tasks
              </h3>
              <Link to="/tasks" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                View All Tasks →
              </Link>
            </div>
            <div className="space-y-2.5">
              {tasks.slice(0, 3).map((tsk) => (
                <div
                  key={tsk.id}
                  className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                      {tsk.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Assigned to {tsk.assignedToName} · Due {tsk.deadline}
                    </span>
                  </div>
                  <Badge
                    variant={tsk.status === 'COMPLETED' ? 'success' : tsk.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {tsk.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals for Captain */}
        <MarkAttendanceModal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          members={assignedMates}
          events={events}
          markerName={currentUser.name}
          onBatchSubmit={batchMarkAttendance}
        />
        <QRAttendanceModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          scannerName={currentUser.name}
        />
        <CreateAnnouncementModal
          isOpen={announcementModalOpen}
          onClose={() => setAnnouncementModalOpen(false)}
          onSave={addAnnouncement}
          authorName={currentUser.name}
          authorRole={currentUser.role}
          authorId={currentUser.id}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // DEV MATE DASHBOARD VIEW
  // ----------------------------------------------------
  const myStats = getAttendanceStats(currentUser.id);
  const myCard = getIDCardForUser(currentUser.id);
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const myAchievements = achievements.filter((a) => a.userId === currentUser.id);
  const myCaptain = users.find((u) => u.id === currentUser.captainId);

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              Welcome, {currentUser.name.split(' ')[0]}
            </h2>
            <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            DevStudio Vibe Coding Portal · {currentUser.branch} ({currentUser.semester})
          </p>
        </div>

        {myCaptain && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-xs">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Assigned Captain</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{myCaptain.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          label="My Attendance"
          value={`${myStats.percentage}%`}
          subtext={`${myStats.present} Present / ${myStats.absent} Absent`}
          icon={CheckCircle2}
          accentColor="emerald"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          label="Club Events"
          value={upcomingEvents.length}
          subtext="Upcoming on campus"
          icon={Calendar}
          accentColor="amber"
          onClick={() => navigate('/events')}
        />
        <StatCard
          label="My Tasks"
          value={myTasks.length}
          subtext={`${myTasks.filter((t) => t.status === 'COMPLETED').length} Completed`}
          icon={CheckCircle2}
          accentColor="indigo"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="Achievements"
          value={myAchievements.length}
          subtext="Badges & Recognitions"
          icon={Sparkles}
          accentColor="purple"
          onClick={() => navigate('/achievements')}
        />
      </div>

      {/* Main Dev Mate Layout: ID Card Showcase & Attendance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Digital ID Card Preview */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <IdCard className="w-4 h-4 text-indigo-500" />
                DevStudio Digital ID
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Tap card or button below to flip to QR verification
              </p>
            </div>
            <Link
              to="/id-cards"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Screen →
            </Link>
          </div>

          {myCard ? (
            <DigitalIDCard user={currentUser} card={myCard} compact={true} />
          ) : (
            <p className="text-xs text-neutral-400">Card pending generation.</p>
          )}
        </div>

        {/* My Attendance Progress & Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Attendance Detail Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3 flex items-center justify-between">
              <span>My Attendance Record</span>
              <span
                className={`text-xs font-mono font-bold ${
                  myStats.percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {myStats.percentage >= 75 ? 'Criteria Met (>=75%)' : 'Warning (<75%)'}
              </span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Session Attendance Rate</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {myStats.percentage}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${myStats.percentage}%` }}
                />
                <div
                  className="h-full bg-rose-500/60"
                  style={{ width: `${100 - myStats.percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 block font-bold">
                    Present Sessions
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {myStats.present} Days
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] uppercase font-mono text-rose-600 dark:text-rose-400 block font-bold">
                    Absent Sessions
                  </span>
                  <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                    {myStats.absent} Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3 flex items-center justify-between">
              <span>Club Announcements</span>
              <Link to="/announcements" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                View All →
              </Link>
            </h3>

            <div className="space-y-2.5">
              {announcements.slice(0, 2).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {a.title}
                    </span>
                    <Badge variant={a.priority === 'URGENT' ? 'danger' : 'info'} size="sm">
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
