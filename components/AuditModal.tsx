import React, { useState, useMemo } from 'react';
import { AuditLog, UserStats } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';

export interface MemberRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  residence?: string;
  isByuPathway?: boolean;
  createdAt?: string;
  lastSeen?: string;
}

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  stats: UserStats | null;
  members: MemberRecord[];
}

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color?: string }> = ({ label, value, icon, color = '#C28840' }) => (
  <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
      <Icon name={icon as any} size={20} style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
  </div>
);

const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, logs, stats, members }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'members' | 'logs'>('stats');
  const [search, setSearch] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const maxDay = stats?.daily30 ? Math.max(...stats.daily30.map(d => d.count), 1) : 1;

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.residence?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }, [members, search]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const tabs = [
    { key: 'stats',   icon: 'BarChart2',    label: 'Stats' },
    { key: 'members', icon: 'Users',         label: `Members${members.length > 0 ? ` (${members.length})` : ''}` },
    { key: 'logs',    icon: 'Activity',      label: 'Logs' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#F5F1EB] dark:bg-[#1E293B] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/5 bg-white dark:bg-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-2xl font-black text-[#2D3B4D] dark:text-white tracking-tight">Admin Dashboard</h3>
              <p className="text-xs font-bold text-[#C28840] uppercase tracking-widest mt-1">System Overview</p>
            </div>
            <button onClick={onClose} className="p-2 text-[#517488] dark:text-[#C28840] hover:opacity-70 transition-opacity">
              <Icon name="X" size={26} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#C28840] text-white shadow-md'
                    : 'bg-black/5 dark:bg-white/5 text-[#517488] dark:text-slate-400 hover:bg-black/10'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Icon name={tab.icon as any} size={13} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats Tab ── */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Members" value={stats.total} icon="Users" color="#517488" />
                  <StatCard label="Today" value={stats.today} icon="UserPlus" color="#C28840" />
                  <StatCard label="This Month" value={stats.thisMonth} icon="Calendar" color="#22C55E" />
                  <StatCard label="This Year" value={stats.thisYear} icon="TrendingUp" color="#EC4899" />
                </div>

                <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase tracking-widest opacity-40">BYU Pathway Students</p>
                    <span className="text-lg font-black text-[#C28840]">{stats.byuPathwayCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#C28840] transition-all duration-700"
                      style={{ width: stats.total > 0 ? `${(stats.byuPathwayCount / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] font-bold opacity-40 mt-2 uppercase tracking-widest">
                    {stats.total > 0 ? Math.round((stats.byuPathwayCount / stats.total) * 100) : 0}% of all members
                  </p>
                </div>

                {stats.daily30 && stats.daily30.length > 0 && (
                  <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                    <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-3">New Members — Last 30 Days</p>
                    <div className="flex items-end gap-1 h-16">
                      {stats.daily30.map((d, i) => (
                        <div key={i} className="flex-1 group relative">
                          <div
                            className="w-full rounded-sm bg-[#C28840]/60 group-hover:bg-[#C28840] transition-all"
                            style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: '2px' }}
                          />
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2D3B4D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d.day}: {d.count}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-[9px] opacity-30 font-bold uppercase">{stats.daily30[0]?.day}</p>
                      <p className="text-[9px] opacity-30 font-bold uppercase">{stats.daily30[stats.daily30.length - 1]?.day}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#517488]/10 flex items-center justify-center">
                      <Icon name="CalendarDays" size={16} className="text-[#517488]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">This Week</p>
                      <p className="text-sm font-bold text-[#2D3B4D] dark:text-white">New registrations</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-[#517488]">{stats.thisWeek}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <Icon name="BarChart2" size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No stats available</p>
              </div>
            )}
          </div>
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search bar */}
            <div className="p-4 border-b border-black/5 dark:border-white/5">
              <div className="relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="Search name, email, location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#C28840] placeholder:opacity-40"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-2">
                {filteredMembers.length} of {members.length} members · tap any field to copy
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m, i) => (
                  <div key={m.id} className="bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                    {/* Name row */}
                    <div className="flex items-center gap-3 p-4 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#517488] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {m.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#2D3B4D] dark:text-white truncate">{m.name}</p>
                        {m.createdAt && (
                          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                            Joined {format(new Date(m.createdAt), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      {m.isByuPathway && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-[#C28840]/15 rounded-lg text-[9px] font-black text-[#C28840] uppercase tracking-widest">
                          BYU
                        </span>
                      )}
                    </div>

                    {/* Detail rows */}
                    <div className="border-t border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
                      {m.email && (
                        <button
                          onClick={() => copyToClipboard(m.email!, `email-${m.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/3 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Icon name="Mail" size={13} className="text-[#517488] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#517488] dark:text-slate-300 truncate flex-1">{m.email}</span>
                          <Icon name={copiedField === `email-${m.id}` ? 'Check' : 'Copy'} size={12} className="opacity-30 flex-shrink-0" />
                        </button>
                      )}
                      {m.phone && (
                        <button
                          onClick={() => copyToClipboard(m.phone!, `phone-${m.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/3 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Icon name="Phone" size={13} className="text-[#517488] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#517488] dark:text-slate-300 flex-1">{m.phone}</span>
                          <Icon name={copiedField === `phone-${m.id}` ? 'Check' : 'Copy'} size={12} className="opacity-30 flex-shrink-0" />
                        </button>
                      )}
                      {m.residence && (
                        <button
                          onClick={() => copyToClipboard(m.residence!, `loc-${m.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/3 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Icon name="MapPin" size={13} className="text-[#517488] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#517488] dark:text-slate-300 flex-1">{m.residence}</span>
                          <Icon name={copiedField === `loc-${m.id}` ? 'Check' : 'Copy'} size={12} className="opacity-30 flex-shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-30">
                  <Icon name="UserX" size={40} className="mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    {search ? 'No members match your search' : 'No members yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Audit Logs Tab ── */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-4">
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="group relative pl-8 pb-5 border-l-2 border-[#C28840]/20 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#C28840] border-4 border-[#F5F1EB] dark:border-[#1E293B] group-hover:scale-125 transition-transform" />
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black text-[#517488] dark:text-[#C28840] uppercase tracking-widest">{log.adminName}</span>
                      <span className="text-[10px] font-bold opacity-40 uppercase">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</span>
                    </div>
                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm group-hover:shadow-md transition-shadow">
                      <h4 className="text-sm font-black text-[#2D3B4D] dark:text-white uppercase tracking-tight mb-1">{log.action}</h4>
                      <p className="text-xs text-[#517488] dark:text-slate-400 font-medium leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <Icon name="ClipboardList" size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No activity recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditModal;