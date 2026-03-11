import React, { useState, useEffect, useMemo } from 'react';
import { Event } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import Icon from './Icon';
import {
  addDays, addWeeks, addMonths, addYears,
  format, parseISO, getDay,
} from 'date-fns';

interface AdminFormProps {
  onAdd: (events: Event[]) => void;
  onUpdate?: (event: Event) => void;
  onClose: () => void;
  initialDate?: Date;
  eventToEdit?: Event | null;
}

type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const DAYS_OF_WEEK = [
  { label: 'S', full: 'Sun', value: 0 },
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 },
];

function generateInstances(
  base: Omit<Event, 'id'>,
  groupId: string,
  opts: {
    pattern: RecurrencePattern;
    interval: number;
    daysOfWeek: number[];
    endMode: 'date' | 'count';
    endDate: string;
    endCount: number;
    customDates: string[];
  }
): Omit<Event, 'id'>[] {
  const MAX = 500;

  const makeInstance = (dateStr: string): Omit<Event, 'id'> => ({
    ...base,
    date: new Date(
      parseISO(dateStr).getFullYear(),
      parseISO(dateStr).getMonth(),
      parseISO(dateStr).getDate(),
      12, 0, 0
    ).toISOString(),
    recurrenceGroupId: groupId,
  });

  if (opts.pattern === 'custom') {
    return opts.customDates.filter(d => d).sort().map(d => makeInstance(d));
  }

  const instances: Omit<Event, 'id'>[] = [];
  const endDate = opts.endMode === 'date' ? parseISO(opts.endDate) : null;
  let current = parseISO(base.date.split('T')[0]);
  let count = 0;

  const shouldContinue = () => {
    if (count >= MAX) return false;
    if (opts.endMode === 'count') return instances.length < opts.endCount;
    return endDate ? current <= endDate : false;
  };

  while (shouldContinue()) {
    if (opts.pattern === 'weekly' && opts.daysOfWeek.length > 0) {
      const weekStart = current;
      for (const dow of opts.daysOfWeek.sort()) {
        const candidate = addDays(weekStart, (dow - getDay(weekStart) + 7) % 7);
        const startDate = parseISO(base.date.split('T')[0]);
        if (
          candidate >= startDate &&
          (endDate ? candidate <= endDate : true) &&
          (opts.endMode === 'count' ? instances.length < opts.endCount : true)
        ) {
          instances.push(makeInstance(format(candidate, 'yyyy-MM-dd')));
        }
      }
      current = addWeeks(current, opts.interval);
      count++;
      continue;
    }

    instances.push(makeInstance(format(current, 'yyyy-MM-dd')));
    count++;

    switch (opts.pattern) {
      case 'daily':   current = addDays(current, opts.interval); break;
      case 'weekly':  current = addWeeks(current, opts.interval); break;
      case 'monthly': current = addMonths(current, opts.interval); break;
      case 'yearly':  current = addYears(current, opts.interval); break;
    }
  }

  return instances;
}

const AdminForm: React.FC<AdminFormProps> = ({
  onAdd, onUpdate, onClose, initialDate, eventToEdit,
}) => {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '',
    category: 'Intellectual' as Event['category'],
    date: initialDate
      ? format(initialDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00',
    posterUrl: '', rsvpLink: '',
    color: CATEGORY_COLORS['Intellectual'],
  });

  const [visibility, setVisibility] = useState<'public' | 'admin_only'>('public');
  const [isRecurring, setIsRecurring] = useState(false);
  const [pattern, setPattern] = useState<RecurrencePattern>('weekly');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endMode, setEndMode] = useState<'date' | 'count'>('date');
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    return format(d, 'yyyy-MM-dd');
  });
  const [endCount, setEndCount] = useState(10);
  const [customDates, setCustomDates] = useState<string[]>(['']);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title, description: eventToEdit.description,
        location: eventToEdit.location || '',
        category: eventToEdit.category,
        date: format(new Date(eventToEdit.date), 'yyyy-MM-dd'),
        startTime: eventToEdit.startTime || '09:00',
        endTime: eventToEdit.endTime || '10:00',
        posterUrl: eventToEdit.posterUrl,
        rsvpLink: eventToEdit.rsvpLink || '',
        color: eventToEdit.color,
      });
      setVisibility(eventToEdit.visibility || 'public');
      if (eventToEdit.isRecurring) {
        setIsRecurring(true);
        setPattern((eventToEdit.recurrencePattern as RecurrencePattern) || 'weekly');
        setInterval(eventToEdit.recurrenceInterval || 1);
        setDaysOfWeek(eventToEdit.recurrenceDaysOfWeek || []);
        if (eventToEdit.recurrenceEnd) setEndDate(eventToEdit.recurrenceEnd.split('T')[0]);
        if (eventToEdit.recurrenceCount) { setEndMode('count'); setEndCount(eventToEdit.recurrenceCount); }
        if (eventToEdit.recurrenceCustomDates) setCustomDates(eventToEdit.recurrenceCustomDates);
      }
    }
  }, [eventToEdit]);

  useEffect(() => {
    if (pattern === 'weekly' && daysOfWeek.length === 0 && formData.date) {
      setDaysOfWeek([getDay(parseISO(formData.date))]);
    }
  }, [pattern, formData.date]);

  const genOpts = { pattern, interval, daysOfWeek, endMode, endDate, endCount, customDates };

  const instances = useMemo(() => {
    if (!isRecurring || !formData.date) return [];
    const base: Omit<Event, 'id'> = {
      ...formData, visibility,
      date: new Date(formData.date + 'T12:00:00').toISOString(),
      isRecurring: true,
    };
    return generateInstances(base, 'preview', genOpts);
  }, [isRecurring, formData.date, pattern, interval, daysOfWeek, endMode, endDate, endCount, customDates]);

  const instanceCount = isRecurring ? instances.length : 1;

  const toggleDay = (dow: number) => {
    setDaysOfWeek(prev =>
      prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (eventToEdit) {
      onUpdate?.({
        ...formData, id: eventToEdit.id, visibility,
        date: new Date(formData.date + 'T12:00:00').toISOString(),
        isRecurring: isRecurring || undefined,
        recurrencePattern: isRecurring ? pattern : undefined,
        recurrenceInterval: isRecurring ? interval : undefined,
        recurrenceDaysOfWeek: isRecurring && pattern === 'weekly' ? daysOfWeek : undefined,
        recurrenceEnd: isRecurring && endMode === 'date' ? new Date(endDate + 'T12:00:00').toISOString() : undefined,
        recurrenceCount: isRecurring && endMode === 'count' ? endCount : undefined,
        recurrenceCustomDates: isRecurring && pattern === 'custom' ? customDates.filter(Boolean) : undefined,
        recurrenceGroupId: eventToEdit.recurrenceGroupId,
      });
      onClose();
      return;
    }

    if (!isRecurring) {
      onAdd([{
        ...formData, id: crypto.randomUUID(), visibility,
        date: new Date(formData.date + 'T12:00:00').toISOString(),
      }]);
      onClose();
      return;
    }

    const groupId = crypto.randomUUID();
    const base: Omit<Event, 'id'> = {
      ...formData, visibility,
      date: new Date(formData.date + 'T12:00:00').toISOString(),
      isRecurring: true,
      recurrencePattern: pattern,
      recurrenceInterval: interval,
      recurrenceDaysOfWeek: pattern === 'weekly' ? daysOfWeek : undefined,
      recurrenceEnd: endMode === 'date' ? new Date(endDate + 'T12:00:00').toISOString() : undefined,
      recurrenceCount: endMode === 'count' ? endCount : undefined,
      recurrenceCustomDates: pattern === 'custom' ? customDates.filter(Boolean) : undefined,
      recurrenceGroupId: groupId,
    };

    const generated = generateInstances(base, groupId, genOpts);
    onAdd(generated.map(inst => ({ ...inst, id: crypto.randomUUID() })));
    onClose();
  };

  const labelClass = 'text-xs font-bold text-slate-400 uppercase tracking-wider';
  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-[#C28840] outline-none transition-all';
  const minEndDate = formData.date ? addDays(parseISO(formData.date), 1).toISOString().split('T')[0] : undefined;

  const patternOptions: { value: RecurrencePattern; label: string; icon: string }[] = [
    { value: 'daily',   label: 'Daily',   icon: 'Sun' },
    { value: 'weekly',  label: 'Weekly',  icon: 'CalendarDays' },
    { value: 'monthly', label: 'Monthly', icon: 'Calendar' },
    { value: 'yearly',  label: 'Yearly',  icon: 'CalendarRange' },
    { value: 'custom',  label: 'Custom',  icon: 'ListChecks' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5F1EB] dark:bg-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 overflow-y-auto max-h-[90vh] shadow-2xl animate-in zoom-in duration-200">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">{eventToEdit ? 'Edit Event' : 'Post New Event'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Icon name="X" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Visibility Toggle ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                visibility === 'public'
                  ? 'border-[#517488] bg-[#517488]/10'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${visibility === 'public' ? 'bg-[#517488] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                <Icon name="Globe" size={15} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-700 dark:text-white">Public</p>
                <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Everyone sees this</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('admin_only')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                visibility === 'admin_only'
                  ? 'border-[#C28840] bg-[#C28840]/10'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${visibility === 'admin_only' ? 'bg-[#C28840] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                <Icon name="Lock" size={15} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-700 dark:text-white">Admin Only</p>
                <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Staff / internal</p>
              </div>
            </button>
          </div>

          {/* Title + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Event Title</label>
              <input required className={inputClass} value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>{pattern === 'custom' ? 'Base Date' : 'Start Date'}</label>
              <input required type="date" className={inputClass} value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Start Time</label>
              <input required type="time" className={inputClass} value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>End Time</label>
              <input required type="time" className={inputClass} value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={labelClass}>Description</label>
            <textarea required rows={3} className={`${inputClass} resize-none`} value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>

          {/* Location + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Location / Venue</label>
              <input className={inputClass} value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={formData.category}
                onChange={e => {
                  const cat = e.target.value as Event['category'];
                  setFormData({ ...formData, category: cat, color: CATEGORY_COLORS[cat] });
                }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Poster + RSVP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Poster URL</label>
              <input className={inputClass} value={formData.posterUrl}
                onChange={e => setFormData({ ...formData, posterUrl: e.target.value })} />
              {(formData.posterUrl.includes('photos.google.com') || formData.posterUrl.includes('photos.app.goo.gl')) && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl mt-2">
                  <Icon name="AlertTriangle" size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-400">
                    Google Photos links don't work. Right-click the photo → Copy image address, or upload to Imgur for a direct URL.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className={labelClass}>RSVP Link</label>
              <input className={inputClass} value={formData.rsvpLink}
                onChange={e => setFormData({ ...formData, rsvpLink: e.target.value })} />
            </div>
          </div>

          {/* ── Recurring Toggle ── */}
          <div className="space-y-4">
              <button type="button" onClick={() => setIsRecurring(!isRecurring)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isRecurring ? 'border-[#C28840] bg-[#C28840]/10' : 'border-slate-200 dark:border-slate-700'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isRecurring ? 'bg-[#C28840] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Icon name="Repeat" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-700 dark:text-white">Recurring Event</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">
                      {isRecurring ? `${instanceCount} instance${instanceCount !== 1 ? 's' : ''} will be created` : 'Repeats on a schedule'}
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${isRecurring ? 'bg-[#C28840]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {isRecurring && (
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in slide-in-from-top duration-200">

                  <div className="space-y-2">
                    <label className={labelClass}>Repeat Pattern</label>
                    <div className="grid grid-cols-5 gap-2">
                      {patternOptions.map(opt => (
                        <button key={opt.value} type="button" onClick={() => setPattern(opt.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                            pattern === opt.value
                              ? 'border-[#C28840] bg-[#C28840]/10 text-[#C28840]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-[#C28840]/40'
                          }`}>
                          <Icon name={opt.icon as any} size={16} />
                          <span className="text-[9px] font-black uppercase tracking-wide leading-tight text-center">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {pattern !== 'custom' && (
                    <div className="space-y-2">
                      <label className={labelClass}>Repeat Every</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setInterval(Math.max(1, interval - 1))}
                          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">−</button>
                        <div className="flex-1 text-center">
                          <span className="text-2xl font-black text-[#C28840]">{interval}</span>
                          <span className="text-sm font-bold text-slate-400 ml-2">
                            {pattern === 'daily' && (interval === 1 ? 'day' : 'days')}
                            {pattern === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
                            {pattern === 'monthly' && (interval === 1 ? 'month' : 'months')}
                            {pattern === 'yearly' && (interval === 1 ? 'year' : 'years')}
                          </span>
                        </div>
                        <button type="button" onClick={() => setInterval(Math.min(52, interval + 1))}
                          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">+</button>
                      </div>
                      {pattern === 'weekly' && interval === 2 && <p className="text-[10px] font-black text-[#C28840] uppercase tracking-widest">Bi-weekly</p>}
                      {pattern === 'weekly' && interval === 3 && <p className="text-[10px] font-black text-[#C28840] uppercase tracking-widest">Tri-weekly</p>}
                    </div>
                  )}

                  {pattern === 'weekly' && (
                    <div className="space-y-2">
                      <label className={labelClass}>On These Days</label>
                      <div className="flex gap-2">
                        {DAYS_OF_WEEK.map(day => (
                          <button key={day.value} type="button" onClick={() => toggleDay(day.value)} title={day.full}
                            className={`flex-1 h-9 rounded-xl text-xs font-black transition-all border-2 ${
                              daysOfWeek.includes(day.value)
                                ? 'bg-[#C28840] border-[#C28840] text-white'
                                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-[#C28840]/40'
                            }`}>
                            {day.label}
                          </button>
                        ))}
                      </div>
                      {daysOfWeek.length === 0 && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Select at least one day</p>}
                    </div>
                  )}

                  {pattern === 'custom' && (
                    <div className="space-y-3">
                      <label className={labelClass}>Specific Dates</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                        {customDates.map((d, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="date" className={`${inputClass} flex-1`} value={d}
                              onChange={e => {
                                const updated = [...customDates];
                                updated[i] = e.target.value;
                                setCustomDates(updated);
                              }} />
                            <button type="button" onClick={() => setCustomDates(customDates.filter((_, j) => j !== i))}
                              className="p-2 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                              <Icon name="X" size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setCustomDates([...customDates, ''])}
                        className="flex items-center gap-2 text-xs font-black text-[#C28840] uppercase tracking-widest hover:opacity-70 transition-opacity">
                        <Icon name="Plus" size={14} /> Add Date
                      </button>
                    </div>
                  )}

                  {pattern !== 'custom' && (
                    <div className="space-y-3">
                      <label className={labelClass}>End Condition</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEndMode('date')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                            endMode === 'date' ? 'border-[#C28840] bg-[#C28840]/10 text-[#C28840]' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}>End Date</button>
                        <button type="button" onClick={() => setEndMode('count')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                            endMode === 'count' ? 'border-[#C28840] bg-[#C28840]/10 text-[#C28840]' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}>After N Times</button>
                      </div>
                      {endMode === 'date' && (
                        <input required={isRecurring} type="date" min={minEndDate} className={inputClass} value={endDate}
                          onChange={e => setEndDate(e.target.value)} />
                      )}
                      {endMode === 'count' && (
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setEndCount(Math.max(2, endCount - 1))}
                            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">−</button>
                          <div className="flex-1 text-center">
                            <span className="text-2xl font-black text-[#C28840]">{endCount}</span>
                            <span className="text-sm font-bold text-slate-400 ml-2">occurrences</span>
                          </div>
                          <button type="button" onClick={() => setEndCount(Math.min(500, endCount + 1))}
                            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">+</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex items-start gap-3 p-3 rounded-xl ${instanceCount > 0 ? 'bg-[#C28840]/10' : 'bg-red-500/10'}`}>
                    <Icon name={instanceCount > 0 ? 'Info' : 'AlertTriangle'} size={16}
                      className={`flex-shrink-0 mt-0.5 ${instanceCount > 0 ? 'text-[#C28840]' : 'text-red-400'}`} />
                    <p className={`text-xs font-bold ${instanceCount > 0 ? 'text-[#C28840]' : 'text-red-400'}`}>
                      {instanceCount === 0 ? 'No instances generated — check your settings.'
                        : pattern === 'custom' ? `${instanceCount} specific date${instanceCount !== 1 ? 's' : ''} selected.`
                        : <><span className="font-black">{instanceCount} event{instanceCount !== 1 ? 's' : ''}</span> will be created,
                            repeating every {interval > 1 ? interval + ' ' : ''}
                            {pattern === 'daily' ? 'day' : pattern === 'weekly' ? 'week' : pattern === 'monthly' ? 'month' : 'year'}
                            {pattern === 'weekly' && daysOfWeek.length > 0 ? ` on ${daysOfWeek.sort().map(d => DAYS_OF_WEEK[d].full).join(', ')}` : ''}.
                            {endMode === 'date' && endDate ? ` Until ${format(parseISO(endDate), 'MMM d, yyyy')}.` : ` For ${endCount} occurrences.`}
                          </>
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

          {eventToEdit?.isRecurring && isRecurring && (
            <div className="flex items-center gap-3 p-4 bg-[#C28840]/10 rounded-2xl border border-[#C28840]/20">
              <Icon name="Repeat" size={18} className="text-[#C28840] flex-shrink-0" />
              <p className="text-xs font-bold text-[#C28840]">Editing this occurrence only. Changes won't affect other events in the series.</p>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit"
              disabled={isRecurring && pattern === 'weekly' && daysOfWeek.length === 0}
              className="flex-[2] px-6 py-4 bg-[#C28840] hover:bg-[#D39951] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">
              {eventToEdit ? 'Update Event'
                : isRecurring ? `Create ${instanceCount} Event${instanceCount !== 1 ? 's' : ''}`
                : 'Confirm & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForm;