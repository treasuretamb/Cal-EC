import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Event } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

interface EventModalProps {
  event: Event | null;
  events?: Event[];          // all events on the selected day — enables swipe
  initialIndex?: number;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (eventId: string, mode: 'single' | 'series') => void;
  onEdit?: (event: Event) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  event,
  events: eventsProp,
  initialIndex = 0,
  onClose,
  isAdmin,
  onDelete,
  onEdit,
}) => {
  // Build navigation list: prefer the full-day list, fall back to single event
  const list: Event[] = eventsProp && eventsProp.length > 0
    ? eventsProp
    : event ? [event] : [];

  const [index, setIndex] = useState(initialIndex);
  const [isScheduled, setIsScheduled] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentUser = authService.getCurrentSession();
  const current = list[index] ?? null;

  useEffect(() => {
    setIndex(initialIndex);
  }, [event, initialIndex]);

  useEffect(() => {
    if (current) {
      const reminders = notificationService.getReminders();
      setIsScheduled(!!reminders[current.id]);
      setShowConfirmDelete(false);
    }
  }, [current]);

  const goTo = useCallback((next: number, dir: 'left' | 'right') => {
    if (animating) return;
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setIndex(next);
      setSlideDir(null);
      setAnimating(false);
    }, 180);
  }, [animating]);

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1, 'right');
  }, [index, goTo]);

  const goNext = useCallback(() => {
    if (index < list.length - 1) goTo(index + 1, 'left');
  }, [index, list.length, goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!current) return null;

  const handleNotifyMe = async () => {
    if (isScheduled) {
      await notificationService.removeReminder(current.id, currentUser?.id);
      setIsScheduled(false);
      return;
    }
    const granted = await notificationService.requestPermission();
    if (granted) {
      await notificationService.addReminder(current.id, current.date, currentUser?.id);
      setIsScheduled(true);
      notificationService.sendNotification(`Reminder Set: ${current.title}`, {
        body: `We'll alert you before this event on ${format(new Date(current.date), 'MMMM do')}.`,
        tag: `ack-${current.id}`,
      });
    } else {
      alert('Please enable notifications in your browser settings to receive event alerts.');
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const contentClass = [
    'transition-all duration-[180ms]',
    slideDir === 'left'  ? 'opacity-0 -translate-x-3' :
    slideDir === 'right' ? 'opacity-0 translate-x-3'  : 'opacity-100 translate-x-0',
  ].join(' ');

  const hasMultiple = list.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px]"
      onClick={onClose}
    >
      {/* Desktop prev arrow */}
      {hasMultiple && index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); goPrev(); }}
          className="hidden md:flex absolute z-[60] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-xl items-center justify-center text-[#517488] dark:text-[#C28840] hover:scale-110 active:scale-95 transition-all"
          style={{ left: 'max(1rem, calc(50% - 224px - 3.5rem))' }}
        >
          <Icon name="ChevronLeft" size={22} />
        </button>
      )}

      {/* Desktop next arrow */}
      {hasMultiple && index < list.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); goNext(); }}
          className="hidden md:flex absolute z-[60] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-xl items-center justify-center text-[#517488] dark:text-[#C28840] hover:scale-110 active:scale-95 transition-all"
          style={{ right: 'max(1rem, calc(50% - 224px - 3.5rem))' }}
        >
          <Icon name="ChevronRight" size={22} />
        </button>
      )}

      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-[12px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Dot indicators + mobile arrows */}
        {hasMultiple && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
            <button onClick={goPrev} disabled={index === 0}
              className="md:hidden text-white disabled:opacity-25 active:scale-90 transition-all">
              <Icon name="ChevronLeft" size={14} />
            </button>
            {list.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > index ? 'left' : 'right')}
                className={`rounded-full transition-all duration-200 ${
                  i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
            <button onClick={goNext} disabled={index === list.length - 1}
              className="md:hidden text-white disabled:opacity-25 active:scale-90 transition-all">
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        )}

        <div className={`overflow-y-auto flex-1 no-scrollbar ${contentClass}`}>

          {/* ── Poster — portrait, never cropped ── */}
          <div className="w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden relative">
            <img
              src={current.posterUrl}
              alt={current.title}
              className="w-full h-auto object-contain block"
              style={{ maxHeight: '56vh' }}
            />

            {current.isRecurring && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <Icon name="Repeat" size={11} className="text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {current.recurrencePattern}
                </span>
              </div>
            )}

            {isAdmin && current.visibility === 'admin_only' && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/80 backdrop-blur-sm rounded-full">
                <Icon name="Lock" size={11} className="text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Staff Only</span>
              </div>
            )}
          </div>

          {/* ── Event details ── */}
          <div className="bg-[#E8F1F8] dark:bg-slate-800 p-6 pb-14 relative">
            <div className="flex justify-between items-start mb-4 gap-3">
              <h3 className="text-[#1E293B] dark:text-white text-xl font-black flex-1 leading-tight">
                {current.title}
              </h3>
              <button
                onClick={handleNotifyMe}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider ${
                  isScheduled
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-[#C28840]/10 text-[#C28840] hover:bg-[#C28840]/20'
                }`}
              >
                <Icon name={isScheduled ? 'Check' : 'Bell'} size={14} />
                {isScheduled ? 'Scheduled' : 'Remind Me'}
              </button>
            </div>

            <div className="space-y-5">
              <p className="text-[#1E293B] dark:text-slate-200 font-bold text-base leading-relaxed">
                {current.description}
              </p>

              <div className="pt-4 space-y-3 border-t border-[#517488]/10 dark:border-white/10">
                <div className="flex items-center gap-3 text-sm text-[#1E293B]/70 dark:text-slate-400 font-bold">
                  <Icon name="Calendar" size={16} />
                  {format(new Date(current.date), 'EEEE, MMMM do, yyyy')}
                </div>
                {(current.startTime || current.endTime) && (
                  <div className="flex items-center gap-3 text-sm text-[#1E293B]/70 dark:text-slate-400 font-bold">
                    <Icon name="Clock" size={16} />
                    {current.startTime ? formatTime(current.startTime) : '...'}
                    {current.endTime ? ` — ${formatTime(current.endTime)}` : ''}
                  </div>
                )}
                {current.location && (
                  <div className="flex items-center gap-3 text-sm text-[#1E293B]/70 dark:text-slate-400 font-bold">
                    <Icon name="MapPin" size={16} />
                    {current.location}
                  </div>
                )}
              </div>

              {current.rsvpLink && (
                <a
                  href={current.rsvpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/60 dark:bg-white/10 rounded-full text-[#517488] dark:text-[#C28840] font-black hover:bg-white transition-all shadow-sm border border-white/20"
                >
                  RSVP Link <Icon name="ExternalLink" size={14} />
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="absolute bottom-5 right-5 p-1.5 z-20 text-[#517488] dark:text-[#C28840] transition-opacity hover:opacity-70 active:scale-90"
              aria-label="Close"
            >
              <Icon name="X" size={26} />
            </button>
          </div>
        </div>

        {/* Pinned admin bar */}
        {isAdmin && (
          <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1E293B] flex-shrink-0">
            <button
              onClick={() => onEdit?.(current)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#517488]/10 text-[#517488] dark:text-[#C28840] font-bold text-sm hover:bg-[#517488]/20 transition-all active:scale-95"
            >
              <Icon name="Pencil" size={16} /> Edit Event
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95"
            >
              <Icon name="Trash2" size={16} /> Delete
            </button>
          </div>
        )}

        {/* Delete confirmation overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="text-center space-y-5 w-full">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Icon name="AlertTriangle" size={32} />
              </div>
              <h4 className="text-xl font-black text-white">Delete this event?</h4>

              {current.isRecurring ? (
                <>
                  <p className="text-sm text-slate-300">This is a recurring event. Choose what to delete.</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { onDelete?.(current.id, 'single'); onClose(); }}
                      className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
                      This event only
                    </button>
                    <button onClick={() => { onDelete?.(current.id, 'series'); onClose(); }}
                      className="w-full py-3 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 transition-colors">
                      All events in series
                    </button>
                    <button onClick={() => setShowConfirmDelete(false)}
                      className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-300">This cannot be undone and will be logged in the audit trail.</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { onDelete?.(current.id, 'single'); onClose(); }}
                      className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                      Confirm Delete
                    </button>
                    <button onClick={() => setShowConfirmDelete(false)}
                      className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;