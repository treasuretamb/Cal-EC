
import React from 'react';
import { Event } from '../types';
import { format } from 'date-fns';
import Icon from './Icon';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
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
      onClick={() => onClick(event)}
      className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group border border-slate-200 dark:border-slate-700"
    >
      <div className="flex-shrink-0 w-16 text-center">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
          {format(new Date(event.date), 'MMM')}
        </div>
        <div className="text-xl font-bold dark:text-white">
          {format(new Date(event.date), 'dd')}
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-semibold group-hover:text-[#C28840] transition-colors">
          {event.title}
        </h4>
        <div className="flex flex-col gap-0.5 mt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {event.startTime ? formatTime(event.startTime) : 'All Day'} • {event.description}
          </p>
          {event.location && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#C28840] uppercase">
              <Icon name="MapPin" size={10} />
              <span className="truncate max-w-[120px]">{event.location}</span>
            </div>
          )}
        </div>
      </div>
      <div 
        className="w-1.5 h-10 rounded-full" 
        style={{ backgroundColor: event.color }} 
      />
    </div>
  );
};

export default EventCard;
