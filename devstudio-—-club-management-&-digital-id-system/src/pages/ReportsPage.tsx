import React, { useState } from 'react';
import { useClubData } from '../context/ClubDataContext';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  Users,
  Shield,
  CheckCircle2,
  Calendar,
  Download,
  TrendingUp,
  Printer,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { users, events, attendance, getAttendanceStats } = useClubData();

  const devMates = users.filter((u) => u.role === 'DEV_MATE');
  const captains = users.filter((u) => u.role === 'CAPTAIN');
  const activeMembers = devMates.filter((u) => u.status === 'ACTIVE');
  const completedEvents = events.filter((e) => e.status === 'COMPLETED');
  const stats = getAttendanceStats();

  // Branch breakdown
  const branchCounts: Record<string, number> = {};
  devMates.forEach((m) => {
    branchCounts[m.branch] = (branchCounts[m.branch] || 0) + 1;
  });

  // Semester breakdown
  const semCounts: Record<string, number> = {};
  devMates.forEach((m) => {
    semCounts[m.semester] = (semCounts[m.semester] || 0) + 1;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              Club Reports & Analytics
            </h2>
            <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Audit club metrics, branch representations, and attendance compliance for MITE accreditation.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export Audit Report</span>
        </button>
      </div>

      {/* 6 High-Level Executive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Dev Mates"
          value={devMates.length}
          icon={Users}
          accentColor="indigo"
        />
        <StatCard
          label="Active Cohort"
          value={activeMembers.length}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          label="Captains"
          value={captains.length}
          icon={Shield}
          accentColor="cyan"
        />
        <StatCard
          label="Avg Attendance"
          value={`${stats.percentage}%`}
          icon={TrendingUp}
          accentColor={stats.percentage >= 75 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Events Held"
          value={completedEvents.length}
          icon={Calendar}
          accentColor="purple"
        />
        <StatCard
          label="Total Logs"
          value={attendance.length}
          icon={BarChart3}
          accentColor="amber"
        />
      </div>

      {/* Analytics Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Representation Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Department & Branch Distribution
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              {Object.keys(branchCounts).length} Branches Enrolled
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(branchCounts).map(([branch, count]) => {
              const pct = Math.round((count / devMates.length) * 100);
              return (
                <div key={branch} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-neutral-800 dark:text-neutral-200 truncate max-w-[280px]">
                      {branch}
                    </span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semester Representation & Attendance Thresholds */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Academic Cohort Distribution
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              Odd Semester Term
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(semCounts).map(([sem, count]) => {
              const pct = Math.round((count / devMates.length) * 100);
              return (
                <div key={sem} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-neutral-800 dark:text-neutral-200">{sem}</span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {count} students ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800 mt-4 text-xs space-y-1">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
              MITE Accreditation Compliance Note:
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              DevStudio maintains verified audit trails for technical student development in accordance with college co-curricular guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
