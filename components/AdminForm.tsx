
import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import Icon from './Icon';

interface AdminFormProps {
  onAdd: (event: Event) => void;
  onUpdate?: (event: Event) => void;
  onClose: () => void;
  initialDate?: Date;
  eventToEdit?: Event | null;
}

const AdminForm: React.FC<AdminFormProps> = ({ onAdd, onUpdate, onClose, initialDate, eventToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'Intellectual' as Event['category'],
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    posterUrl: '',
    rsvpLink: '',
    color: CATEGORY_COLORS['Intellectual'],
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        location: eventToEdit.location || '',
        category: eventToEdit.category,
        date: new Date(eventToEdit.date).toISOString().split('T')[0],
        startTime: eventToEdit.startTime || '09:00',
        endTime: eventToEdit.endTime || '10:00',
        posterUrl: eventToEdit.posterUrl,
        rsvpLink: eventToEdit.rsvpLink || '',
        color: eventToEdit.color,
      });
    }
  }, [eventToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventData: Event = {
      ...formData,
      id: eventToEdit ? eventToEdit.id : Math.random().toString(36).substr(2, 9),
      date: new Date(formData.date).toISOString(),
    };
    
    if (eventToEdit && onUpdate) {
      onUpdate(eventData);
    } else {
      onAdd(eventData);
    }
    onClose();
  };

  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider";
  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-[#C28840] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5F1EB] dark:bg-slate-800 rounded-3xl w-full max-w-xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">{eventToEdit ? 'Edit Event' : 'Post New Event'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Icon name="X" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Event Title</label>
              <input 
                required
                className={inputClass}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Date</label>
              <input 
                required
                type="date"
                className={inputClass}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Start Time</label>
              <input 
                required
                type="time"
                className={inputClass}
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>End Time</label>
              <input 
                required
                type="time"
                className={inputClass}
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Description</label>
            <textarea 
              required
              rows={3}
              className={`${inputClass} resize-none`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Location / Venue</label>
              <input 
                className={inputClass}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Category</label>
              <select 
                className={inputClass}
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value as Event['category'];
                  setFormData({ ...formData, category: cat, color: CATEGORY_COLORS[cat] });
                }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Poster URL</label>
              <input 
                className={inputClass}
                value={formData.posterUrl}
                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>RSVP Link</label>
              <input 
                className={inputClass}
                value={formData.rsvpLink}
                onChange={(e) => setFormData({ ...formData, rsvpLink: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] px-6 py-4 bg-[#C28840] hover:bg-[#D39951] text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
            >
              {eventToEdit ? 'Update Event' : 'Confirm & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForm;
