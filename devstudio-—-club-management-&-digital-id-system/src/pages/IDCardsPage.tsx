import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { DigitalIDCard } from '../components/idcard/DigitalIDCard';
import { User } from '../types';
import { UserAvatar } from '../components/common/UserAvatar';
import { IdCard, Sparkles, Shield, Terminal, Search } from 'lucide-react';

export const IDCardsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { users, idCards, getIDCardForUser } = useClubData();

  const [selectedUser, setSelectedUser] = useState<User>(() => currentUser || users[0]);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState<'ALL' | 'ADMIN' | 'CAPTAIN' | 'DEV_MATE'>('ALL');

  if (!currentUser) return null;

  const selectedCard = getIDCardForUser(selectedUser.id) || idCards[0];

  const filteredMembers = users.filter((u) => {
    if (roleTab !== 'ALL' && u.role !== roleTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.memberId.toLowerCase().includes(q) ||
        u.branch.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              DevStudio Digital ID Cards
            </h2>
            <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
              <IdCard className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Cryptographically tokenized student credentials with real-time QR verification.
          </p>
        </div>
      </div>

      {/* Main Grid: Card Showcase (Center) & Selector list (Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Selected 3D ID Card Viewer */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-inner">
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              Official Technical Credential
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {selectedUser.name} · {selectedUser.memberId}
            </h3>
          </div>

          <DigitalIDCard user={selectedUser} card={selectedCard} />
        </div>

        {/* Member Selector Directory */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              Select Member ID Card
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">
              Select any club member to inspect their 3D ID card and token.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs">
            {(['ALL', 'ADMIN', 'CAPTAIN', 'DEV_MATE'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleTab(r)}
                className={`flex-1 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                  roleTab === r
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {r === 'ALL' ? 'All' : r === 'DEV_MATE' ? 'Mates' : r.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Members List */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredMembers.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={u.name} role={u.role} size="sm" />
                    <div>
                      <span className="text-xs font-bold block leading-tight">
                        {u.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-indigo-200' : 'text-neutral-400'
                        }`}
                      >
                        {u.memberId} · {u.branch.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {u.role === 'DEV_MATE' ? 'MATE' : u.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
