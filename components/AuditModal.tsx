import React, { useState } from 'react';
import { AuditLog, UserStats } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  stats: UserStats | null;
}

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color?: string }> = ({ label, value, icon, color = '#C28840' }) => (
  <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
      <Icon name={icon as any} size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  </div>
);

const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, logs, stats }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'logs'>('stats');

  if (!isOpen) return null;

  const maxDay = stats?.daily30 ? Math.max(...stats.daily30.map(d => d.count), 1) : 1;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px] transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#F5F1EB] dark:bg-[#1E293B] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-black/5 dark:border-white/5 bg-white dark:bg-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-[#2D3B4D] dark:text-white tracking-tight">Admin Dashboard</h3>
              <p className="text-xs font-bold text-[#C28840] uppercase tracking-widest mt-1">System Overview</p>
            </div>
            <button onClick={onClose} className="p-2 text-[#517488] dark:text-[#C28840] hover:opacity-70 transition-opacity">
              <Icon name="X" size={28} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#C28840] text-white shadow-md'
                  : 'bg-black/5 dark:bg-white/5 text-[#517488] dark:text-slate-400 hover:bg-black/10'
              }`}
            >
              <span className="flex items-center justify-center gap-2"><Icon name="BarChart2" size={14} /> Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'logs'
                  ? 'bg-[#C28840] text-white shadow-md'
                  : 'bg-black/5 dark:bg-white/5 text-[#517488] dark:text-slate-400 hover:bg-black/10'
              }`}
            >
              <span className="flex items-center justify-center gap-2"><Icon name="Activity" size={14} /> Audit Logs</span>
            </button>
          </div>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Members" value={stats.total} icon="Users" color="#517488" />
                  <StatCard label="Today" value={stats.today} icon="UserPlus" color="#C28840" />
                  <StatCard label="This Month" value={stats.thisMonth} icon="Calendar" color="#22C55E" />
                  <StatCard label="This Year" value={stats.thisYear} icon="TrendingUp" color="#EC4899" />
                </div>

                <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5">
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
                  <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5">
                    <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">New Members — Last 30 Days</p>
                    <div className="flex items-end gap-1 h-20">
                      {stats.daily30.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
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
                    <div className="flex justify-between mt-2">
                      <p className="text-[9px] opacity-30 font-bold uppercase">{stats.daily30[0]?.day}</p>
                      <p className="text-[9px] opacity-30 font-bold uppercase">{stats.daily30[stats.daily30.length - 1]?.day}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#517488]/10 flex items-center justify-center">
                      <Icon name="CalendarDays" size={18} className="text-[#517488]" />
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

        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-6">
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="group relative pl-8 pb-6 border-l-2 border-[#C28840]/20 last:pb-0">
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