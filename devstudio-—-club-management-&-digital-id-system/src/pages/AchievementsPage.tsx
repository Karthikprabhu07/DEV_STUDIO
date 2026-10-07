import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { Trophy, Flame, Award, Medal, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AchievementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { achievements, users } = useClubData();

  if (!currentUser) return null;

  const myAchievements = achievements.filter((a) => a.userId === currentUser.id);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'Medal':
        return <Medal className="w-5 h-5 text-cyan-500" />;
      case 'Award':
        return <Award className="w-5 h-5 text-indigo-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            DevStudio Honors & Achievements
          </h2>
          <span className="p-1 rounded-full bg-amber-500/10 text-amber-500">
            <Trophy className="w-4 h-4" />
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Badges, competition victories, and verified technical recognitions issued by DevStudio at MITE.
        </p>
      </div>

      {/* My Achievements Spotlight */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-950 border border-indigo-500/20 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              My Earned Badges ({myAchievements.length})
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              Verified for {currentUser.name} ({currentUser.memberId})
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Ranked Member
          </span>
        </div>

        {myAchievements.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-400">
            Complete upcoming challenges and workshops to unlock badges.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAchievements.map((ach) => (
              <div
                key={ach.id}
                className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
                    {getIcon(ach.icon)}
                  </div>
                  <Badge variant="warning" size="sm">
                    {ach.badgeLabel}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-neutral-100">{ach.title}</h4>
                <p className="text-xs text-neutral-400">{ach.description}</p>
                <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>Category: {ach.category}</span>
                  <span>Awarded: {ach.awardedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Club Achievements Roll of Honor */}
      <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          DevStudio Hall of Fame
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const recipient = users.find((u) => u.id === ach.userId);
            return (
              <div
                key={ach.id}
                className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/70 dark:border-neutral-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {getIcon(ach.icon)}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-500">
                    {ach.badgeLabel}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                  {ach.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {ach.description}
                </p>
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>{recipient?.name || 'Club Member'}</span>
                  <span>{ach.awardedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
