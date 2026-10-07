import React from 'react';
import { useClubData } from '../context/ClubDataContext';
import { Activity, Shield, Users, Calendar, Bell, IdCard, CheckCircle2 } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { activityLogs } = useClubData();

  const getIcon = (type: string) => {
    switch (type) {
      case 'MEMBER':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'ATTENDANCE':
        return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'ANNOUNCEMENT':
        return <Bell className="w-4 h-4 text-rose-500" />;
      case 'ID_CARD':
        return <IdCard className="w-4 h-4 text-cyan-500" />;
      default:
        return <Activity className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Club Activity Stream
          </h2>
          <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
            <Activity className="w-4 h-4" />
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Real-time record of all administrative, member, and session events across DevStudio.
        </p>
      </div>

      {/* Activity Timeline */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 space-y-6 pl-6">
          {activityLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-[35px] top-1 p-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                {getIcon(log.type)}
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {log.title}
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {log.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60 flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                  <span>Actor:</span>
                  <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{log.actorName}</strong>
                  <span>({log.actorRole.replace('_', ' ')})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
