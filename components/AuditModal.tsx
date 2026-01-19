
import React from 'react';
import { AuditLog } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px] transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#F5F1EB] dark:bg-[#1E293B] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-white/5">
          <div>
            <h3 className="text-2xl font-black text-[#2D3B4D] dark:text-white tracking-tight">Audit Dashboard</h3>
            <p className="text-xs font-bold text-[#C28840] uppercase tracking-widest mt-1">System Activity Logs</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#517488] dark:text-[#C28840] hover:opacity-70 transition-opacity"
          >
            <Icon name="X" size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-6">
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="group relative pl-8 pb-6 border-l-2 border-[#C28840]/20 last:pb-0"
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#C28840] border-4 border-[#F5F1EB] dark:border-[#1E293B] group-hover:scale-125 transition-transform" />
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-[#517488] dark:text-[#C28840] uppercase tracking-widest">
                      {log.adminName}
                    </span>
                    <span className="text-[10px] font-bold opacity-40 uppercase">
                      {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm group-hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-black text-[#2D3B4D] dark:text-white uppercase tracking-tight mb-1">
                      {log.action}
                    </h4>
                    <p className="text-xs text-[#517488] dark:text-slate-400 font-medium leading-relaxed">
                      {log.details}
                    </p>
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
      </div>
    </div>
  );
};

export default AuditModal;
