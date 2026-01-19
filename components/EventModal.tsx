import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (eventId: string) => void;
  onEdit?: (event: Event) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, isAdmin, onDelete, onEdit }) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const currentUser = authService.getCurrentSession();

  useEffect(() => {
    if (event) {
      // FIX: Use getReminders() instead of hasReminder()
      const reminders = notificationService.getReminders();
      setIsScheduled(!!reminders[event.id]);
      setShowConfirmDelete(false);
    }
  }, [event]);

  if (!event) return null;

  const handleNotifyMe = async () => {
    if (isScheduled) {
      // FIX: Use removeReminder() with correct parameters
      await notificationService.removeReminder(event.id, currentUser?.id);
      setIsScheduled(false);
      return;
    }

    const granted = await notificationService.requestPermission();
    if (granted) {
      // FIX: Use addReminder() instead of saveReminder()
      await notificationService.addReminder(event.id, event.date, currentUser?.id);
      setIsScheduled(true);
      
      notificationService.sendNotification(`Reminder Set: ${event.title}`, {
        body: `We'll alert you before this event starts on ${format(new Date(event.date), 'MMMM do')}.`,
        tag: `ack-${event.id}`,
      });
    } else {
      alert("Please enable notifications in your browser settings to receive event alerts.");
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px] transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-[12px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar">
          <div className="w-full aspect-[4/5] bg-slate-100 overflow-hidden relative">
            <img 
              src={event.posterUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {isAdmin && (
              <div className="absolute top-4 left-4 flex gap-2">
                <button 
                  onClick={() => onEdit?.(event)}
                  className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg text-[#517488] dark:text-[#C28840] hover:scale-110 active:scale-90 transition-all"
                  title="Edit Event"
                >
                  <Icon name="Pencil" size={18} />
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-3 bg-red-500/90 rounded-full shadow-lg text-white hover:scale-110 active:scale-90 transition-all"
                  title="Delete Event"
                >
                  <Icon name="Trash2" size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#E8F1F8] dark:bg-slate-800 p-8 pb-12 min-h-[250px] relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[#1E293B] dark:text-white text-xl font-black">{event.title}</h3>
              <button 
                onClick={handleNotifyMe}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider ${
                  isScheduled 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                  : 'bg-[#C28840]/10 text-[#C28840] hover:bg-[#C28840]/20'
                }`}
              >
                <Icon name={isScheduled ? "Check" : "Bell"} size={14} />
                {isScheduled ? 'Scheduled' : 'Remind Me'}
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[#1E293B] dark:text-slate-200 font-bold text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>
              
              <div className="pt-4 space-y-3 border-t border-[#517488]/10 dark:border-white/10">
                <div className="flex items-center gap-3 text-base text-[#1E293B]/70 dark:text-slate-400 font-bold">
                  <Icon name="Calendar" size={18} />
                  {format(new Date(event.date), 'EEEE, MMMM do, yyyy')}
                </div>
                {(event.startTime || event.endTime) && (
                  <div className="flex items-center gap-3 text-base text-[#1E293B]/70 dark:text-slate-400 font-bold">
                    <Icon name="Clock" size={18} />
                    {event.startTime ? formatTime(event.startTime) : '...'} {event.endTime ? ` - ${formatTime(event.endTime)}` : ''}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-3 text-base text-[#1E293B]/70 dark:text-slate-400 font-bold">
                    <Icon name="MapPin" size={18} />
                    {event.location}
                  </div>
                )}
              </div>

              {event.rsvpLink && (
                <div className="pt-2">
                   <a 
                    href={event.rsvpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/60 dark:bg-white/10 rounded-full text-[#517488] dark:text-[#C28840] font-black hover:bg-white transition-all shadow-sm border border-white/20"
                  >
                    RSVP Link <Icon name="ExternalLink" size={14} />
                  </a>
                </div>
              )}
            </div>

            <button 
              onClick={onClose}
              className="absolute bottom-6 right-6 p-1.5 z-20 text-[#517488] dark:text-[#C28840] transition-opacity hover:opacity-70 active:scale-90" aria-label="Close event details"
            >
              <Icon name="X" size={26} />
            </button>
          </div>
        </div>

        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertTriangle" size={32} />
              </div>
              <h4 className="text-xl font-black text-white">Delete this event?</h4>
              <p className="text-sm text-slate-300">This action cannot be undone and will be logged in the audit trail.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;